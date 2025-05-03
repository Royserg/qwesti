use crate::models::QuestRow;
use chrono::Local;
use serde::Deserialize;
use specta::Type;
use sqlx::{Pool, QueryBuilder, Sqlite};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct GetQuestsRequest {
    pub date: Option<String>,
    // TODO: convert to ENUM: 'all' | 'pending' | 'completed' and make it optional
    pub filter: String,
}

pub async fn get_quests(
    db_pool: &Pool<Sqlite>,
    props: GetQuestsRequest,
) -> anyhow::Result<Vec<QuestRow>> {
    let today_date = Local::now().format("%Y-%m-%d").to_string();
    let date = props.date.unwrap_or_else(|| today_date.clone());

    // For dates in the past, show only completed Quests
    // Not completed carry over to the current date
    if date == today_date {
        let mut query = QueryBuilder::new(
            r#"
        WITH computed_quests AS (
            SELECT
                quests.id,
                quests.title,
                quests.created_at,
                quests.order_index,
                quests.parent_id,

                -- NOTE: Copmpleted = 0 or 1. MIN(subquests) will guarantee that all quests are completed to be '1'
                CASE WHEN COUNT(subquests.id) > 0
                    THEN MIN(subquests.completed)
                    ELSE quests.completed
                END AS completed,

                CASE WHEN COUNT(subquests.id) > 0
                    THEN MAX(subquests.completed_at)
                    ELSE quests.completed_at
                END AS completed_at

            FROM
                quests
            LEFT JOIN
                quests AS subquests ON subquests.parent_id = quests.id
            GROUP BY quests.id
        )
        SELECT
            id,
            title,
            created_at,
            completed,
            completed_at,
            order_index,
            parent_id
        FROM
            computed_quests
        WHERE
        "#,
        );

        // Only root level quests
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
            .push("DATE(completed_at) = DATE(")
            .push_bind(date.clone())
            .push(")"); // closes DATE()
        query
            .push(" OR (completed_at IS NULL AND DATE(created_at) <= DATE(")
            .push_bind(date.clone())
            .push("))");
        query.push(")"); // closing whole expression

        // Apply filter based on computed 'completed'
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
            .fetch_all(db_pool)
            .await
            .expect("Failed to fetch quests");

        Ok(quest_rows)
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
        .fetch_all(db_pool)
        .await
        .expect("Failed to fetch quests");

        Ok(quest_rows)
    }
}
