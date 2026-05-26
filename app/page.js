import { headers } from "next/headers";
import Link from "next/link";
import PostsList from "./_components/posts-list";

export default async function HomePage() {
  const h = await headers();
  const lang = h.get("x-language") || "en";

  let data, categories;
  try {
    const [postsRes, catRes] = await Promise.all([
      fetch(`/api/posts?limit=9&language=${lang}`, { next: { revalidate: 60 } }),
      fetch(`/api/categories`, { next: { revalidate: 60 } }),
    ]);
    data = await postsRes.json();
    categories = await catRes.json();
  } catch {
    data = { rows: [], nextCursor: null };
    categories = [];
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/20 dark:via-[var(--bg)] dark:to-purple-950/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              记录与分享
            </h1>
            <p className="mb-8 text-lg text-[var(--text-secondary)]">
              探索技术、分享知识、记录生活
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/search"
                className="rounded-xl bg-[var(--text)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-[var(--text)]"
              >
                浏览文章
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)]"
              >
                管理后台
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {categories?.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">分类：</span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug}`}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <PostsList initialPosts={data.rows} initialCursor={data.nextCursor} />
      </div>
    </>
  );
}
