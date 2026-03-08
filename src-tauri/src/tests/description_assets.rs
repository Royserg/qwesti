use std::env::temp_dir;
use std::fs::{create_dir_all, remove_dir_all};
use std::path::{Path, PathBuf};

use crate::models::QuestRow;
use crate::repo;
use crate::tests::db_setup::setup;
use uuid::Uuid;

fn create_assets_dir() -> anyhow::Result<PathBuf> {
    let assets_dir = temp_dir().join(format!("qwesti-description-tests-{}", Uuid::now_v7()));
    create_dir_all(&assets_dir)?;
    Ok(assets_dir)
}

fn cleanup_assets_dir(assets_dir: &Path) {
    if assets_dir.exists() {
        let _ = remove_dir_all(assets_dir);
    }
}

fn image_markdown(asset_id: &str) -> String {
    format!("![image](qwesti-asset://{asset_id})")
}

#[tokio::test]
async fn add_quest_persists_text_description() -> anyhow::Result<()> {
    let pool = setup().await;

    let quest = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Quest".to_string(),
            description: Some("Ship **description** support".to_string()),
            ..Default::default()
        },
    )
    .await?;

    let stored_quest = sqlx::query_as::<_, QuestRow>(
        r#"
        SELECT * FROM quests
        WHERE id = ?1
        "#,
    )
    .bind(&quest.id)
    .fetch_one(&pool)
    .await?;

    assert_eq!(
        stored_quest.description.as_deref(),
        Some("Ship **description** support")
    );

    Ok(())
}

#[tokio::test]
async fn add_quest_promotes_draft_description_assets() -> anyhow::Result<()> {
    let pool = setup().await;
    let assets_dir = create_assets_dir()?;
    let draft_id = Uuid::now_v7().to_string();

    let uploaded_asset = repo::upload_description_image(
        &pool,
        &assets_dir,
        repo::UploadDescriptionImageRequest {
            quest_id: None,
            draft_id: Some(draft_id.clone()),
            filename: Some("clipboard.png".to_string()),
            mime_type: "image/png".to_string(),
            bytes: vec![1, 2, 3, 4],
        },
    )
    .await?;

    let draft_asset_path = assets_dir.join(&uploaded_asset.relative_path);
    assert!(draft_asset_path.exists());

    let quest = repo::add_quest_with_assets(
        &pool,
        Some(&assets_dir),
        repo::AddQuestRequest {
            title: "Quest".to_string(),
            description: Some(image_markdown(&uploaded_asset.id)),
            description_draft_id: Some(draft_id.clone()),
            ..Default::default()
        },
    )
    .await?;

    let promoted_assets = repo::get_quest_description_assets(&pool, &quest.id).await?;
    assert_eq!(promoted_assets.len(), 1);
    assert_eq!(promoted_assets[0].quest_id.as_deref(), Some(quest.id.as_str()));
    assert_eq!(promoted_assets[0].draft_id, None);
    assert!(promoted_assets[0].relative_path.starts_with(&format!("quests/{}/", quest.id)));
    assert!(!draft_asset_path.exists());
    assert!(assets_dir.join(&promoted_assets[0].relative_path).exists());

    cleanup_assets_dir(&assets_dir);

    Ok(())
}

#[tokio::test]
async fn discard_description_draft_removes_files_and_rows() -> anyhow::Result<()> {
    let pool = setup().await;
    let assets_dir = create_assets_dir()?;
    let draft_id = Uuid::now_v7().to_string();

    let uploaded_asset = repo::upload_description_image(
        &pool,
        &assets_dir,
        repo::UploadDescriptionImageRequest {
            quest_id: None,
            draft_id: Some(draft_id.clone()),
            filename: Some("draft.png".to_string()),
            mime_type: "image/png".to_string(),
            bytes: vec![9, 8, 7],
        },
    )
    .await?;

    repo::discard_description_draft(&pool, &assets_dir, &draft_id).await?;

    let remaining_assets = sqlx::query_as::<_, crate::models::QuestDescriptionAssetRow>(
        r#"
        SELECT * FROM quest_description_assets
        WHERE draft_id = ?1
        "#,
    )
    .bind(&draft_id)
    .fetch_all(&pool)
    .await?;

    assert!(remaining_assets.is_empty());
    assert!(!assets_dir.join(uploaded_asset.relative_path).exists());

    cleanup_assets_dir(&assets_dir);

    Ok(())
}

#[tokio::test]
async fn update_quest_prunes_unreferenced_description_assets() -> anyhow::Result<()> {
    let pool = setup().await;
    let assets_dir = create_assets_dir()?;

    let quest = repo::add_quest(
        &pool,
        repo::AddQuestRequest {
            title: "Quest".to_string(),
            ..Default::default()
        },
    )
    .await?;

    let uploaded_asset = repo::upload_description_image(
        &pool,
        &assets_dir,
        repo::UploadDescriptionImageRequest {
            quest_id: Some(quest.id.clone()),
            draft_id: None,
            filename: Some("quest.png".to_string()),
            mime_type: "image/png".to_string(),
            bytes: vec![4, 3, 2, 1],
        },
    )
    .await?;

    let description = image_markdown(&uploaded_asset.id);
    repo::update_quest_with_assets(
        &pool,
        Some(&assets_dir),
        repo::UpdateQuestRequest {
            id: quest.id.clone(),
            data: repo::UpdateQuestData {
                description: Some(description),
                ..Default::default()
            },
        },
    )
    .await?;

    let image_path = assets_dir.join(&uploaded_asset.relative_path);
    assert!(image_path.exists());

    repo::update_quest_with_assets(
        &pool,
        Some(&assets_dir),
        repo::UpdateQuestRequest {
            id: quest.id.clone(),
            data: repo::UpdateQuestData {
                description: Some(String::new()),
                ..Default::default()
            },
        },
    )
    .await?;

    let remaining_assets = repo::get_quest_description_assets(&pool, &quest.id).await?;
    assert!(remaining_assets.is_empty());
    assert!(!image_path.exists());

    cleanup_assets_dir(&assets_dir);

    Ok(())
}
