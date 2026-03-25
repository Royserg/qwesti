use std::collections::HashSet;
use std::path::Path;

use anyhow::{anyhow, bail};
use serde::Deserialize;
use specta::Type;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

use crate::models::QuestDescriptionAssetRow;
use crate::utils::{
    collect_description_asset_ids, collect_relative_files, delete_asset_file, draft_relative_path,
    ensure_single_owner, extension_from_relative_path, move_asset_file, resolve_asset_extension,
    prune_empty_parent_dirs, quest_relative_path, resolve_asset_path, write_asset_bytes,
    AssetOwner, STALE_DRAFT_TTL_HOURS,
};

#[derive(Deserialize, Debug, Clone, PartialEq, Eq, Type)]
pub struct UploadDescriptionAssetRequest {
    pub quest_id: Option<String>,
    pub draft_id: Option<String>,
    pub filename: Option<String>,
    pub mime_type: String,
    pub bytes: Vec<u8>,
}

pub type UploadDescriptionImageRequest = UploadDescriptionAssetRequest;

pub async fn upload_description_asset(
    db_pool: &Pool<Sqlite>,
    assets_dir: &Path,
    req: UploadDescriptionAssetRequest,
) -> anyhow::Result<QuestDescriptionAssetRow> {
    if req.bytes.is_empty() {
        bail!("asset payload is empty");
    }

    let extension = resolve_asset_extension(req.filename.as_deref(), &req.mime_type);
    let asset_id = Uuid::now_v7().to_string();
    let owner = ensure_single_owner(req.quest_id.as_deref(), req.draft_id.as_deref())?;
    let relative_path = match owner {
        AssetOwner::Quest(quest_id) => quest_relative_path(quest_id, &asset_id, &extension),
        AssetOwner::Draft(draft_id) => draft_relative_path(draft_id, &asset_id, &extension),
    };

    write_asset_bytes(assets_dir, &relative_path, &req.bytes)?;

    let insert_result = sqlx::query_as::<_, QuestDescriptionAssetRow>(
        r#"
        INSERT INTO quest_description_assets (
            id,
            quest_id,
            draft_id,
            relative_path,
            original_filename,
            mime_type,
            byte_size
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
        RETURNING
            id,
            quest_id,
            draft_id,
            relative_path,
            original_filename,
            mime_type,
            byte_size,
            created_at
        "#,
    )
    .bind(&asset_id)
    .bind(req.quest_id)
    .bind(req.draft_id)
    .bind(&relative_path)
    .bind(req.filename)
    .bind(req.mime_type)
    .bind(i64::try_from(req.bytes.len())?)
    .fetch_one(db_pool)
    .await;

    match insert_result {
        Ok(asset) => Ok(asset),
        Err(err) => {
            let _ = delete_asset_file(assets_dir, &relative_path);
            Err(err.into())
        }
    }
}

pub async fn upload_description_image(
    db_pool: &Pool<Sqlite>,
    assets_dir: &Path,
    req: UploadDescriptionImageRequest,
) -> anyhow::Result<QuestDescriptionAssetRow> {
    upload_description_asset(db_pool, assets_dir, req).await
}

pub async fn get_quest_description_assets(
    db_pool: &Pool<Sqlite>,
    quest_id: &str,
) -> anyhow::Result<Vec<QuestDescriptionAssetRow>> {
    sqlx::query_as::<_, QuestDescriptionAssetRow>(
        r#"
        SELECT
            id,
            quest_id,
            draft_id,
            relative_path,
            original_filename,
            mime_type,
            byte_size,
            created_at
        FROM quest_description_assets
        WHERE quest_id = ?1
        ORDER BY created_at ASC
        "#,
    )
    .bind(quest_id)
    .fetch_all(db_pool)
    .await
    .map_err(Into::into)
}

pub async fn discard_description_draft(
    db_pool: &Pool<Sqlite>,
    assets_dir: &Path,
    draft_id: &str,
) -> anyhow::Result<()> {
    let assets = sqlx::query_as::<_, QuestDescriptionAssetRow>(
        r#"
        SELECT
            id,
            quest_id,
            draft_id,
            relative_path,
            original_filename,
            mime_type,
            byte_size,
            created_at
        FROM quest_description_assets
        WHERE draft_id = ?1
        "#,
    )
    .bind(draft_id)
    .fetch_all(db_pool)
    .await?;

    sqlx::query("DELETE FROM quest_description_assets WHERE draft_id = ?1")
        .bind(draft_id)
        .execute(db_pool)
        .await?;

    for asset in assets {
        let _ = delete_asset_file(assets_dir, &asset.relative_path);
    }

    let draft_dir = assets_dir.join("drafts").join(draft_id);
    prune_empty_parent_dirs(assets_dir, &draft_dir.join("placeholder"));

    Ok(())
}

pub async fn cleanup_description_storage(
    db_pool: &Pool<Sqlite>,
    assets_dir: &Path,
) -> anyhow::Result<()> {
    cleanup_stale_description_drafts(db_pool, assets_dir).await?;

    let known_paths: HashSet<String> = sqlx::query_scalar(
        r#"
        SELECT relative_path
        FROM quest_description_assets
        "#,
    )
    .fetch_all(db_pool)
    .await?
    .into_iter()
    .collect();

    for relative_path in collect_relative_files(assets_dir)? {
        if !known_paths.contains(&relative_path) {
            let _ = delete_asset_file(assets_dir, &relative_path);
        }
    }

    Ok(())
}

pub async fn promote_description_draft_assets(
    conn: &mut sqlx::SqliteConnection,
    assets_dir: &Path,
    quest_id: &str,
    draft_id: &str,
    description: Option<&str>,
) -> anyhow::Result<Vec<String>> {
    let draft_assets = get_draft_assets_with_conn(conn, draft_id).await?;
    let referenced_ids = description
        .map(collect_description_asset_ids)
        .unwrap_or_default();

    validate_asset_references(
        &referenced_ids,
        &draft_assets.iter().map(|asset| asset.id.clone()).collect(),
    )?;

    let mut moved_assets = Vec::new();
    let mut files_to_delete_after_commit = Vec::new();

    for asset in &draft_assets {
        if referenced_ids.contains(&asset.id) {
            let extension = extension_from_relative_path(&asset.relative_path)?;
            let next_relative_path = quest_relative_path(quest_id, &asset.id, extension);
            move_asset_file(assets_dir, &asset.relative_path, &next_relative_path)?;
            moved_assets.push((next_relative_path.clone(), asset.relative_path.clone()));

            if let Err(err) = sqlx::query(
                r#"
                UPDATE quest_description_assets
                SET
                    quest_id = ?1,
                    draft_id = NULL,
                    relative_path = ?2
                WHERE id = ?3
                "#,
            )
            .bind(quest_id)
            .bind(&next_relative_path)
            .bind(&asset.id)
            .execute(&mut *conn)
            .await
            {
                revert_asset_moves(assets_dir, &moved_assets);
                return Err(err.into());
            }

            continue;
        }

        sqlx::query("DELETE FROM quest_description_assets WHERE id = ?1")
            .bind(&asset.id)
            .execute(&mut *conn)
            .await?;
        files_to_delete_after_commit.push(asset.relative_path.clone());
    }

    Ok(files_to_delete_after_commit)
}

pub async fn reconcile_quest_description_assets(
    conn: &mut sqlx::SqliteConnection,
    quest_id: &str,
    description: Option<&str>,
) -> anyhow::Result<Vec<String>> {
    let quest_assets = get_quest_assets_with_conn(conn, quest_id).await?;
    let referenced_ids = description
        .map(collect_description_asset_ids)
        .unwrap_or_default();

    validate_asset_references(
        &referenced_ids,
        &quest_assets.iter().map(|asset| asset.id.clone()).collect(),
    )?;

    let mut files_to_delete_after_commit = Vec::new();

    for asset in quest_assets {
        if referenced_ids.contains(&asset.id) {
            continue;
        }

        sqlx::query("DELETE FROM quest_description_assets WHERE id = ?1")
            .bind(&asset.id)
            .execute(&mut *conn)
            .await?;
        files_to_delete_after_commit.push(asset.relative_path);
    }

    Ok(files_to_delete_after_commit)
}

async fn cleanup_stale_description_drafts(
    db_pool: &Pool<Sqlite>,
    assets_dir: &Path,
) -> anyhow::Result<()> {
    let cutoff = format!("-{} hours", STALE_DRAFT_TTL_HOURS);
    let stale_assets = sqlx::query_as::<_, QuestDescriptionAssetRow>(
        r#"
        SELECT
            id,
            quest_id,
            draft_id,
            relative_path,
            original_filename,
            mime_type,
            byte_size,
            created_at
        FROM quest_description_assets
        WHERE draft_id IS NOT NULL
          AND created_at < datetime('now', ?1)
        "#,
    )
    .bind(cutoff)
    .fetch_all(db_pool)
    .await?;

    if stale_assets.is_empty() {
        return Ok(());
    }

    sqlx::query(
        r#"
        DELETE FROM quest_description_assets
        WHERE draft_id IS NOT NULL
          AND created_at < datetime('now', ?1)
        "#,
    )
    .bind(format!("-{} hours", STALE_DRAFT_TTL_HOURS))
    .execute(db_pool)
    .await?;

    for asset in stale_assets {
        let _ = delete_asset_file(assets_dir, &asset.relative_path);
    }

    Ok(())
}

async fn get_quest_assets_with_conn(
    conn: &mut sqlx::SqliteConnection,
    quest_id: &str,
) -> anyhow::Result<Vec<QuestDescriptionAssetRow>> {
    sqlx::query_as::<_, QuestDescriptionAssetRow>(
        r#"
        SELECT
            id,
            quest_id,
            draft_id,
            relative_path,
            original_filename,
            mime_type,
            byte_size,
            created_at
        FROM quest_description_assets
        WHERE quest_id = ?1
        ORDER BY created_at ASC
        "#,
    )
    .bind(quest_id)
    .fetch_all(&mut *conn)
    .await
    .map_err(Into::into)
}

async fn get_draft_assets_with_conn(
    conn: &mut sqlx::SqliteConnection,
    draft_id: &str,
) -> anyhow::Result<Vec<QuestDescriptionAssetRow>> {
    sqlx::query_as::<_, QuestDescriptionAssetRow>(
        r#"
        SELECT
            id,
            quest_id,
            draft_id,
            relative_path,
            original_filename,
            mime_type,
            byte_size,
            created_at
        FROM quest_description_assets
        WHERE draft_id = ?1
        ORDER BY created_at ASC
        "#,
    )
    .bind(draft_id)
    .fetch_all(&mut *conn)
    .await
    .map_err(Into::into)
}

fn validate_asset_references(
    referenced_ids: &HashSet<String>,
    available_ids: &HashSet<String>,
) -> anyhow::Result<()> {
    let unknown_ids: Vec<String> = referenced_ids
        .iter()
        .filter(|asset_id| !available_ids.contains(*asset_id))
        .cloned()
        .collect();

    if unknown_ids.is_empty() {
        return Ok(());
    }

    Err(anyhow!(
        "description referenced unknown assets: {}",
        unknown_ids.join(", ")
    ))
}

fn revert_asset_moves(assets_dir: &Path, moved_assets: &[(String, String)]) {
    for (destination, source) in moved_assets.iter().rev() {
        let destination_path = resolve_asset_path(assets_dir, destination);
        if !destination_path.exists() {
            continue;
        }

        let _ = move_asset_file(assets_dir, destination, source);
    }
}
