import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { extractUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const payload = await extractUser(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await executeQuery("SELECT id, email, name, role FROM users WHERE id = ?", [payload.id]);
    if (!result.rows.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
