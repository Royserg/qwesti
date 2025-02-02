use tauri::{command, State};

use crate::models::Quest;
use crate::DbConnection;

#[command]
#[specta::specta]
pub async fn get_quests(state: State<'_, DbConnection>) -> Result<Vec<Quest>, String> {
    let quests = sqlx::query_as!(
        Quest,
        r#"
        SELECT
            id,
            title,
            completed,
            created_at
        FROM
            quests
        "#
    )
    .fetch_all(&state.db)
    .await
    .expect("Failed to fetch quests");

    Ok(quests)
}
