ALTER TABLE quests ADD COLUMN description TEXT;

CREATE TABLE quest_description_assets (
    id TEXT PRIMARY KEY NOT NULL,
    quest_id TEXT,
    draft_id TEXT,
    relative_path TEXT NOT NULL UNIQUE,
    original_filename TEXT,
    mime_type TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (quest_id IS NOT NULL AND draft_id IS NULL)
        OR
        (quest_id IS NULL AND draft_id IS NOT NULL)
    ),
    FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);

CREATE INDEX quest_description_assets_quest_id_idx
    ON quest_description_assets(quest_id);

CREATE INDEX quest_description_assets_draft_id_idx
    ON quest_description_assets(draft_id);
