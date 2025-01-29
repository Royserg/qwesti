use std::path::Path;

use sqlx::{
    migrate::MigrateDatabase,
    sqlite::{SqlitePool, SqlitePoolOptions},
    Sqlite,
};
use tauri::{
    path::{self, BaseDirectory, PathResolver},
    AppHandle, Manager,
};

pub async fn init_db() -> anyhow::Result<SqlitePool> {
    // TODO: enable for deployment/built
    let home_dir = dirs::home_dir().unwrap();
    let db_path = home_dir.to_str().unwrap().to_string() + "/.config/qwesti/database.db";
    // Development: current di

    dbg!("+++++++++++++");
    dbg!(db_path);
    dbg!("+++++++++++++");

    let dev_db_path = "database.db";
    if !Path::new(dev_db_path).exists() {
        dbg!("DB file didn't exist, creating at: {:?}", dev_db_path);

        Sqlite::create_database(&dev_db_path).await?;
    }

    dbg!("Initializing database: {:?}", &dev_db_path);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&dev_db_path)
        .await?;

    // // let db_pool = SqlitePool::connect(&db_path_str).await?;

    sqlx::migrate!().run(&pool).await?;

    Ok(pool)
    // Ok(())
}
