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
    let date = date.unwrap_or_else(|| "now".to_string());

    println!("REQUESTED DATE: {}", date);

    // WHERE
    //     completed_at IS NULL
    //     OR
    //     Date(completed_at) = DATE($1)
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
            Date(completed_at) = DATE($1)
            OR
            Date(created_at) = DATE($1) AND completed_at IS NOT NULL
            OR
            (completed_at IS NULL AND Date(created_at) <= Date($1))
        ORDER BY
            created_at DESC
        "#,
        date,
    )
    .fetch_all(&state.db)
    .await
    .expect("Failed to fetch quests");

    let quests = quests.into_iter().map(Quest::from).collect();

    Ok(quests)
}
