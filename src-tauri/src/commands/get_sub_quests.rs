use tauri::{command, State};

use crate::entities::Quest;
use crate::repo;
use crate::DbConnection;
use futures::stream::{self, StreamExt};

#[command]
#[specta::specta]
pub async fn get_sub_quests(
    state: State<'_, DbConnection>,
    quest_id: String,
) -> Result<Vec<Quest>, String> {
    let quests = repo::get_sub_quests(&state.db, quest_id)
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
