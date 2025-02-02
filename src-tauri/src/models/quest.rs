use crate::utils::bool_from_int;
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, sqlx::FromRow, Type)]
#[serde(rename_all = "camelCase")]
pub struct Quest {
    pub id: String,
    pub title: String,
    #[serde(deserialize_with = "bool_from_int")]
    pub completed: bool,
    pub created_at: String,
}
