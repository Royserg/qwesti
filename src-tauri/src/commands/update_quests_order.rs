use std::ops::DerefMut;

use crate::DbConnection;
use serde::Deserialize;
use specta::Type;
use tauri::{command, State};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct UpdateQuestsOrderRequest {
    ids: Vec<String>,
}

#[command]
#[specta::specta]
pub async fn update_quests_order(
    state: State<'_, DbConnection>,
    props: UpdateQuestsOrderRequest,
) -> Result<(), String> {
    let mut tx = state.db.begin().await.expect("failed to begin transaction");

    for (idx, id) in props.ids.into_iter().enumerate() {
        let index: i64 = idx.try_into().unwrap();

        sqlx::query(
            r#"
            UPDATE quests
            SET order_index = ?1
            WHERE id = ?2;
        "#,
        )
        .bind(index)
        .bind(id)
        .execute(tx.deref_mut())
        .await
        .expect("failed to update");
    }

    tx.commit().await.expect("Failed to commit transaction");

    Ok(())
}
