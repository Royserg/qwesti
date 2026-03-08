use std::ops::DerefMut;
use std::path::Path;

use chrono::Local;
use serde::Deserialize;
use specta::Type;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

use crate::models::QuestRow;
use crate::repo::promote_description_draft_assets;
use crate::utils::{collect_description_asset_ids, delete_asset_file, normalize_description};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type, Default)]
pub struct AddQuestRequest {
    pub title: String,
    pub parent_id: Option<String>,
    #[specta(optional)]
    pub description: Option<String>,
    #[specta(optional)]
    pub description_draft_id: Option<String>,
}

pub async fn add_quest(db_pool: &Pool<Sqlite>, data: AddQuestRequest) -> anyhow::Result<QuestRow> {
    add_quest_with_assets(db_pool, None, data).await
}

pub async fn add_quest_with_assets(
    db_pool: &Pool<Sqlite>,
    assets_dir: Option<&Path>,
    data: AddQuestRequest,
) -> anyhow::Result<QuestRow> {
    let id = Uuid::now_v7().to_string();
    let parent_id = data.parent_id.clone();
    let description = normalize_description(data.description);
    let description_draft_id = data.description_draft_id.clone();

    // Set creation date explicitly to local time (instead of default UTC)
    let today_date = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    if description_draft_id.is_none()
        && description
            .as_deref()
            .is_some_and(|value| !collect_description_asset_ids(value).is_empty())
    {
        anyhow::bail!("description references uploaded assets without a draft owner");
    }

    if description_draft_id.is_some() && assets_dir.is_none() {
        anyhow::bail!("description drafts require asset storage");
    }

    let mut tx = db_pool.begin().await.expect("failed to begin transaction");

    let quest = sqlx::query_as::<_, QuestRow>(
        r#"
            INSERT INTO quests
                (id, title, description, completed, created_at, parent_id)
            VALUES
                (?1, ?2, ?3, ?4, ?5, ?6)
            RETURNING
                id,
                title,
                description,
                completed,
                created_at,
                completed_at,
                order_index,
                parent_id
        "#,
    )
    .bind(&id)
    .bind(&data.title)
    .bind(&description)
    .bind(0)
    .bind(&today_date)
    .bind(&parent_id)
    .fetch_one(tx.deref_mut())
    .await
    .expect("Failed to create a quest");

    if parent_id.is_some() {
        sqlx::query(
            r#"
            UPDATE quests
            SET
                completed = 0, completed_at = NULL
            WHERE id = ?1;
            "#,
        )
        .bind(parent_id.as_deref())
        .execute(tx.deref_mut())
        .await
        .expect("Failed to update parent quest");
    }

    let mut files_to_delete_after_commit = Vec::new();

    if let Some(draft_id) = description_draft_id.as_deref() {
        files_to_delete_after_commit.extend(
            promote_description_draft_assets(
                tx.deref_mut(),
                assets_dir.expect("asset dir should be available for draft promotion"),
                &id,
                draft_id,
                description.as_deref(),
            )
            .await?,
        );
    }

    tx.commit().await.expect("Failed to commit transaction");

    if let Some(assets_dir) = assets_dir {
        for relative_path in files_to_delete_after_commit {
            let _ = delete_asset_file(assets_dir, &relative_path);
        }
    }

    Ok(quest)
}
