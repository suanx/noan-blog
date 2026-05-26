import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { post_id, author_name, author_email, content } = body;

    if (!post_id || !author_name || !author_email || !content) {
      return NextResponse.json(
        { error: "Missing required fields: post_id, author_name, author_email, content" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(author_email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
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
        { error: "You commented too recently. Please wait a few minutes." },
        { status: 429 }
      );
    }

    await executeQuery(
      `INSERT INTO comments (post_id, author_name, author_email, content, status, ip_address)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [post_id, author_name, author_email, content, ip]
    );

    return NextResponse.json(
      { message: "Comment submitted for review" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
