import { NextResponse } from "next/server";
import db, { executeQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getLanguageFromRequest } from "@/lib/i18n";
import { fireWebhooks } from "@/lib/webhook";
import { revalidatePath } from "next/cache";
import { PostSchema } from "@/lib/validate";

function buildWhereClauses(searchParams, lang) {
  const admin = searchParams.get("admin") === "true";
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const clauses = [];
  const params = [];

  // Always include published filter for non-admin queries
  if (!admin) {
    clauses.push("p.published = 1");
  }

  if (category) {
    clauses.push("EXISTS (SELECT 1 FROM post_categories pc JOIN categories c ON pc.category_id = c.id WHERE pc.post_id = p.id AND c.slug = ?)");
    params.push(category);
  }

  if (tag) {
    clauses.push("EXISTS (SELECT 1 FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.post_id = p.id AND t.slug = ?)");
    params.push(tag);
  }

  const whereClause = clauses.length ? "WHERE " + clauses.join(" AND ") : "";
  return { where: whereClause, params, admin, lang };
}

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const lang = getLanguageFromRequest(request);
    const { where, params: filterParams, admin } = buildWhereClauses(searchParams, lang);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "6", 10)));
    const cursor = searchParams.get("cursor");

    if (admin) {
      await requireAdmin(request);
    }

    const columns = admin
      ? `p.id, p.published, p.created_at, p.updated_at, COALESCE(v.views, 0) AS views,
         COALESCE(t.title, p.title) AS title,
         COALESCE(t.slug, p.slug) AS slug,
         COALESCE(t.excerpt, p.excerpt) AS excerpt,
         p.cover_image, p.seo_title, p.seo_description`
      : `p.id, p.created_at, COALESCE(v.views, 0) AS views,
         COALESCE(t.title, p.title) AS title,
         COALESCE(t.slug, p.slug) AS slug,
         COALESCE(t.excerpt, p.excerpt) AS excerpt,
         p.cover_image`;

    const joinViews = "LEFT JOIN post_views v ON p.id = v.post_id";
    const joinTranslations = "LEFT JOIN post_translations t ON p.id = t.post_id AND t.language = ?";

    let rows;
    if (cursor) {
      const [createdAt, lastId] = cursor.split("|");
      const cursorCondition = `(p.created_at < ? OR (p.created_at = ? AND p.id < ?))`;
      const fullWhere = where ? where + " AND " + cursorCondition : "WHERE " + cursorCondition;

      const result = await executeQuery(
        `SELECT ${columns} FROM posts p ${joinTranslations} ${joinViews} ${fullWhere}
         ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
        [lang, ...filterParams, createdAt, createdAt, parseInt(lastId, 10), limit + 1]
      );
      rows = result.rows;
    } else {
      const result = await executeQuery(
        `SELECT ${columns} FROM posts p ${joinTranslations} ${joinViews} ${where}
         ORDER BY p.created_at DESC, p.id DESC LIMIT ?`,
        [lang, ...filterParams, limit + 1]
      );
      rows = result.rows;
    }

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    let nextCursor = null;
    if (hasMore) {
      const last = rows[rows.length - 1];
      nextCursor = `${last.created_at}|${last.id}`;
    }

    const res = NextResponse.json({ rows, nextCursor, hasMore });
    if (admin) {
      res.headers.set("Cache-Control", "no-store, private");
    } else {
      res.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
    }
    return res;
  } catch (err) {
    console.error("GET /api/posts failed:", err);
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAdmin(request);

    const body = await request.json();
    const validated = PostSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.errors },
        { status: 400 }
      );
    }
    const { title, slug, content, excerpt, cover_image, published, category_ids, tag_ids, language, seo_title, seo_description } = validated.data;
    const lang = language || "en";

    const postResult = await db.execute({
      sql: `INSERT INTO posts (title, slug, content, excerpt, cover_image, published, author_id, seo_title, seo_description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [title, slug, content, excerpt ?? null, cover_image ?? null, published ? 1 : 0, user.id, seo_title ?? null, seo_description ?? null],
    });

    const postId = Number(postResult.lastInsertRowid);

    const batchStmts = [
      {
        sql: `INSERT INTO post_translations (post_id, language, title, slug, content, excerpt) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [postId, lang, title, slug, content, excerpt ?? null],
      },
    ];

    if (category_ids?.length) {
      for (const id of category_ids) {
        batchStmts.push({
          sql: "INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)",
          args: [postId, id],
        });
      }
    }
    if (tag_ids?.length) {
      for (const id of tag_ids) {
        batchStmts.push({
          sql: "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
          args: [postId, id],
        });
      }
    }
    if (batchStmts.length) {
      await db.batch(batchStmts, "immediate");
    }

    await fireWebhooks("post.created", { id: postId, title, slug, published: !!published, updated_at: new Date().toISOString() });

    // 清除 ISR 缓存
    try {
      revalidatePath("/", "page");
      revalidatePath("/posts/[slug]", "page");
    } catch {
      // Edge Runtime 中 revalidatePath 可能不可用，忽略
    }

    return NextResponse.json({ id: postId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/posts failed:", err);
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err.code === "SQLITE_UNIQUE") {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
