use tauri::{command, State};

use crate::{entities::Quest, repo, DbConnection};

#[command]
#[specta::specta]
pub async fn add_quest(
    state: State<'_, DbConnection>,
    props: repo::AddQuestRequest,
) -> Result<Quest, String> {
    let quest = repo::add_quest_with_assets(&state.db, Some(&state.description_assets_dir), props)
        .await
        .expect("Failed to create a quest");

    Ok(quest.into())
}
