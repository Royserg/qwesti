use crate::{entities::Quest, repo, DbConnection};
use tauri::{command, State};

#[command]
#[specta::specta]
pub async fn update_quest(
    state: State<'_, DbConnection>,
    props: repo::UpdateQuestRequest,
) -> Result<Quest, String> {
    let quest =
        repo::update_quest_with_assets(&state.db, Some(&state.description_assets_dir), props)
        .await
        .expect("Failed to update a quest");

    Ok(quest.into())
}
