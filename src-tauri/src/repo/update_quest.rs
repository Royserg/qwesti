use crate::models::QuestRow;
use chrono::Local;
use serde::Deserialize;
use specta::Type;
use sqlx::{Pool, QueryBuilder, Sqlite};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct UpdateQuestRequest {
    pub id: String,
    pub data: UpdateQuestData,
}

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct UpdateQuestData {
    #[specta(optional)]
    pub title: Option<String>,
    #[specta(optional)]
    pub completed: Option<bool>,
}

pub async fn update_quest(
    db_pool: &Pool<Sqlite>,
    req: UpdateQuestRequest,
) -> anyhow::Result<QuestRow> {
    let mut query: QueryBuilder<Sqlite> = QueryBuilder::new(
        r#"
        UPDATE quests
    "#,
    );

    let data = req.data;

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
            let today_date = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
            query.push(", completed_at = ");
            query.push_bind(today_date);
        } else {
            query.push(", completed_at = NULL ");
        };
    } else {
        query.push(" completed = completed ");
    }

    query.push(" WHERE id = ");
    query.push_bind(req.id);

    query
        .push(" RETURNING id, title, completed, created_at, completed_at, order_index, parent_id;");

    let query = query.build_query_as::<QuestRow>();
    let quest = query
        .fetch_one(db_pool)
        .await
        .expect("Failed to update quest");

    Ok(quest)
}
