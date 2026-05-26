import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { callAI } from "@/lib/ai-client";

export async function POST(request) {
  try {
    await requireAdmin(request);

    const { content } = await request.json();
    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content must be at least 10 characters" },
        { status: 400 }
      );
    }

    const summary = await callAI(
      `请根据以下文章正文，生成一段简洁、吸引人的中文摘要（80-120字）：\n\n${content.slice(0, 3000)}`,
      "你是一个专业的内容编辑，请根据提供的文章正文，生成一段简洁、吸引人的摘要，不超过120字。"
    );

    return NextResponse.json({ summary });
  } catch (err) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err.message || "AI summary generation failed" },
      { status: 500 }
    );
  }
}
