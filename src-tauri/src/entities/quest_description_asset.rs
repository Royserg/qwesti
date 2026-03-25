use crate::models::QuestDescriptionAssetRow;
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Type)]
#[serde(rename_all = "camelCase")]
pub struct QuestDescriptionAsset {
    pub id: String,
    pub quest_id: Option<String>,
    pub draft_id: Option<String>,
    pub relative_path: String,
    pub original_filename: Option<String>,
    pub mime_type: String,
    pub byte_size: i64,
    pub created_at: String,
}

impl From<QuestDescriptionAssetRow> for QuestDescriptionAsset {
    fn from(row: QuestDescriptionAssetRow) -> Self {
        Self {
            id: row.id,
            quest_id: row.quest_id,
            draft_id: row.draft_id,
            relative_path: row.relative_path,
            original_filename: row.original_filename,
            mime_type: row.mime_type,
            byte_size: row.byte_size,
            created_at: row.created_at,
        }
    }
}
