use serde::Deserialize;
use specta::Type;
use tauri::{command, State};

use crate::DbConnection;

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct DeleteQuestRequest {
    id: String,
}

#[command]
#[specta::specta]
pub async fn delete_quest(
    state: State<'_, DbConnection>,
    props: DeleteQuestRequest,
) -> Result<(), String> {
    sqlx::query!("DELETE FROM quests WHERE id = $1", props.id)
        .execute(&state.db)
        .await
        .expect("Failed to delete quest");

    Ok(())
}
