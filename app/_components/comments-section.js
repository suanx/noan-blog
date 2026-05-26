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
        setMessage("Comment submitted for review.");
        setMessageType("success");
        setContent("");
      } else {
        setMessage(data.error || "Failed to submit comment");
        setMessageType("error");
      }
    } catch {
      setMessage("Network error");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="mb-6 text-xl font-semibold">
        Comments {!loading && `(${comments.length})`}
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="mb-10 space-y-6">
          {comments.map((c) => (
            <div key={c.id} className="border-l-2 border-zinc-300 pl-4 dark:border-zinc-700">
              <div className="mb-1 text-sm font-medium">{c.author_name}</div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{c.content}</p>
              <time className="mt-1 block text-xs text-zinc-400">
                {new Date(c.created_at).toLocaleDateString()}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-8 text-sm text-zinc-500">No comments yet.</p>
      )}

      <h3 className="mb-4 text-base font-medium">Leave a comment</h3>

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
            placeholder="Your name *"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Your email *"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment... *"
          required
          rows={4}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "Submitting..." : "Submit Comment"}
        </button>
      </form>
    </section>
  );
}
