import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    const post = await executeQuery("SELECT id FROM posts WHERE slug = ?", [slug]);
    if (!post.rows.length) {
      return NextResponse.json({ error: "文章未找到" }, { status: 404 });
    }

    const postId = post.rows[0].id;

    await executeQuery(
      `INSERT INTO post_views (post_id, views) VALUES (?, 1)
       ON CONFLICT(post_id) DO UPDATE SET views = views + 1`,
      [postId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
