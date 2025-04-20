use crate::tests::db_setup::setup;

#[tokio::test]
async fn test_migrations_applied() {
    let pool = setup().await;

    // Verify migrations worked
    let result: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM sqlite_master")
        .fetch_one(&pool)
        .await
        .unwrap();

    assert!(result.0 > 0, "No tables found - migrations failed");
}
