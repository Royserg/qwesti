use tauri::{command, State};

use crate::entities::Quest;
use crate::models::QuestRow;
use crate::DbConnection;

#[command]
#[specta::specta]
pub async fn get_sub_quests(
    state: State<'_, DbConnection>,
    quest_id: String,
) -> Result<Vec<Quest>, String> {
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
            parent_id IS $1
        ORDER BY
            created_at DESC
        "#,
        quest_id
    )
    .fetch_all(&state.db)
    .await
    .expect("Failed to fetch sub quests");

    let quests = quests.into_iter().map(Quest::from).collect();

    Ok(quests)
}
