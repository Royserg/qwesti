use crate::models::QuestRow;
use sqlx::{Pool, Sqlite};

pub async fn get_sub_quests(
    db_pool: &Pool<Sqlite>,
    quest_id: String,
) -> anyhow::Result<Vec<QuestRow>> {
    let quests = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT
            id,
            title,
            completed,
            created_at,
            completed_at,
            order_index,
            parent_id
        FROM
            quests
        WHERE
            parent_id IS $1
        ORDER BY
            order_index, created_at DESC
        "#,
        quest_id
    )
    .fetch_all(db_pool)
    .await
    .expect("Failed to fetch sub quests");

    Ok(quests)
}
