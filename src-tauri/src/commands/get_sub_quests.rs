use tauri::{command, State};

use crate::entities::Quest;
use crate::models::QuestRow;
use crate::repo;
use crate::DbConnection;
use futures::stream::{self, StreamExt};

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
            order_index, created_at DESC
        "#,
        quest_id
    )
    .fetch_all(&state.db)
    .await
    .expect("Failed to fetch sub quests");

    let quests: Vec<Quest> = stream::iter(quests)
        .then(|row| {
            let value = state.clone();
            async move {
                let sub_quests = repo::get_sub_quests(&value.db, row.id.clone())
                    .await
                    .expect("Failed to get subquests");
                let sub_quests: Vec<Quest> = sub_quests.into_iter().map(Quest::from).collect();

                Quest {
                    has_children: Some(!sub_quests.is_empty()),
                    children: Some(sub_quests),
                    ..Quest::from(row)
                }
            }
        })
        .collect()
        .await;

    Ok(quests)
}
