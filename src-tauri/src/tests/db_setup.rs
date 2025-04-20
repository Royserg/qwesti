use sqlx::{migrate::Migrator, SqlitePool};
use std::path::Path;
use uuid::Uuid;

// TODO: consider creating a database instead of in-memory
pub async fn setup() -> SqlitePool {
    let db_name = Uuid::now_v7().to_string();
    dbg!(&db_name);

    // Create a connection URL for a named in-memory database with shared cache
    // let database_url = format!("sqlite:///file:{}?mode=memory&cache=shared", db_name);
    let database_url = "sqlite://:memory:".to_string();

    // Connect to the database
    let pool = SqlitePool::connect(&database_url).await.unwrap();

    // Path to migrations directory
    let migrations_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("migrations");
    // Initialize migrator
    Migrator::new(migrations_path)
        .await
        .expect("Failed to find migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    pool
}
