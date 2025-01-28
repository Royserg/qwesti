use std::path::Path;

use sqlx::{migrate::MigrateDatabase, sqlite::SqlitePool, Sqlite};
use tauri::{AppHandle, Manager};

pub async fn init_db(app: &AppHandle) -> anyhow::Result<()> {
    let resource_dir = app
        .path()
        .resource_dir()
        .expect("Failed to get resource dir");

    let db_path = resource_dir.to_owned().join("qwesti.db");
    let db_path_str = db_path
        .to_str()
        .ok_or(anyhow::anyhow!("Failed to turn path into string"))?;

    if !Path::new(db_path_str).exists() {
        dbg!("DB file didn't exist, creating at: {:?}", db_path_str);

        Sqlite::create_database(&db_path_str).await?;
    }

    dbg!("Initializing database: {:?}", &db_path_str);

    let db_pool = SqlitePool::connect(&db_path_str).await?;
    sqlx::migrate!().run(&db_pool).await?;

    Ok(())
    // Ok(db_pool)
}
