use tauri::{command, State};

use crate::entities::{Quest, QuestDescriptionAsset};
use crate::models::QuestRow;
use crate::repo;
use crate::DbConnection;

#[command]
#[specta::specta]
pub async fn get_quest(state: State<'_, DbConnection>, id: String) -> Result<Quest, String> {
    let quest = sqlx::query_as::<_, QuestRow>(
        r#"
        SELECT
            id,
            title,
            description,
            completed,
            created_at,
            completed_at,
            order_index,
            parent_id
        FROM
            quests
        WHERE
            id = ?1 ;
        "#,
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .expect("Failed to fetch quests");

    let description_assets = repo::get_quest_description_assets(&state.db, &id)
        .await
        .map_err(|err| err.to_string())?
        .into_iter()
        .map(QuestDescriptionAsset::from)
        .collect();

    Ok(Quest {
        description_assets: Some(description_assets),
        ..quest.into()
    })
}
