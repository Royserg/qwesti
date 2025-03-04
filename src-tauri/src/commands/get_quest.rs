use tauri::{command, State};

use crate::entities::Quest;
use crate::models::QuestRow;
use crate::DbConnection;

#[command]
#[specta::specta]
pub async fn get_quest(state: State<'_, DbConnection>, id: String) -> Result<Quest, String> {
    let quest = sqlx::query_as!(
        QuestRow,
        r#"
        SELECT
            id,
            title,
            completed,
            created_at,
            completed_at,
            order_index
        FROM
            quests
        WHERE
            id = $1 ;
        "#,
        id
    )
    .fetch_one(&state.db)
    .await
    .expect("Failed to fetch quests");

    println!("Quest: {:?}", quest);

    // let quest = quest.into_iter().map(Quest::from).collect();

    Ok(quest.into())
}
