use crate::models::QuestRow;
use chrono::Local;
use serde::Deserialize;
use specta::Type;
use sqlx::{Pool, QueryBuilder, Sqlite};
use std::ops::DerefMut;
use std::path::Path;

use crate::repo::reconcile_quest_description_assets;
use crate::utils::{delete_asset_file, normalize_description};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct UpdateQuestRequest {
    pub id: String,
    pub data: UpdateQuestData,
}

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type, Default)]
pub struct UpdateQuestData {
    #[specta(optional)]
    pub title: Option<String>,
    #[specta(optional)]
    pub description: Option<String>,
    #[specta(optional)]
    pub completed: Option<bool>,
}

pub async fn update_quest(
    db_pool: &Pool<Sqlite>,
    req: UpdateQuestRequest,
) -> anyhow::Result<QuestRow> {
    update_quest_with_assets(db_pool, None, req).await
}

pub async fn update_quest_with_assets(
    db_pool: &Pool<Sqlite>,
    assets_dir: Option<&Path>,
    req: UpdateQuestRequest,
) -> anyhow::Result<QuestRow> {
    let mut tx = db_pool.begin().await.expect("failed to begin transaction");
    let mut query: QueryBuilder<Sqlite> = QueryBuilder::new(
        r#"
        UPDATE quests
    "#,
    );

    let data = req.data;
    let mut description_updated = false;

    if let Some(title) = data.title {
        query.push(" SET title = ");
        query.push_bind(title);
        query.push(",");
    } else {
        query.push(" SET title = title, ");
    }

    if let Some(description) = data.description {
        description_updated = true;
        query.push(" description = ");

        if let Some(value) = normalize_description(Some(description)) {
            query.push_bind(value);
        } else {
            query.push("NULL");
        }

        query.push(",");
    } else {
        query.push(" description = description, ");
    }

    if let Some(completed) = data.completed {
        query.push(" completed = ");
        let completed_as_int = if completed { 1 } else { 0 };
        query.push_bind(completed_as_int);

        if completed {
            let today_date = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            query.push(", completed_at = ");
            query.push_bind(today_date);
        } else {
            query.push(", completed_at = NULL ");
        };
    } else {
        query.push(" completed = completed ");
    }

    query.push(" WHERE id = ");
    query.push_bind(req.id);

    query.push(
        " RETURNING id, title, description, completed, created_at, completed_at, order_index, parent_id;",
    );

    let query = query.build_query_as::<QuestRow>();
    let quest = query
        .fetch_one(tx.deref_mut())
        .await
        .expect("Failed to update quest");

    let mut files_to_delete_after_commit = Vec::new();
    if description_updated {
        if assets_dir.is_none() {
            anyhow::bail!("description updates require asset storage");
        }

        files_to_delete_after_commit = reconcile_quest_description_assets(
            tx.deref_mut(),
            &quest.id,
            quest.description.as_deref(),
        )
        .await?;
    }

    tx.commit().await.expect("Failed to commit transaction");

    if let Some(assets_dir) = assets_dir {
        for relative_path in files_to_delete_after_commit {
            let _ = delete_asset_file(assets_dir, &relative_path);
        }
    }

    Ok(quest)
}
