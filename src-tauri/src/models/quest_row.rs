use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, sqlx::FromRow, sqlx::Type)]
pub struct QuestRow {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: i64,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub order_index: i64,
    pub parent_id: Option<String>,
}
