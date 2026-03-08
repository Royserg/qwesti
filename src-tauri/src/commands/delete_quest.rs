use serde::Deserialize;
use specta::Type;
use tauri::{command, State};

use crate::repo;
use crate::utils::delete_asset_file;
use crate::DbConnection;

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct DeleteQuestRequest {
    id: String,
}

#[command]
#[specta::specta]
pub async fn delete_quest(
    state: State<'_, DbConnection>,
    props: DeleteQuestRequest,
) -> Result<(), String> {
    let description_assets = repo::get_quest_description_assets(&state.db, &props.id)
        .await
        .map_err(|err| err.to_string())?;

    sqlx::query("DELETE FROM quests WHERE id = ?1")
        .bind(&props.id)
        .execute(&state.db)
        .await
        .expect("Failed to delete quest");

    for asset in description_assets {
        let _ = delete_asset_file(&state.description_assets_dir, &asset.relative_path);
    }

    Ok(())
}
