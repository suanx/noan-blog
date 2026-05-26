-- i18n: post_translations table
CREATE TABLE IF NOT EXISTS post_translations (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id  INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  language TEXT    NOT NULL DEFAULT 'en',
  title    TEXT    NOT NULL,
  slug     TEXT    NOT NULL,
  content  TEXT    NOT NULL,
  excerpt  TEXT,
  UNIQUE(language, slug)
);

CREATE INDEX IF NOT EXISTS idx_post_translations_post ON post_translations(post_id);

-- Migrate existing posts data into post_translations (language = 'en')
INSERT INTO post_translations (post_id, language, title, slug, content, excerpt)
SELECT id, 'en', title, slug, content, excerpt FROM posts
WHERE title IS NOT NULL;
