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
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#4945FF] text-xl font-bold text-white">
            N
          </div>
          <h1 className="text-xl font-bold">Noan Blog</h1>
          <p className="mt-1 text-sm text-zinc-500">输入管理员 Token</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="管理员 Token"
            className="mb-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-[#4945FF] focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:focus:bg-zinc-800"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[#4945FF] py-2.5 text-sm font-medium text-white transition hover:bg-[#3733E0]"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-[#4945FF]/10 text-[#4945FF] dark:bg-[#4945FF]/20"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-5 transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const [activeView, setActiveView] = useState("posts");

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
      setToast({ message: err.error || "创建文章失败", type: "error" });
      return;
    }
    setToast({ message: "文章创建成功", type: "success" });
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
      setToast({ message: err.error || "更新文章失败", type: "error" });
      return;
    }
    setToast({ message: "文章更新成功", type: "success" });
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
      setToast({ message: err.error || "删除文章失败", type: "error" });
      return;
    }
    setToast({ message: "文章删除成功", type: "success" });
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
      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
  }

  if (!ready) return null;
  if (!token) return <LoginScreen onLogin={doLogin} />;

  return (
    <div className="flex min-h-screen bg-[#f6f6f9] dark:bg-black">
      <aside className="hidden w-56 flex-shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4945FF] text-sm font-bold text-white">
            N
          </div>
          <div>
            <p className="text-sm font-semibold">Noan Blog</p>
            <p className="text-xs text-zinc-400">管理后台</p>
          </div>
        </div>

        <nav className="mt-4 space-y-1">
          <SidebarItem
            active={activeView === "posts"}
            onClick={() => setActiveView("posts")}
            label="文章"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
          />
          <SidebarItem
            active={activeView === "categories"}
            onClick={() => setActiveView("categories")}
            label="分类"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
          <SidebarItem
            active={activeView === "tags"}
            onClick={() => setActiveView("tags")}
            label="标签"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={doLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">
                {activeView === "posts" && "文章管理"}
                {activeView === "categories" && "分类管理"}
                {activeView === "tags" && "标签管理"}
              </h1>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                {posts.length} 篇文章
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={doLogout}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 lg:hidden"
              >
                退出
              </button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="文章总数" value={posts.length} color="text-[#4945FF]" />
            <StatCard label="分类" value={categories.length} color="text-emerald-500" />
            <StatCard label="标签" value={tags.length} color="text-amber-500" />
          </div>

          {activeView === "posts" && (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setPosts([]); setCursor(null); }}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#4945FF] dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">全部分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name} ({c.post_count})</option>
                  ))}
                </select>
                <select
                  value={filterTag}
                  onChange={(e) => { setFilterTag(e.target.value); setPosts([]); setCursor(null); }}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#4945FF] dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="">全部标签</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.slug}>{t.name} ({t.post_count})</option>
                  ))}
                </select>
                <button
                  onClick={() => { setEditingPost(null); setShowForm(true); }}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#4945FF] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3733E0]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新文章
                </button>
              </div>

              <div className="space-y-3">
                {loading && posts.length === 0 ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="mb-2 h-5 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
                        <div className="h-4 w-2/3 rounded bg-zinc-50 dark:bg-zinc-800" />
                      </div>
                    ))}
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center gap-4 rounded-xl border border-zinc-100 bg-white p-5 transition hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusBadge(!!post.published)}`}>
                            {post.published ? "已发布" : "草稿"}
                          </span>
                          <h3 className="truncate text-sm font-medium">{post.title}</h3>
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">
                          {new Date(post.created_at).toLocaleDateString("zh-CN")} — /{post.slug}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(post)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {hasMore && !loading && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => fetchPosts(false)}
                    className="rounded-lg border border-zinc-200 px-6 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    加载更多
                  </button>
                </div>
              )}

              {loading && posts.length > 0 && (
                <div className="mt-4 text-center text-sm text-zinc-400">加载中...</div>
              )}
            </>
          )}

          {activeView === "categories" && (
            <div className="rounded-xl border border-zinc-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between border-b border-zinc-50 pb-3 last:border-0 dark:border-zinc-800">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">{cat.post_count} 篇</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === "tags" && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <span>{tag.name}</span>
                  <span className="text-xs text-zinc-400">{tag.post_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40">
          <div className="mx-auto mt-8 mb-8 max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingPost ? "编辑文章" : "创建文章"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingPost(null); }}
                className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除文章"
        message={`确定要删除"${deleteTarget?.title}"吗？此操作不可撤销。`}
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
