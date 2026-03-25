use serde::Deserialize;
use specta::Type;
use tauri::{command, State};

use crate::{repo, DbConnection};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct DiscardDescriptionDraftRequest {
    pub draft_id: String,
}

#[command]
#[specta::specta]
pub async fn discard_description_draft(
    state: State<'_, DbConnection>,
    props: DiscardDescriptionDraftRequest,
) -> Result<(), String> {
    repo::discard_description_draft(&state.db, &state.description_assets_dir, &props.draft_id)
        .await
        .map_err(|err| err.to_string())
}
