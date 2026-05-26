"use client";

import { useState, useEffect, useCallback } from "react";

export default function CommentsSection({ postId, slug }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${slug}/comments`);
      if (res.ok) setComments(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !content) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, author_name: name, author_email: email, content }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("评论已提交审核。");
        setMessageType("success");
        setContent("");
      } else {
        setMessage(data.error || "提交评论失败");
        setMessageType("error");
      }
    } catch {
      setMessage("网络错误");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-[var(--border)] pt-10">
      <h2 className="mb-6 text-xl font-semibold">
        评论 {!loading && `(${comments.length})`}
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-24 rounded bg-[var(--bg-secondary)]" />
              <div className="h-4 w-3/4 rounded bg-[var(--bg-secondary)]" />
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="mb-10 space-y-6">
          {comments.map((c) => (
            <div key={c.id} className="border-l-2 border-[var(--border)] pl-4">
              <div className="mb-1 text-sm font-medium">{c.author_name}</div>
              <p className="text-sm text-[var(--text-secondary)]">{c.content}</p>
              <time className="mt-1 block text-xs text-[var(--text-tertiary)]">
                {new Date(c.created_at).toLocaleDateString("zh-CN")}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-8 text-sm text-[var(--text-secondary)]">暂无评论</p>
      )}

      <h3 className="mb-4 text-base font-medium">发表评论</h3>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            messageType === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的名字 *"
            required
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="你的邮箱 *"
            required
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写评论... *"
          required
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[var(--text)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-white dark:text-[var(--text)]"
        >
          {submitting ? "提交中..." : "提交评论"}
        </button>
      </form>
    </section>
  );
}
