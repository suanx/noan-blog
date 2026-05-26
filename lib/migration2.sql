-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title, content, excerpt,
  content='posts',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- Triggers to keep posts_fts in sync with posts
CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
  INSERT INTO posts_fts (rowid, title, content, excerpt)
  VALUES (new.id, new.title, new.content, new.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
  INSERT INTO posts_fts (posts_fts, rowid, title, content, excerpt)
  VALUES ('delete', old.id, old.title, old.content, old.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
  INSERT INTO posts_fts (posts_fts, rowid, title, content, excerpt)
  VALUES ('delete', old.id, old.title, old.content, old.excerpt);
  INSERT INTO posts_fts (rowid, title, content, excerpt)
  VALUES (new.id, new.title, new.content, new.excerpt);
END;

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name TEXT    NOT NULL,
  author_email TEXT   NOT NULL,
  content     TEXT    NOT NULL,
  status      TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','spam')),
  ip_address  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_ip ON comments(ip_address, created_at);

-- Post views counter
CREATE TABLE IF NOT EXISTS post_views (
  post_id    INTEGER PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  views      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Search rate limiting log
CREATE TABLE IF NOT EXISTS search_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_search_logs_ip ON search_logs(ip_address, created_at);

-- FTS5 for post_translations (multi-language search)
CREATE VIRTUAL TABLE IF NOT EXISTS post_translations_fts USING fts5(
  title, content, excerpt,
  content='post_translations',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- Triggers to keep post_translations_fts in sync
CREATE TRIGGER IF NOT EXISTS post_translations_ai AFTER INSERT ON post_translations BEGIN
  INSERT INTO post_translations_fts (rowid, title, content, excerpt)
  VALUES (new.id, new.title, new.content, new.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS post_translations_ad AFTER DELETE ON post_translations BEGIN
  INSERT INTO post_translations_fts (post_translations_fts, rowid, title, content, excerpt)
  VALUES ('delete', old.id, old.title, old.content, old.excerpt);
END;

CREATE TRIGGER IF NOT EXISTS post_translations_au AFTER UPDATE ON post_translations BEGIN
  INSERT INTO post_translations_fts (post_translations_fts, rowid, title, content, excerpt)
  VALUES ('delete', old.id, old.title, old.content, old.excerpt);
  INSERT INTO post_translations_fts (rowid, title, content, excerpt)
  VALUES (new.id, new.title, new.content, new.excerpt);
END;
