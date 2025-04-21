use chrono::Local;
use serde::Deserialize;
use specta::Type;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

use crate::models::QuestRow;

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct AddQuestRequest {
    pub title: String,
    pub parent_id: Option<String>,
}

pub async fn add_quest(db_pool: &Pool<Sqlite>, data: AddQuestRequest) -> anyhow::Result<QuestRow> {
    let id = Uuid::now_v7().to_string();

    // Set creation date explicitly to local time (instead of default UTC)
    let today_date = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let quest = sqlx::query_as!(
        QuestRow,
        r#"
            INSERT INTO quests 
                (id, title, completed, created_at, parent_id)
            VALUES 
                ($1, $2, $3, $4, $5)
            RETURNING
                id,
                title,
                completed,
                created_at,
                completed_at,
                order_index,
                parent_id
        "#,
        id,
        data.title,
        0,
        today_date,
        data.parent_id
    )
    .fetch_one(db_pool)
    .await
    .expect("Failed to create a quest");

    Ok(quest)
}
