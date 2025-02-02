use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, sqlx::FromRow, sqlx::Type)]
pub struct QuestRow {
    pub id: String,
    pub title: String,
    pub completed: i64,
    pub created_at: String,
}
