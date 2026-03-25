use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, sqlx::FromRow, sqlx::Type)]
pub struct QuestDescriptionAssetRow {
    pub id: String,
    pub quest_id: Option<String>,
    pub draft_id: Option<String>,
    pub relative_path: String,
    pub original_filename: Option<String>,
    pub mime_type: String,
    pub byte_size: i64,
    pub created_at: String,
}
