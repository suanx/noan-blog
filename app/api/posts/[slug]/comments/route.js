import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const post = await executeQuery("SELECT id FROM posts WHERE slug = ?", [slug]);
    if (!post.rows.length) {
      return NextResponse.json({ error: "文章未找到" }, { status: 404 });
    }

    const result = await executeQuery(
      `SELECT id, author_name, content, created_at
       FROM comments
       WHERE post_id = ? AND status = 'approved'
       ORDER BY created_at ASC`,
      [post.rows[0].id]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
