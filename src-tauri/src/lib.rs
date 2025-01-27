use sqlx::sqlite::SqlitePoolOptions;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub async fn run() -> anyhow::Result<()> {
    // TODO: read from env
    let db_url = "sqlite://qwesti.db?mode=rwc".to_string();

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect("postgres://postgres:password@localhost/test")
        .await?;

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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}
