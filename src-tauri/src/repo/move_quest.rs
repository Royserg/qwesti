use std::ops::DerefMut;

use serde::Deserialize;
use specta::Type;
use sqlx::{Pool, Sqlite};

use crate::models::QuestRow;

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct MoveQuestRequest {
    pub id: String,
    pub parent_id: Option<String>,
    pub index: i64,
}

pub async fn move_quest(db_pool: &Pool<Sqlite>, req: MoveQuestRequest) -> anyhow::Result<QuestRow> {
    if req.index < 0 {
        anyhow::bail!("move index must be zero or greater");
    }

    if req.parent_id.as_deref() == Some(req.id.as_str()) {
        anyhow::bail!("task cannot be moved into itself");
    }

    let mut tx = db_pool.begin().await?;

    let moving_quest = sqlx::query_as::<_, QuestRow>(
        r#"
        SELECT
            id,
            title,
            description,
            completed,
            created_at,
            completed_at,
            order_index,
            parent_id
        FROM
            quests
        WHERE
            id = ?1
        "#,
    )
    .bind(&req.id)
    .fetch_optional(tx.deref_mut())
    .await?
    .ok_or_else(|| anyhow::anyhow!("task not found"))?;

    if let Some(target_parent_id) = &req.parent_id {
        let mut current_parent_id = Some(target_parent_id.clone());

        while let Some(parent_id) = current_parent_id {
            if parent_id == moving_quest.id {
                anyhow::bail!("task cannot be moved into its descendant");
            }

            current_parent_id = sqlx::query_scalar::<_, Option<String>>(
                r#"
                SELECT parent_id
                FROM quests
                WHERE id = ?1
                "#,
            )
            .bind(&parent_id)
            .fetch_optional(tx.deref_mut())
            .await?
            .ok_or_else(|| anyhow::anyhow!("target parent not found"))?;
        }
    }

    let source_sibling_ids = load_sibling_ids(tx.deref_mut(), moving_quest.parent_id.as_deref()).await?;
    let source_index = source_sibling_ids
        .iter()
        .position(|id| id == &moving_quest.id)
        .ok_or_else(|| anyhow::anyhow!("task not found in its sibling list"))?;

    let source_parent_id = moving_quest.parent_id.clone();
    let same_parent_move = source_parent_id == req.parent_id;

    let target_sibling_ids = if same_parent_move {
        source_sibling_ids
            .iter()
            .filter(|id| *id != &moving_quest.id)
            .cloned()
            .collect::<Vec<_>>()
    } else {
        load_sibling_ids(tx.deref_mut(), req.parent_id.as_deref()).await?
    };

    let raw_index = usize::try_from(req.index)?;
    let adjusted_index = if same_parent_move && raw_index > source_index {
        raw_index - 1
    } else {
        raw_index
    };
    let target_index = adjusted_index.min(target_sibling_ids.len());

    if same_parent_move && target_index == source_index {
        tx.commit().await?;
        return Ok(moving_quest);
    }

    if same_parent_move {
        let mut reordered_ids = target_sibling_ids;
        reordered_ids.insert(target_index, moving_quest.id.clone());
        write_sibling_order(tx.deref_mut(), &reordered_ids, source_parent_id.as_deref()).await?;
    } else {
        write_sibling_order(tx.deref_mut(), &source_sibling_ids
            .iter()
            .filter(|id| *id != &moving_quest.id)
            .cloned()
            .collect::<Vec<_>>(), source_parent_id.as_deref()).await?;

        let mut reordered_target_ids = target_sibling_ids;
        reordered_target_ids.insert(target_index, moving_quest.id.clone());
        write_sibling_order(
            tx.deref_mut(),
            &reordered_target_ids,
            req.parent_id.as_deref(),
        )
        .await?;

        if let Some(target_parent_id) = &req.parent_id {
            sqlx::query(
                r#"
                UPDATE quests
                SET
                    completed = 0,
                    completed_at = NULL
                WHERE id = ?1
                "#,
            )
            .bind(target_parent_id)
            .execute(tx.deref_mut())
            .await?;
        }
    }

    let moved_quest = sqlx::query_as::<_, QuestRow>(
        r#"
        SELECT
            id,
            title,
            description,
            completed,
            created_at,
            completed_at,
            order_index,
            parent_id
        FROM
            quests
        WHERE
            id = ?1
        "#,
    )
    .bind(&moving_quest.id)
    .fetch_one(tx.deref_mut())
    .await?;

    tx.commit().await?;

    Ok(moved_quest)
}

async fn load_sibling_ids(
    executor: &mut sqlx::SqliteConnection,
    parent_id: Option<&str>,
) -> anyhow::Result<Vec<String>> {
    let ids = sqlx::query_scalar::<_, String>(
        r#"
        SELECT
            id
        FROM
            quests
        WHERE
            parent_id IS ?1
        ORDER BY
            order_index,
            created_at DESC
        "#,
    )
    .bind(parent_id)
    .fetch_all(executor)
    .await?;

    Ok(ids)
}

async fn write_sibling_order(
    executor: &mut sqlx::SqliteConnection,
    ids: &[String],
    parent_id: Option<&str>,
) -> anyhow::Result<()> {
    for (index, id) in ids.iter().enumerate() {
        let order_index = i64::try_from(index)?;
        sqlx::query(
            r#"
            UPDATE quests
            SET
                order_index = ?1,
                parent_id = ?2
            WHERE id = ?3
            "#,
        )
        .bind(order_index)
        .bind(parent_id)
        .bind(id)
        .execute(&mut *executor)
        .await?;
    }

    Ok(())
}
