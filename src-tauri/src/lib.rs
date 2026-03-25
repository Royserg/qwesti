mod commands;
use commands::{
    add_quest, delete_quest, discard_description_draft, get_quest, get_quests, get_sub_quests,
    move_quest, update_quest, update_quests_order, upload_description_asset,
    upload_description_image,
};
use futures::executor::block_on;

mod db;
mod entities;
mod models;
mod repo;
mod tests;
mod utils;

use specta_typescript::{BigIntExportBehavior, Typescript};
use sqlx::{Pool, Sqlite};
use std::fs::create_dir_all;

use db::setup_db;
use repo::cleanup_description_storage;
use tauri::Manager;
use tauri_specta::{collect_commands, Builder};
use utils::DESCRIPTION_ASSET_DIR;

struct DbConnection {
    db: Pool<Sqlite>,
    description_assets_dir: std::path::PathBuf,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> anyhow::Result<()> {
    let builder = Builder::<tauri::Wry>::new()
        // Then register them (separated by a comma)
        .commands(collect_commands![
            get_quests,
            get_sub_quests,
            get_quest,
            add_quest,
            update_quest,
            delete_quest,
            update_quests_order,
            move_quest,
            upload_description_asset,
            upload_description_image,
            discard_description_draft,
        ]);

    // Export config
    let default_ts_config = Typescript::default().bigint(BigIntExportBehavior::Number);

    #[cfg(all(target_os = "macos", debug_assertions))] // <- Only export on non-release builds
    builder
        .export(default_ts_config, "../src/bindings.ts")
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            let handle = app.handle().clone();

            block_on(async {
                let app_config_dir = handle
                    .path()
                    .app_config_dir()
                    .expect("No App config path was found!");
                create_dir_all(&app_config_dir).expect("Couldn't create app config dir");
                let description_assets_dir = app_config_dir.join(DESCRIPTION_ASSET_DIR);
                create_dir_all(&description_assets_dir)
                    .expect("Couldn't create description asset dir");
                let db = setup_db(&handle).await;
                cleanup_description_storage(&db, &description_assets_dir)
                    .await
                    .expect("Failed to cleanup description storage");

                handle.manage(DbConnection {
                    db,
                    description_assets_dir,
                });
            });

            // This is required if you want to use events
            builder.mount_events(app);
            Ok(())
        })
        // on an actual app, remove the string argument
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
