import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    const result = await executeQuery(
      `SELECT t.id, t.name, t.slug, COUNT(pt.post_id) AS post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       LEFT JOIN posts p ON pt.post_id = p.id AND p.published = 1
       GROUP BY t.id
       ORDER BY t.name ASC`
    );
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
