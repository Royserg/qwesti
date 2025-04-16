
CREATE TABLE quests (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,

    parent_id TEXT,
    FOREIGN KEY (parent_id) REFERENCES quests(id) ON DELETE CASCADE
);


