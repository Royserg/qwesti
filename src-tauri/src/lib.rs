mod commands;
use commands::{add_quest, get_quests};

mod db;
mod models;
mod utils;

use specta_typescript::{BigIntExportBehavior, Typescript};
use sqlx::{Pool, Sqlite};

use db::init_db;
use tauri_specta::{collect_commands, Builder};

struct DbConnection {
    db: Pool<Sqlite>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> anyhow::Result<()> {
    let init_db_res = init_db().await;
    let db_pool = match init_db_res {
        Ok(pool) => {
            println!("DB init");
            pool
        }
        Err(_err) => {
            println!("Failed to init DB");
            panic!("Failed to init db")
        }
    };

    // let specta_config = ExportConfiguration::new().bigint(specta::ts::BigIntExportBehavior::Number);
    let builder = Builder::<tauri::Wry>::new()
        // Then register them (separated by a comma)
        .commands(collect_commands![get_quests, add_quest,]);

    // Export config
    let mut default_ts_config = Typescript::default();
    default_ts_config = default_ts_config.bigint(BigIntExportBehavior::Number);

    #[cfg(debug_assertions)] // <- Only export on non-release builds
    builder
        .export(default_ts_config, "../src/bindings.ts")
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .manage(DbConnection { db: db_pool })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            // This is required if you want to use events
            builder.mount_events(app);
            Ok(())
        })
        // on an actual app, remove the string argument
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
