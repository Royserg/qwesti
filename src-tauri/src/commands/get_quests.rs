use tauri::{command, State};

use crate::entities::Quest;
use crate::models::QuestRow;
use crate::DbConnection;

#[command]
#[specta::specta]
pub async fn get_quests(
    state: State<'_, DbConnection>,
    date: Option<String>,
) -> Result<Vec<Quest>, String> {
    let date = date.unwrap_or_else(|| "2025-02-17".to_string());

    println!("REQUESTED DATE: {}", date);

    let quests = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT
            id,
            title,
            completed,
            created_at,
            completed_at,
            order_index
        FROM
            quests
        WHERE
            completed_at IS NULL
            OR
            Date(completed_at) = DATE('now')
        ORDER BY
            created_at DESC
        "#
    )
    .fetch_all(&state.db)
    .await
    .expect("Failed to fetch quests");

    let quests = quests.into_iter().map(Quest::from).collect();

    Ok(quests)
}
