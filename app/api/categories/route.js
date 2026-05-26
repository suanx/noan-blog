import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    const result = await executeQuery(
      `SELECT c.id, c.name, c.slug, COUNT(pc.post_id) AS post_count
       FROM categories c
       LEFT JOIN post_categories pc ON c.id = pc.category_id
       LEFT JOIN posts p ON pc.post_id = p.id AND p.published = 1
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
