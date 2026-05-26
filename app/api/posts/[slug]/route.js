import { NextResponse } from "next/server";
import db, { executeQuery } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getLanguageFromRequest } from "@/lib/i18n";
import { fireWebhooks } from "@/lib/webhook";
import { revalidatePath } from "next/cache";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const lang = getLanguageFromRequest(request);

    const result = await executeQuery(
      `SELECT p.*,
              COALESCE(t.title, p.title) AS title,
              COALESCE(t.slug, p.slug) AS slug,
              COALESCE(t.content, p.content) AS content,
              COALESCE(t.excerpt, p.excerpt) AS excerpt
       FROM posts p
       LEFT JOIN post_translations t ON p.id = t.post_id AND t.language = ?
       WHERE p.slug = ?`,
      [lang, slug]
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = result.rows[0];

    const [categories, tags, views] = await Promise.all([
      executeQuery(
        `SELECT c.id, c.name, c.slug FROM categories c
         JOIN post_categories pc ON c.id = pc.category_id
         WHERE pc.post_id = ?`,
        [post.id]
      ),
      executeQuery(
        `SELECT t.id, t.name, t.slug FROM tags t
         JOIN post_tags pt ON t.id = pt.tag_id
         WHERE pt.post_id = ?`,
        [post.id]
      ),
      executeQuery("SELECT views FROM post_views WHERE post_id = ?", [post.id]),
    ]);

    const res = NextResponse.json({
      ...post,
      categories: categories.rows,
      tags: tags.rows,
      views: views.rows[0]?.views ?? 0,
    });
    res.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
    return res;
  } catch (err) {
    console.error("GET /api/posts/[slug] failed:", err);
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAdmin(request);

    const { slug } = await params;
    const body = await request.json();
    const lang = body.language || "en";

    const existing = await executeQuery("SELECT id FROM posts WHERE slug = ?", [slug]);
    if (!existing.rows.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const postId = existing.rows[0].id;

    const batchStmts = [];

    // Update post table fields
    const postFields = [];
    const postValues = [];
    for (const key of ["title", "slug", "content", "excerpt", "cover_image", "seo_title", "seo_description"]) {
      if (body[key] !== undefined) {
        postFields.push(`${key} = ?`);
        postValues.push(body[key]);
      }
    }
    if (body.published !== undefined) {
      postFields.push("published = ?");
      postValues.push(body.published ? 1 : 0);
    }
    if (postFields.length) {
      postFields.push("updated_at = datetime('now')");
      batchStmts.push({
        sql: `UPDATE posts SET ${postFields.join(", ")} WHERE id = ?`,
        args: [...postValues, postId],
      });
    }

    // Upsert translation
    if (body.title !== undefined || body.content !== undefined || body.excerpt !== undefined || body.slug !== undefined) {
      const tFields = [];
      const tValues = [];
      for (const key of ["title", "slug", "content", "excerpt"]) {
        if (body[key] !== undefined) {
          tFields.push(`${key} = ?`);
          tValues.push(body[key]);
        }
      }
      if (tFields.length) {
        // Check if translation exists
        const existingT = await executeQuery(
          "SELECT id FROM post_translations WHERE post_id = ? AND language = ?",
          [postId, lang]
        );
        if (existingT.rows.length) {
          batchStmts.push({
            sql: `UPDATE post_translations SET ${tFields.join(", ")} WHERE post_id = ? AND language = ?`,
            args: [...tValues, postId, lang],
          });
        } else {
          batchStmts.push({
            sql: `INSERT INTO post_translations (post_id, language, title, slug, content, excerpt) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [postId, lang, body.title ?? "", body.slug ?? slug, body.content ?? "", body.excerpt ?? null],
          });
        }
      }
    }

    // Update categories/tags if provided
    if (body.category_ids !== undefined || body.tag_ids !== undefined) {
      batchStmts.push({ sql: "DELETE FROM post_categories WHERE post_id = ?", args: [postId] });
      batchStmts.push({ sql: "DELETE FROM post_tags WHERE post_id = ?", args: [postId] });

      if (body.category_ids?.length) {
        for (const id of body.category_ids) {
          batchStmts.push({
            sql: "INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)",
            args: [postId, id],
          });
        }
      }
      if (body.tag_ids?.length) {
        for (const id of body.tag_ids) {
          batchStmts.push({
            sql: "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
            args: [postId, id],
          });
        }
      }
    }

    if (batchStmts.length) {
      await db.batch(batchStmts, "immediate");
    }

    const newSlug = body.slug ?? slug;
    const updated = await executeQuery(
      `SELECT p.*,
              COALESCE(t.title, p.title) AS title,
              COALESCE(t.slug, p.slug) AS slug,
              COALESCE(t.content, p.content) AS content,
              COALESCE(t.excerpt, p.excerpt) AS excerpt
       FROM posts p
       LEFT JOIN post_translations t ON p.id = t.post_id AND t.language = ?
       WHERE p.slug = ?`,
      [lang, newSlug]
    );

    const [categories, tags] = await Promise.all([
      executeQuery(
        `SELECT c.id, c.name, c.slug FROM categories c
         JOIN post_categories pc ON c.id = pc.category_id WHERE pc.post_id = ?`,
        [postId]
      ),
      executeQuery(
        `SELECT t.id, t.name, t.slug FROM tags t
         JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?`,
        [postId]
      ),
    ]);

    await fireWebhooks("post.updated", {
      id: postId,
      title: updated.rows[0]?.title,
      slug: newSlug,
      published: updated.rows[0]?.published,
      updated_at: new Date().toISOString(),
    });

    // 清除 ISR 缓存
    try {
      revalidatePath("/", "page");
      revalidatePath("/posts/[slug]", "page");
      revalidatePath(`/posts/${newSlug}`, "page");
    } catch {
      // Edge Runtime 中 revalidatePath 可能不可用，忽略
    }

    return NextResponse.json({ ...updated.rows[0], categories: categories.rows, tags: tags.rows });
  } catch (err) {
    console.error("PUT /api/posts/[slug] failed:", err);
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request);

    const { slug } = await params;

    const existing = await executeQuery("SELECT id FROM posts WHERE slug = ?", [slug]);
    if (!existing.rows.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const postId = existing.rows[0].id;

    await db.batch(
      [
        { sql: "DELETE FROM post_translations WHERE post_id = ?", args: [postId] },
        { sql: "DELETE FROM post_categories WHERE post_id = ?", args: [postId] },
        { sql: "DELETE FROM post_tags WHERE post_id = ?", args: [postId] },
        { sql: "DELETE FROM post_views WHERE post_id = ?", args: [postId] },
        { sql: "DELETE FROM posts WHERE id = ?", args: [postId] },
      ],
      "immediate"
    );

    // 清除 ISR 缓存
    try {
      revalidatePath("/", "page");
      revalidatePath("/posts/[slug]", "page");
    } catch {
      // Edge Runtime 中 revalidatePath 可能不可用，忽略
    }

    return NextResponse.json({ message: "Post deleted" });
  } catch (err) {
    console.error("DELETE /api/posts/[slug] failed:", err);
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
