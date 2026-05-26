import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/crypto";
import { executeQuery } from "@/lib/db";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    let body$; try { body$ = await request.json(); } catch { body$ = JSON.parse(await request.text()); }
    const { email, password } = body$;

    if (!email || !password) {
      return NextResponse.json({ error: "缺少邮箱或密码" }, { status: 400 });
    }

    const result = await executeQuery("SELECT * FROM users WHERE email = ?", [email]);
    if (!result.rows.length) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const token = await signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
