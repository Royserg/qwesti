use futures::stream::{self, StreamExt};
use tauri::{command, State};

use crate::entities::Quest;
use crate::repo;
use crate::DbConnection;

#[command]
#[specta::specta]
pub async fn get_quests(
    state: State<'_, DbConnection>,
    props: repo::GetQuestsRequest,
) -> Result<Vec<Quest>, String> {
    let quest_rows = repo::get_quests(&state.db, props)
        .await
        .expect("Failed to get quests");

    let quests: Vec<Quest> = stream::iter(quest_rows)
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
