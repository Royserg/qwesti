use crate::tests::db_setup::setup;

#[tokio::test]
async fn complete_quest() -> Result<(), sqlx::Error> {
    let pool = setup().await;

    // Insert test data
    // sqlx::query("INSERT INTO quests (name) VALUES ('Walking')")
    //     .execute(&pool)
    //     .await?;

    // Verify insertion
    let user: (String,) = sqlx::query_as("SELECT title FROM quests")
        .fetch_one(&pool)
        .await?;

    assert_eq!(user.0, "Walking");
    Ok(())
}
