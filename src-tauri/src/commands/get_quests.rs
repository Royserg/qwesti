use serde::Serialize;
use specta::Type;
use tauri::{command, State};

use crate::DbConnection;

#[derive(Serialize, Type, Debug, PartialEq, Eq, sqlx::FromRow)]
pub struct Quest {
    id: i64,
    title: String,
    completed: i64,
    created_at: String,
}

#[command]
#[specta::specta]
pub async fn get_quests(state: State<'_, DbConnection>) -> Result<Vec<Quest>, String> {
    let quests = sqlx::query_as!(Quest, "SELECT * FROM quests")
        .fetch_all(&state.db)
        .await
        .expect("Failed to fetch quests");

    Ok(quests)
}
