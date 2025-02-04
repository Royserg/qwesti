use std::path::Path;

use sqlx::{
    migrate::MigrateDatabase,
    sqlite::{SqlitePool, SqlitePoolOptions},
    Sqlite,
};

fn verify_folders() -> Result<String, std::io::Error> {
    let db_name = "database.db";
    let home_dir = dirs::home_dir().unwrap();

    let config_dir = home_dir.to_str().unwrap().to_string() + "/.config";
    let config_dir_exists: bool = Path::new(&config_dir).is_dir();
    dbg!("config dir exists: {?:}", config_dir_exists);

    let db_dir = home_dir.to_str().unwrap().to_string() + "/.config/qwesti";
    let db_dir_exists: bool = Path::new(&db_dir).is_dir();

    if !db_dir_exists {
        std::fs::create_dir_all(&db_dir)?;
    }

    Ok(db_dir + "/" + db_name)
}

pub async fn init_db() -> anyhow::Result<SqlitePool> {
    #[cfg(not(debug_assertions))]
    let db_path = verify_folders().unwrap();

    #[cfg(debug_assertions)]
    let db_path = "database.db".to_string();

    if !Path::new(&db_path).exists() {
        dbg!("DB file didn't exist, creating at: {:?}", &db_path);

        Sqlite::create_database(&db_path).await?;
    }

    dbg!("Initializing database: {:?}", &db_path);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_path)
        .await?;

    sqlx::migrate!().run(&pool).await?;

    Ok(pool)
}
