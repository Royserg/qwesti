use anyhow::{anyhow, bail};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

pub const DESCRIPTION_ASSET_DIR: &str = "quest-description-assets";
pub const DESCRIPTION_ASSET_SCHEME: &str = "qwesti-asset://";
pub const STALE_DRAFT_TTL_HOURS: i64 = 24;

pub fn normalize_description(description: Option<String>) -> Option<String> {
    match description {
        Some(value) if value.trim().is_empty() => None,
        other => other,
    }
}

pub fn collect_description_asset_ids(markdown: &str) -> HashSet<String> {
    let mut ids = HashSet::new();
    let mut cursor = 0;

    while let Some(offset) = markdown[cursor..].find(DESCRIPTION_ASSET_SCHEME) {
        let asset_start = cursor + offset + DESCRIPTION_ASSET_SCHEME.len();
        let suffix = &markdown[asset_start..];
        let asset_len = suffix
            .find(|ch: char| !ch.is_ascii_alphanumeric() && ch != '-')
            .unwrap_or(suffix.len());

        if asset_len > 0 {
            ids.insert(suffix[..asset_len].to_string());
        }

        cursor = asset_start + asset_len;
    }

    ids
}

pub fn ensure_single_owner<'a>(
    quest_id: Option<&'a str>,
    draft_id: Option<&'a str>,
) -> anyhow::Result<AssetOwner<'a>> {
    match (quest_id, draft_id) {
        (Some(quest_id), None) => Ok(AssetOwner::Quest(quest_id)),
        (None, Some(draft_id)) => Ok(AssetOwner::Draft(draft_id)),
        _ => bail!("expected exactly one asset owner"),
    }
}

pub fn resolve_asset_extension(filename: Option<&str>, mime_type: &str) -> String {
    extension_from_filename(filename)
        .or_else(|| extension_from_mime(mime_type).map(ToOwned::to_owned))
        .unwrap_or_else(|| "bin".to_string())
}

fn extension_from_filename(filename: Option<&str>) -> Option<String> {
    let filename = filename?;

    let extension = Path::new(filename).extension()?.to_str()?;
    let normalized: String = extension
        .trim()
        .chars()
        .filter(|ch| ch.is_ascii_alphanumeric())
        .map(|ch| ch.to_ascii_lowercase())
        .take(16)
        .collect();

    if normalized.is_empty() {
        return None;
    }

    Some(normalized)
}

fn extension_from_mime(mime_type: &str) -> Option<&'static str> {
    match mime_type {
        "image/png" => Some("png"),
        "image/jpeg" | "image/jpg" => Some("jpg"),
        "image/webp" => Some("webp"),
        "image/gif" => Some("gif"),
        "image/svg+xml" => Some("svg"),
        "video/mp4" => Some("mp4"),
        "video/webm" => Some("webm"),
        "video/ogg" => Some("ogv"),
        "video/quicktime" => Some("mov"),
        "application/pdf" => Some("pdf"),
        "text/plain" => Some("txt"),
        "text/markdown" => Some("md"),
        "text/csv" => Some("csv"),
        "application/json" => Some("json"),
        "application/zip" => Some("zip"),
        _ => None,
    }
}

pub fn draft_relative_path(draft_id: &str, asset_id: &str, extension: &str) -> String {
    format!("drafts/{draft_id}/{asset_id}.{extension}")
}

pub fn quest_relative_path(quest_id: &str, asset_id: &str, extension: &str) -> String {
    format!("quests/{quest_id}/{asset_id}.{extension}")
}

pub fn extension_from_relative_path(relative_path: &str) -> anyhow::Result<&str> {
    Path::new(relative_path)
        .extension()
        .and_then(|value| value.to_str())
        .ok_or_else(|| anyhow!("asset path is missing an extension"))
}

pub fn resolve_asset_path(base_dir: &Path, relative_path: &str) -> PathBuf {
    base_dir.join(relative_path)
}

pub fn write_asset_bytes(base_dir: &Path, relative_path: &str, bytes: &[u8]) -> anyhow::Result<()> {
    let absolute_path = resolve_asset_path(base_dir, relative_path);
    if let Some(parent) = absolute_path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(absolute_path, bytes)?;
    Ok(())
}

pub fn move_asset_file(
    base_dir: &Path,
    from_relative_path: &str,
    to_relative_path: &str,
) -> anyhow::Result<()> {
    let from_path = resolve_asset_path(base_dir, from_relative_path);
    let to_path = resolve_asset_path(base_dir, to_relative_path);

    if let Some(parent) = to_path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::rename(&from_path, &to_path)?;
    prune_empty_parent_dirs(base_dir, &from_path);

    Ok(())
}

pub fn delete_asset_file(base_dir: &Path, relative_path: &str) -> anyhow::Result<()> {
    let absolute_path = resolve_asset_path(base_dir, relative_path);

    if absolute_path.exists() {
        fs::remove_file(&absolute_path)?;
        prune_empty_parent_dirs(base_dir, &absolute_path);
    }

    Ok(())
}

pub fn prune_empty_parent_dirs(base_dir: &Path, file_path: &Path) {
    let mut current = file_path.parent();

    while let Some(directory) = current {
        if directory == base_dir {
            break;
        }

        match fs::read_dir(directory) {
            Ok(entries) => {
                if entries.count() > 0 {
                    break;
                }

                if fs::remove_dir(directory).is_err() {
                    break;
                }
            }
            Err(_) => break,
        }

        current = directory.parent();
    }
}

pub fn collect_relative_files(base_dir: &Path) -> anyhow::Result<Vec<String>> {
    if !base_dir.exists() {
        return Ok(Vec::new());
    }

    let mut relative_files = Vec::new();
    collect_relative_files_inner(base_dir, base_dir, &mut relative_files)?;
    Ok(relative_files)
}

fn collect_relative_files_inner(
    base_dir: &Path,
    current_dir: &Path,
    relative_files: &mut Vec<String>,
) -> anyhow::Result<()> {
    for entry in fs::read_dir(current_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_dir() {
            collect_relative_files_inner(base_dir, &path, relative_files)?;
            continue;
        }

        let relative_path = path
            .strip_prefix(base_dir)
            .map_err(|err| anyhow!(err.to_string()))?
            .to_string_lossy()
            .replace('\\', "/");
        relative_files.push(relative_path);
    }

    Ok(())
}

pub enum AssetOwner<'a> {
    Quest(&'a str),
    Draft(&'a str),
}
