use tauri::{command, State};

use crate::entities::QuestDescriptionAsset;
use crate::{repo, DbConnection};

#[command]
#[specta::specta]
pub async fn upload_description_image(
    state: State<'_, DbConnection>,
    props: repo::UploadDescriptionImageRequest,
) -> Result<QuestDescriptionAsset, String> {
    let asset = repo::upload_description_image(&state.db, &state.description_assets_dir, props)
        .await
        .map_err(|err| err.to_string())?;

    Ok(asset.into())
}
