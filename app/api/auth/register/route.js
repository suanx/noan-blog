import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    let body$; try { body$ = await request.json(); } catch { body$ = JSON.parse(await request.text()); }
    const { email, password, name } = body$;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "密码长度至少为 8 个字符" }, { status: 400 });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password)) {
      return NextResponse.json(
        { error: "密码必须包含至少一个大写字母、一个小写字母和一个数字" },
        { status: 400 }
      );
    }

    const existing = await executeQuery("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
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
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
