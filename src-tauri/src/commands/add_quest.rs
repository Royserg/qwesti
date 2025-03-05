use serde::Deserialize;
use specta::Type;
use tauri::{command, State};
use uuid::Uuid;

use crate::{entities::Quest, models::QuestRow, DbConnection};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct AddQuestRequest {
    title: String,
    parent_id: Option<String>,
}

#[command]
#[specta::specta]
pub async fn add_quest(
    state: State<'_, DbConnection>,
    props: AddQuestRequest,
) -> Result<Quest, String> {
    let id = Uuid::now_v7().to_string();

    // TODO: remove this
    dbg!(&props.parent_id);

    // TODO: add created_at
    let inserted_quest = sqlx::query_as!(
        QuestRow,
        r#"
            INSERT INTO
                quests (id, title, completed, parent_id)
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                title,
                completed,
                created_at,
                completed_at,
                order_index
        "#,
        id,
        props.title,
        0,
        props.parent_id
    )
    .fetch_one(&state.db)
    .await
    .expect("Failed to insert quest");

    Ok(inserted_quest.into())
}
