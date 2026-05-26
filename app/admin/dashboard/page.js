"use client";

import { useState, useEffect, useCallback } from "react";
import PostForm from "@/app/_components/admin-post-form";
import ConfirmDialog from "@/app/_components/admin-confirm-dialog";
import Toast from "@/app/_components/toast";

function api(path, token, init) {
  return fetch(path, {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type": "application/json",
      ...(token ? { "Admin-Token": token } : {}),
    },
  });
}

function LoginScreen({ onLogin }) {
  const [input, setInput] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="mb-2 text-center text-2xl font-bold">Admin</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">Enter your admin token</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Admin-Token"
            className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (saved) setToken(saved);
    setReady(true);
  }, []);

  const doLogin = useCallback((t) => {
    localStorage.setItem("admin_token", t);
    setToken(t);
  }, []);

  const doLogout = useCallback(() => {
    localStorage.removeItem("admin_token");
    setToken(null);
  }, []);

  const fetchPosts = useCallback(
    async (reset) => {
      if (!token) return;
      setLoading(true);

      const params = new URLSearchParams({ admin: "true", limit: "10" });
      if (!reset && cursor) params.set("cursor", cursor);
      if (filterCategory) params.set("category", filterCategory);
      if (filterTag) params.set("tag", filterTag);

      try {
        const res = await api(`/api/posts?${params}`, token);
        if (res.status === 401) {
          doLogout();
          return;
        }
        const data = await res.json();
        setPosts((prev) => (reset ? data.rows : [...prev, ...data.rows]));
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    [token, cursor, filterCategory, filterTag, doLogout]
  );

  const fetchMeta = useCallback(async () => {
    if (!token) return;
    const [catRes, tagRes] = await Promise.all([
      api("/api/categories", token),
      api("/api/tags", token),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (tagRes.ok) setTags(await tagRes.json());
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchMeta();
      fetchPosts(true);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (token) fetchPosts(true);
  }, [filterCategory, filterTag]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(body) {
    const res = await api("/api/posts", token, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      setToast({ message: err.error || "Failed to create post", type: "error" });
      return;
    }
    setToast({ message: "Post created successfully", type: "success" });
    setShowForm(false);
    fetchPosts(true);
  }

  async function handleUpdate(body) {
    const slug = editingPost.slug;
    const res = await api(`/api/posts/${slug}`, token, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      setToast({ message: err.error || "Failed to update post", type: "error" });
      return;
    }
    setToast({ message: "Post updated successfully", type: "success" });
    setEditingPost(null);
    setShowForm(false);
    fetchPosts(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await api(`/api/posts/${deleteTarget.slug}`, token, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json();
      setToast({ message: err.error || "Failed to delete post", type: "error" });
      return;
    }
    setToast({ message: "Post deleted successfully", type: "success" });
    setDeleteTarget(null);
    fetchPosts(true);
  }

  async function startEdit(post) {
    const res = await api(`/api/posts/${post.slug}?language=en`, token);
    if (res.ok) {
      setEditingPost(await res.json());
      setShowForm(true);
    }
  }

  function statusBadge(published) {
    return published
      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }

  if (!ready) return null;
  if (!token) return <LoginScreen onLogin={doLogin} />;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={doLogout}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          Logout
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPosts([]); setCursor(null); }}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name} ({c.post_count})</option>
          ))}
        </select>

        <select
          value={filterTag}
          onChange={(e) => { setFilterTag(e.target.value); setPosts([]); setCursor(null); }}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">All Tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.slug}>{t.name} ({t.post_count})</option>
          ))}
        </select>

        <button
          onClick={() => { setEditingPost(null); setShowForm(true); }}
          className="ml-auto rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          + New Post
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40">
          <div className="mx-auto mt-12 max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold">
              {editingPost ? "Edit Post" : "Create Post"}
            </h2>
            <PostForm
              post={editingPost}
              categories={categories}
              tags={tags}
              onSubmit={editingPost ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditingPost(null); }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(!!post.published)}`}>
                  {post.published ? "Published" : "Draft"}
                </span>
                <h3 className="truncate text-sm font-medium">{post.title}</h3>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                {new Date(post.created_at).toLocaleDateString()} — /{post.slug}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(post)}
                className="rounded-lg border border-zinc-300 px-3 py-1 text-xs transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteTarget(post)}
                className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchPosts(false)}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-5 py-2 text-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
