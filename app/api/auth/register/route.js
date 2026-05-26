import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" },
        { status: 400 }
      );
    }

    const existing = await executeQuery("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hash = await hashPassword(password);
    const result = await executeQuery(
      "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'author')",
      [email, hash, name]
    );

    const userId = Number(result.lastInsertRowid);
    const token = await signToken({ id: userId, email, role: "author", name });

    return NextResponse.json({ token, user: { id: userId, email, name, role: "author" } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
