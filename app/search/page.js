"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function highlight(str) {
  // FTS5 returns &lt;mark&gt;...&lt;/mark&gt; — safely replace only these entities
  return str.replace(/&lt;mark&gt;/g, "<mark>").replace(/&lt;\/mark&gt;/g, "</mark>");
}

function sanitizeAndHighlight(str) {
  return highlight(escapeHtml(str));
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    const lang = window.location.pathname.match(/^\/(zh|en)\b/)?.[1] || "en";
    fetch(`/api/search?q=${encodeURIComponent(q)}&language=${lang}`)
      .then((r) => r.json())
      .then((data) => setResults(data.rows || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">Search</h1>
      <p className="mb-8 text-sm text-zinc-500">
        {q ? `Results for "${q}"` : "Enter a search term"}
      </p>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && results.length === 0 && q && (
        <p className="text-sm text-zinc-500">No results found.</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="block rounded-lg border border-zinc-200 p-4 transition hover:shadow-md dark:border-zinc-800"
            >
              <h2
                className="mb-1 text-lg font-semibold"
                dangerouslySetInnerHTML={{ __html: post.title_hl ? sanitizeAndHighlight(post.title_hl) : escapeHtml(post.title) }}
              />
              {post.content_hl && (
                <p
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                  dangerouslySetInnerHTML={{ __html: sanitizeAndHighlight(post.content_hl) }}
                />
              )}
              <div className="mt-2 text-xs text-zinc-400">
                {new Date(post.created_at).toLocaleDateString()} &middot; {post.views ?? 0} views
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
