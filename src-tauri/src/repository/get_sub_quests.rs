use sqlx::{Pool, Sqlite};

use crate::{entities::Quest, models::QuestRow};

pub async fn get_sub_quests(db_pool: Pool<Sqlite>, quest_id: String) -> Result<Vec<Quest>, String> {
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
    .fetch_all(&db_pool)
    .await
    .expect("Failed to fetch sub quests");

    let quests = quests.into_iter().map(Quest::from).collect();

    Ok(quests)
}
