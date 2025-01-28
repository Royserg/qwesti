mod db;
use specta_typescript::Typescript;
use sqlx::sqlite::SqlitePoolOptions;

use db::init_db;
use tauri::{path::PathResolver, AppHandle};
use tauri_specta::{collect_commands, Builder};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> anyhow::Result<()> {
    // TODO: read from env
    // let db_url = "sqlite://qwesti.db?mode=rwc".to_string();

    // let pool = SqlitePoolOptions::new()
    //     .max_connections(5)
    //     .connect("postgres://postgres:password@localhost/test")
    //     .await?;

    // let conn = Database::connect(db_url)
    //     .await
    //     .expect("Database connection failed");

    // Migrator::up(&conn, None).await.unwrap();

    // let builder = Builder::<tauri::Wry>::new()
    //     // Then register them (separated by a comma)
    //     .commands(collect_commands![
    //         create_connection,
    //         get_connections,
    //         get_today_bday_connections
    //     ]);
    // ---

    // tauri::Builder::default()
    //     .plugin(tauri_plugin_opener::init())
    //     .invoke_handler(tauri::generate_handler![greet])
    //     .run(tauri::generate_context!())
    //     .expect("error while running tauri application");

    let builder = Builder::<tauri::Wry>::new()
        // Then register them (separated by a comma)
        .commands(collect_commands![
        //     create_connection,
        //     get_connections,
        //     get_today_bday_connections
        ]);

    #[cfg(debug_assertions)] // <- Only export on non-release builds
    builder
        .export(Typescript::default(), "../src/bindings.ts")
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        // .manage(DbConnection { db: conn })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(builder.invoke_handler())
        // .setup(setup)
        .setup(move |app| {
            let _ = setup(app);

            // This is required if you want to use events
            builder.mount_events(app);
            Ok(())
        })
        // on an actual app, remove the string argument
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

fn setup<'a>(app: &'a mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().to_owned();

    tauri::async_runtime::spawn(async move {
        let init_db_res = init_db(&handle).await;
        match init_db_res {
            Ok(_) => {
                println!("DB init")
            }
            Err(err) => {
                println!("Failed to init DB");
                println!("{}", err);
            }
        }
    });

    Ok(())
}
