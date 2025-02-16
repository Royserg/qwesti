ALTER TABLE quests
  ADD completed_at TEXT;

ALTER TABLE quests
  ADD order_index INTEGER DEFAULT 0;



