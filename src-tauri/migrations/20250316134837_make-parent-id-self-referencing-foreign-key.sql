
PRAGMA foreign_keys = OFF;

-- 1. Rename the old table
ALTER TABLE quests RENAME TO quests_old;

-- 2. Create the new table with the foreign key
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

-- 3. Copy data from the old table to the new one
INSERT INTO quests SELECT * FROM quests_old;

-- 4. Drop the old table
DROP TABLE quests_old;

PRAGMA foreign_keys = ON;
