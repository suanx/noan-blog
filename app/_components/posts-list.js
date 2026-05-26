"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

function PostCard({ post }) {
  const tagColors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  ];

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group card-hover rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--bg-secondary)]">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--text-tertiary)]">
            <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {post.published === 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            草稿
          </span>
        )}
      </div>
      <div className="p-4">
        <h2 className="mb-2 text-base font-semibold leading-snug group-hover:text-[var(--accent)] transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="mb-3 line-clamp-2 text-sm text-[var(--text-secondary)]">
            {post.excerpt}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
          <time>
            {new Date(post.created_at).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}
          </time>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views ?? 0}
          </span>
          {post.category_names?.length > 0 && (
            <span className="ml-auto flex gap-1">
              {post.category_names.slice(0, 2).map((name, i) => (
                <span key={i} className={`rounded-full px-2 py-0.5 ${tagColors[i % tagColors.length]}`}>
                  {name}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      <div className="aspect-[16/10] bg-[var(--bg-secondary)]" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-[var(--bg-secondary)]" />
        <div className="h-3 w-full rounded bg-[var(--bg-secondary)]" />
        <div className="h-3 w-2/3 rounded bg-[var(--bg-secondary)]" />
      </div>
    </div>
  );
}

export default function PostsList({ initialPosts, initialCursor }) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoadMore = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const lang = window.location.pathname.match(/^\/(zh|en)\b/)?.[1] || "en";
      const params = new URLSearchParams({ cursor, limit: 9, language: lang });
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error("加载失败");

      const data = await res.json();
      setPosts((prev) => [...prev, ...data.rows]);
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {cursor && !loading && (
        <div className="mt-10 text-center">
          <button
            onClick={handleLoadMore}
            className="rounded-xl border border-[var(--border)] px-8 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
          >
            加载更多
          </button>
        </div>
      )}
    </>
  );
}
