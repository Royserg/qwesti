use chrono::Local;
use futures::stream::{self, StreamExt};
use serde::Deserialize;
use specta::Type;
use sqlx::QueryBuilder;
use tauri::{command, State};

use crate::entities::Quest;
use crate::models::QuestRow;
use crate::repo;
use crate::DbConnection;

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct GetQuestsRequest {
    date: Option<String>,
    filter: String,
}

#[command]
#[specta::specta]
pub async fn get_quests(
    state: State<'_, DbConnection>,
    props: GetQuestsRequest,
) -> Result<Vec<Quest>, String> {
    let today_date = Local::now().format("%Y-%m-%d").to_string();
    let date = props.date.unwrap_or_else(|| today_date.clone());

    // For dates in the past, show only completed Quests
    // Not completed carry over to the current date
    if date == today_date {
        let mut query = QueryBuilder::new(
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
        "#,
        );

        // Only root level quests (not attached to another)
        query.push(" parent_id IS NULL");

        /*
         * Main query for all quests for selected date
         * all completed quests for date
         * and not-completed with creation date between past-date
         * (in case support for planning future quests is implemented)
         * then filter results based on provided: completed | pending | all (no change)
         */
        query
            .push(" AND (")
            .push("Date(completed_at) = DATE(")
            .push_bind(date.clone())
            .push(")"); // closes DATE()
        query
            .push(" OR (completed_at IS NULL AND Date(created_at) <= Date(")
            .push_bind(date.clone())
            .push("))");
        query.push(")"); // closing whole expression

        // filter
        match props.filter.as_str() {
            "completed" => {
                query.push(" AND completed = 1");
            }
            "pending" => {
                query.push(" AND completed = 0");
            }
            _ => {}
        };

        query.push(" ORDER BY order_index, created_at DESC;");
        let query = query.build_query_as::<QuestRow>();
        let quest_rows = query
            .fetch_all(&state.db)
            .await
            .expect("Failed to qet quests");

        let quests: Vec<Quest> = stream::iter(quest_rows)
            .then(|row| {
                let value = state.clone();
                async move {
                    let sub_quests = repo::get_sub_quests(&value.db, row.id.clone())
                        .await
                        .expect("Failed to get subquests");
                    let sub_quests: Vec<Quest> = sub_quests.into_iter().map(Quest::from).collect();

                    Quest {
                        has_children: Some(!sub_quests.is_empty()),
                        children: Some(sub_quests),
                        ..Quest::from(row)
                    }
                }
            })
            .collect()
            .await;

        Ok(quests)
    } else {
        // There is no filter support for past dates
        let quest_rows = sqlx::query_as!(
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
            Date(completed_at) = DATE($1)
            AND
            parent_id IS NULL
        ORDER BY
            order_index, created_at DESC
        "#,
            date,
        )
        .fetch_all(&state.db)
        .await
        .expect("Failed to fetch quests");

        let quests: Vec<Quest> = stream::iter(quest_rows)
            .then(|row| {
                let value = state.clone();
                async move {
                    let sub_quests = repo::get_sub_quests(&value.db, row.id.clone())
                        .await
                        .expect("Failed to get subquests");
                    let sub_quests: Vec<Quest> = sub_quests.into_iter().map(Quest::from).collect();

                    Quest {
                        has_children: Some(!sub_quests.is_empty()),
                        children: Some(sub_quests),
                        ..Quest::from(row)
                    }
                }
            })
            .collect()
            .await;

        Ok(quests)
    }
}
