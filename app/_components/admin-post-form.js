"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("admin_token") || "";
}

function AiButton({ label, loading, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${color}`}
    >
      {loading ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        label
      )}
    </button>
  );
}

function aiApi(path, body) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Admin-Token"] = token;
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export default function PostForm({ post, categories, tags, onSubmit, onCancel }) {
  const isEdit = !!post;
  const [language, setLanguage] = useState("en");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? "");
  const [published, setPublished] = useState(post?.published ?? false);
  const [selectedCategories, setSelectedCategories] = useState(
    post?.categories?.map((c) => c.id) ?? []
  );
  const [selectedTags, setSelectedTags] = useState(post?.tags?.map((t) => t.id) ?? []);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seo_description ?? "");

  const [aiLoading, setAiLoading] = useState({ summary: false, tags: false, seo: false });
  const [aiError, setAiError] = useState(null);

  function toggleCategory(id) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleTag(id) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAiSummary() {
    if (!content || content.trim().length < 10) {
      setAiError("内容至少需要 10 个字符才能生成摘要");
      return;
    }
    setAiLoading((prev) => ({ ...prev, summary: true }));
    setAiError(null);
    try {
      const res = await aiApi("/api/ai/summary", { content });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成摘要失败");
      }
      const data = await res.json();
      setExcerpt(data.summary);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading((prev) => ({ ...prev, summary: false }));
    }
  }

  async function handleAiTags() {
    if (!title || !content || content.trim().length < 10) {
      setAiError("标题和内容（至少10字符）才能生成标签");
      return;
    }
    setAiLoading((prev) => ({ ...prev, tags: true }));
    setAiError(null);
    try {
      const res = await aiApi("/api/ai/tags", { title, content });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成标签失败");
      }
      const data = await res.json();
      const tagNames = data.tags || [];
      const matchedIds = tagNames
        .map((name) => {
          const lower = name.toLowerCase();
          const found = tags.find(
            (t) => t.name.toLowerCase() === lower || t.slug === lower
          );
          return found ? found.id : null;
        })
        .filter(Boolean);
      if (matchedIds.length) {
        setSelectedTags((prev) => {
          const set = new Set([...prev, ...matchedIds]);
          return [...set];
        });
      }
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading((prev) => ({ ...prev, tags: false }));
    }
  }

  async function handleAiSeo() {
    if (!title || !content || content.trim().length < 10) {
      setAiError("标题和内容（至少10字符）才能优化 SEO");
      return;
    }
    setAiLoading((prev) => ({ ...prev, seo: true }));
    setAiError(null);
    try {
      const res = await aiApi("/api/ai/seo", { title, content, existingSummary: excerpt });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "生成 SEO 元数据失败");
      }
      const data = await res.json();
      if (data.seoTitle) setSeoTitle(data.seoTitle);
      if (data.seoDescription) setSeoDescription(data.seoDescription);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading((prev) => ({ ...prev, seo: false }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    const body = {
      title,
      slug,
      content,
      excerpt,
      cover_image: coverImage || null,
      published,
      language,
      category_ids: selectedCategories,
      tag_ids: selectedTags,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
    };

    try {
      await onSubmit(body);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">语言</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">标题 *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">链接 *</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">摘要</label>
          <AiButton
            label="✨ AI 摘要"
            loading={aiLoading.summary}
            onClick={handleAiSummary}
            color="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300"
          />
        </div>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          封面图片 URL
        </label>
        <input
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">内容 (Markdown) *</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {showPreview ? "编辑" : "预览"}
            </button>
          </div>
        </div>
        {showPreview ? (
          <div className="prose prose-zinc max-w-none rounded-lg border border-zinc-300 bg-white p-4 text-sm dark:prose-invert dark:border-zinc-700 dark:bg-zinc-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={12}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <label htmlFor="published" className="text-sm">已发布</label>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">分类</label>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategories.includes(cat.id)
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">标签</label>
          <AiButton
            label="🏷️ AI 标签"
            loading={aiLoading.tags}
            onClick={handleAiTags}
            color="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedTags.includes(tag.id)
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">SEO 元数据</h3>
          <AiButton
            label="🔍 AI 优化 SEO"
            loading={aiLoading.seo}
            onClick={handleAiSeo}
            color="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
          />
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">SEO 标题</label>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO 优化标题（建议 25 字）"
              maxLength={80}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">SEO 描述</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="SEO 描述文本（建议 150 字）"
              rows={2}
              maxLength={300}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
            />
          </div>
        </div>
      </div>

      {aiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {aiError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#4945FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3733E0] disabled:opacity-50"
        >
          {submitting ? "保存中..." : isEdit ? "更新文章" : "创建文章"}
        </button>
      </div>
    </form>
  );
}
