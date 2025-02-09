use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::fs::create_dir_all;
use tauri::{AppHandle, Manager};

pub async fn setup_db(app: &AppHandle) -> Pool<Sqlite> {
    let db_name = "sqlite:qwesti.sqlite";
    let app_path = app
        .path()
        .app_config_dir()
        .expect("No App config path was found!");

    create_dir_all(&app_path).expect("Couldn't create app config dir");

    let conn_url = &path_mapper(app_path, db_name);

    #[cfg(all(target_os = "macos", debug_assertions))]
    let conn_url = "qwesti-dev.sqlite";

    if !Sqlite::database_exists(conn_url).await.unwrap_or(false) {
        Sqlite::create_database(conn_url)
            .await
            .expect("Failed to created DB");
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(conn_url)
        .await
        .unwrap();

    sqlx::migrate!().run(&pool).await.unwrap();

    pool
}

fn path_mapper(mut app_path: std::path::PathBuf, connection_string: &str) -> String {
    app_path.push(
        connection_string
            .split_once(':')
            .expect("Couldn't parse the connection string for DB!")
            .1,
    );

    format!(
        "sqlite:{}",
        app_path
            .to_str()
            .expect("Problem creating fully qualified path to Database file!")
    )
}
