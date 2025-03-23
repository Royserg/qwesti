mod commands;
use commands::{
    add_quest, delete_quest, get_quest, get_quests, get_sub_quests, update_quest,
    update_quests_order,
};
use futures::executor::block_on;

mod db;
mod entities;
mod models;
mod utils;

use specta_typescript::{BigIntExportBehavior, Typescript};
use sqlx::{Pool, Sqlite};

use db::setup_db;
use tauri::Manager;
use tauri_specta::{collect_commands, Builder};

struct DbConnection {
    db: Pool<Sqlite>,
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
        ]);

    // Export config
    let default_ts_config = Typescript::default().bigint(BigIntExportBehavior::Number);

    #[cfg(all(target_os = "macos", debug_assertions))] // <- Only export on non-release builds
    builder
        .export(default_ts_config, "../src/bindings.ts")
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            let handle = app.handle().clone();

            block_on(async {
                let db = setup_db(&handle).await;
                handle.manage(DbConnection { db });
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
