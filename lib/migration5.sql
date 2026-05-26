-- 补充索引迁移（在 migration2.sql 之后执行）

-- 文章列表查询优化
CREATE INDEX IF NOT EXISTS idx_posts_pub_created ON posts(published, created_at DESC, id DESC);

-- 评论查询优化
CREATE INDEX IF NOT EXISTS idx_comments_post_status ON comments(post_id, status, created_at);

-- 阅读计数查询优化
CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);

-- 多语言文章查询优化
CREATE INDEX IF NOT EXISTS idx_translations_post_lang ON post_translations(post_id, language);

-- 搜索限流查询优化（已在 migration2.sql 中创建）
-- CREATE INDEX IF NOT EXISTS idx_search_logs_ip ON search_logs(ip_address, created_at);
