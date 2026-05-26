import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { callAI } from "@/lib/ai-client";

export async function POST(request) {
  try {
    await requireAdmin(request);

    let body$; try { body$ = await request.json(); } catch { body$ = JSON.parse(await request.text()); }
    const { title, content } = body$;
    if (!title || !content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "标题和正文（至少10个字符）均为必填" },
        { status: 400 }
      );
    }

    const text = await callAI(
      `文章标题：${title}\n\n文章正文：${content.slice(0, 3000)}\n\n请提取3-5个最相关的关键词作为标签，每个标签简短（2-4字），以JSON数组形式输出，例如：["技术","前端","AI"]`,
      "请根据文章标题和正文，提取3-5个最相关的关键词作为标签，每个标签简短（2-4字），以JSON数组形式输出。"
    );

    let tags;
    try {
      const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
      tags = JSON.parse(cleaned);
      if (!Array.isArray(tags)) throw new Error("Not an array");
      tags = tags.slice(0, 5).map((t) => String(t).trim()).filter(Boolean);
    } catch {
      const extracted = text.match(/["']([^"']+)["']/g);
      if (extracted) {
        tags = extracted.map((t) => t.replace(/["']/g, "")).slice(0, 5);
      } else {
        tags = text.split(/[,，、\n]/).map((t) => t.trim()).filter(Boolean).slice(0, 5);
      }
    }

    return NextResponse.json({ tags });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err.message || "AI 标签生成失败" },
      { status: 500 }
    );
  }
}
