use tauri::{command, State};

use crate::{entities::Quest, repo, DbConnection};

#[command]
#[specta::specta]
pub async fn move_quest(
    state: State<'_, DbConnection>,
    props: repo::MoveQuestRequest,
) -> Result<Quest, String> {
    let quest = repo::move_quest(&state.db, props)
        .await
        .map_err(|err| err.to_string())?;

    Ok(quest.into())
}
