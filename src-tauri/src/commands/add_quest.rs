use serde::Deserialize;
use specta::Type;
use tauri::{command, State};
use uuid::Uuid;

use crate::{entities::Quest, models::QuestRow, DbConnection};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct AddQuestRequest {
    title: String,
}

#[command]
#[specta::specta]
pub async fn add_quest(
    state: State<'_, DbConnection>,
    props: AddQuestRequest,
) -> Result<Quest, String> {
    let id = Uuid::now_v7().to_string();

    let inserted_quest = sqlx::query_as!(
        QuestRow,
        r#"
            INSERT INTO
                quests (id, title, completed)
            VALUES ($1, $2, $3)
            RETURNING
                id,
                title,
                completed,
                created_at
        "#,
        id,
        props.title,
        0
    )
    .fetch_one(&state.db)
    .await
    .expect("Failed to insert quest");

    Ok(inserted_quest.into())
}
