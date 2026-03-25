use crate::entities::QuestDescriptionAsset;
use crate::models::QuestRow;
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Type)]
#[serde(rename_all = "camelCase")]
pub struct Quest {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub order_index: i64,
    pub parent_id: Option<String>,
    pub has_children: Option<bool>,
    pub description_assets: Option<Vec<QuestDescriptionAsset>>,
    pub children: Option<Vec<Quest>>,
}

fn i64_to_bool(value: i64) -> bool {
    match value {
        0 => false,
        1 => true,
        _ => true,
    }
}

impl From<QuestRow> for Quest {
    fn from(qr: QuestRow) -> Self {
        Quest {
            id: qr.id,
            title: qr.title,
            description: qr.description,
            completed: i64_to_bool(qr.completed),
            created_at: qr.created_at,
            completed_at: qr.completed_at,
            order_index: qr.order_index,
            parent_id: qr.parent_id,
            // Override on demand, defaults to null
            has_children: None,
            description_assets: None,
            children: None,
        }
    }
}
