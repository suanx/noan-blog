import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function POST(request) {
  try {
    let body$; try { body$ = await request.json(); } catch { body$ = JSON.parse(await request.text()); }
    const { post_id, author_name, author_email, content } = body;

    if (!post_id || !author_name || !author_email || !content) {
      return NextResponse.json(
        { error: "缺少必填字段：post_id、author_name、author_email、content" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
      return NextResponse.json({ error: "邮箱格式无效" }, { status: 400 });
    }

    const xff = request.headers.get("x-forwarded-for");
    const ip = xff
      ? xff.split(",").pop().trim()
      : request.headers.get("x-real-ip") ?? "unknown";

    const recent = await executeQuery(
      "SELECT id FROM comments WHERE ip_address = ? AND created_at > datetime('now', '-5 minutes') LIMIT 1",
      [ip]
    );

    if (recent.rows.length > 0) {
      return NextResponse.json(
        { error: "评论过于频繁，请稍后再试。" },
        { status: 429 }
      );
    }

    await executeQuery(
      `INSERT INTO comments (post_id, author_name, author_email, content, status, ip_address)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [post_id, author_name, author_email, content, ip]
    );

    return NextResponse.json(
      { message: "评论已提交，等待审核" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
