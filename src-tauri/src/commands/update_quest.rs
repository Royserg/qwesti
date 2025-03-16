use serde::Deserialize;
use specta::Type;
use sqlx::{QueryBuilder, Sqlite};
use tauri::{command, State};

use crate::{entities::Quest, models::QuestRow, DbConnection};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct UpdateQuestRequest {
    id: String,
    data: UpdateQuestData,
}

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct UpdateQuestData {
    #[specta(optional)]
    title: Option<String>,
    #[specta(optional)]
    completed: Option<bool>,
}

#[command]
#[specta::specta]
pub async fn update_quest(
    state: State<'_, DbConnection>,
    props: UpdateQuestRequest,
) -> Result<Quest, String> {
    let mut query: QueryBuilder<Sqlite> = QueryBuilder::new(
        r#"
        UPDATE quests
    "#,
    );

    let data = props.data;

    if let Some(title) = data.title {
        query.push(" SET title = ");
        query.push_bind(title);
        query.push(",");
    } else {
        query.push(" SET title = title, ");
    }

    if let Some(completed) = data.completed {
        query.push(" completed = ");
        let completed_as_int = if completed { 1 } else { 0 };
        query.push_bind(completed_as_int);

        if completed {
            query.push(", completed_at = CURRENT_TIMESTAMP ");
        } else {
            query.push(", completed_at = NULL ");
        };
    } else {
        query.push(" completed = completed ");
    }

    query.push(" WHERE id = ");
    query.push_bind(props.id);

    query
        .push(" RETURNING id, title, completed, created_at, completed_at, order_index, parent_id;");

    let query = query.build_query_as::<QuestRow>();
    let quest_row = query
        .fetch_one(&state.db)
        .await
        .expect("Failed to update quest");

    Ok(quest_row.into())
}
