use chrono::Local;
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
    let today_date = Local::now().format("%Y-%m-%d").to_string();
    let date = date.unwrap_or_else(|| today_date.clone());

    // For dates in the past, show only completed Quests
    // Not completed carry over to the current date
    if date == today_date {
        // TODO: convert to queryBuilder, add filter property
        let quests = sqlx::query_as!(
            QuestRow,
            r#"
        SELECT
            id,
            title,
            completed,
            created_at,
            completed_at,
            order_index,
            parent_id
        FROM
            quests
        WHERE
            Date(completed_at) = DATE($1)
                AND
            parent_id IS NULL
            OR
            (completed_at IS NULL AND Date(created_at) <= Date($1))
                AND
            parent_id IS NULL
        ORDER BY
            order_index, created_at DESC
        "#,
            date,
        )
        .fetch_all(&state.db)
        .await
        .expect("Failed to fetch quests");

        let quests = quests.into_iter().map(Quest::from).collect();

        Ok(quests)
    } else {
        let quests = sqlx::query_as!(
            QuestRow,
            r#"
        SELECT
            id,
            title,
            completed,
            created_at,
            completed_at,
            order_index,
            parent_id
        FROM
            quests
        WHERE
            Date(completed_at) = DATE($1)
            AND
            parent_id IS NULL
        ORDER BY
            order_index, created_at DESC
        "#,
            date,
        )
        .fetch_all(&state.db)
        .await
        .expect("Failed to fetch quests");

        let quests = quests.into_iter().map(Quest::from).collect();

        Ok(quests)
    }
}
