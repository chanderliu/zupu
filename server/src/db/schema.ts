export const SCHEMA = `
CREATE TABLE IF NOT EXISTS family_trees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tree_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'male',
  generation INTEGER NOT NULL DEFAULT 1,
  father_id INTEGER,
  mother_id INTEGER,
  spouse_id INTEGER,
  birth_year TEXT DEFAULT '',
  death_year TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE,
  FOREIGN KEY (father_id) REFERENCES family_members(id) ON DELETE SET NULL,
  FOREIGN KEY (mother_id) REFERENCES family_members(id) ON DELETE SET NULL,
  FOREIGN KEY (spouse_id) REFERENCES family_members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tree_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tree_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  ocr_result TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (tree_id) REFERENCES family_trees(id) ON DELETE CASCADE
);
`;
