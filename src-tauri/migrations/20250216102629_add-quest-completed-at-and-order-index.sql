ALTER TABLE quests
  ADD completed_at TEXT;

ALTER TABLE quests
  ADD order_index INTEGER NOT NULL DEFAULT 0;



