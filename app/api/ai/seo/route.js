import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { callAI } from "@/lib/ai-client";

export async function POST(request) {
  try {
    await requireAdmin(request);

    let body$; try { body$ = await request.json(); } catch { body$ = JSON.parse(await request.text()); }
    const { title, content, existingSummary } = body$;
    if (!title || !content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "标题和正文（至少10个字符）均为必填" },
        { status: 400 }
      );
    }

    const prompt = `文章标题：${title}\n\n文章摘要：${existingSummary || "（无）"}\n\n文章正文：${content.slice(0, 3000)}\n\n请生成SEO标题（包含关键词，25字以内）和SEO描述（150字以内），以JSON格式输出：{"seoTitle":"...","seoDescription":"..."}`;

    const text = await callAI(
      prompt,
      "你是一位SEO专家，请根据文章内容生成适合搜索引擎优化的标题（包含关键词，25字以内）和描述（150字以内），不要使用引号或特殊符号。以JSON格式输出。"
    );

    let seoTitle = "";
    let seoDescription = "";

    try {
      const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*$/gm, "").trim();
      const parsed = JSON.parse(cleaned);
      seoTitle = (parsed.seoTitle || parsed.seo_title || "").trim();
      seoDescription = (parsed.seoDescription || parsed.seo_description || "").trim();
    } catch {
      const titleMatch = text.match(/SEO标题[：:]\s*(.+)/);
      const descMatch = text.match(/SEO描述[：:]\s*(.+)/);
      if (titleMatch) seoTitle = titleMatch[1].trim();
      if (descMatch) seoDescription = descMatch[1].trim();
      if (!seoTitle || !seoDescription) {
        const lines = text.split("\n").filter(Boolean);
        seoTitle = lines[0] || "";
        seoDescription = lines[1] || "";
      }
    }

    return NextResponse.json({ seoTitle, seoDescription });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err.message || "AI SEO 生成失败" },
      { status: 500 }
    );
  }
}
