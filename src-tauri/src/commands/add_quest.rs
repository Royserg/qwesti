use chrono::Local;
use serde::Deserialize;
use specta::Type;
use tauri::{command, State};
use uuid::Uuid;

use crate::{entities::Quest, models::QuestRow, DbConnection};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct AddQuestRequest {
    title: String,
    parent_id: Option<String>,
}

#[command]
#[specta::specta]
pub async fn add_quest(
    state: State<'_, DbConnection>,
    props: AddQuestRequest,
) -> Result<Quest, String> {
    let id = Uuid::now_v7().to_string();

    // Set creation date explicitly to local time (instead of default UTC)
    let today_date = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let inserted_quest = sqlx::query_as!(
        QuestRow,
        r#"
            INSERT INTO
                quests (id, title, completed, created_at, parent_id)
            VALUES ($1, $2, $3, $4, $5)
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
        props.title,
        0,
        today_date,
        props.parent_id
    )
    .fetch_one(&state.db)
    .await
    .expect("Failed to insert quest");

    Ok(inserted_quest.into())
}
