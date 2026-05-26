import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getLanguageFromRequest } from "@/lib/i18n";

const SEARCH_RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

function getIp(request) {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",").pop().trim() : "unknown";
}

export async function GET(request) {
  try {
    const ip = getIp(request);

    // 数据库限流检查
    const recent = await executeQuery(
      `SELECT COUNT(*) as cnt FROM search_logs 
       WHERE ip_address = ? AND created_at > datetime('now', '-1 minute')`,
      [ip]
    );
    if (recent.rows[0].cnt >= SEARCH_RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "搜索请求过于频繁，请稍后再试。" },
        { status: 429 }
      );
    }

    // 记录搜索日志
    await executeQuery(
      "INSERT INTO search_logs (ip_address, created_at) VALUES (?, datetime('now'))",
      [ip]
    );

    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const lang = getLanguageFromRequest(request);

    if (!q || q.length < 2) {
      return NextResponse.json({ rows: [] });
    }

    const sanitized = q.replace(/['"]/g, "");
    const result = await executeQuery(
      `SELECT p.id, p.slug, p.cover_image, p.created_at,
              COALESCE(t.title, p.title) AS title,
              COALESCE(t.excerpt, p.excerpt) AS excerpt,
              COALESCE(snippet(posts_fts, 1, '<mark>', '</mark>', '...', 40),
                       snippet(post_translations_fts, 1, '<mark>', '</mark>', '...', 40)) AS title_hl,
              COALESCE(snippet(posts_fts, 2, '<mark>', '</mark>', '...', 60),
                       snippet(post_translations_fts, 2, '<mark>', '</mark>', '...', 60)) AS content_hl,
              COALESCE(v.views, 0) AS views
       FROM posts p
       LEFT JOIN post_views v ON p.id = v.post_id
       LEFT JOIN post_translations t ON p.id = t.post_id AND t.language = ?
       LEFT JOIN posts_fts ON posts_fts.rowid = p.id
       LEFT JOIN post_translations_fts ON post_translations_fts.rowid = t.id
       WHERE (posts_fts MATCH ? OR (t.id IS NOT NULL AND post_translations_fts MATCH ?))
         AND p.published = 1
       ORDER BY 
         CASE WHEN posts_fts.rowid IS NOT NULL THEN rank ELSE 0 END DESC,
         CASE WHEN post_translations_fts.rowid IS NOT NULL THEN rank ELSE 0 END DESC
       LIMIT 20`,
      [lang, sanitized, sanitized]
    );

    return NextResponse.json({ rows: result.rows, query: q });
  } catch {
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
