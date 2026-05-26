import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import ShareButton from "@/app/_components/share-button";
import MarkdownContent from "@/app/_components/markdown-content";
import CommentsSection from "@/app/_components/comments-section";
import { executeQuery } from "@/lib/db";

async function fetchPost(slug, lang) {
  const res = await fetch(`/api/posts/${slug}?language=${lang}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const h = await headers();
  const lang = h.get("x-language") || "en";

  const post = await fetchPost(slug, lang);
  if (!post) return {};

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || "",
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || "",
      images: post.cover_image ? [{ url: post.cover_image }] : [],
    },
  };
}

export async function generateStaticParams() {
  try {
    const result = await executeQuery(
      "SELECT slug FROM posts WHERE published = 1 ORDER BY created_at DESC"
    );
    return result.rows.map((row) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const h = await headers();
  const lang = h.get("x-language") || "en";

  const post = await fetchPost(slug, lang);

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
          文章未找到
        </h1>
        <Link
          href="/"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          返回首页
        </Link>
      </div>
    );
  }

  fetch(`/api/views/${slug}`, { method: "POST" }).catch(() => {});

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回首页
      </Link>

      <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
        {post.title}
      </h1>

      {post.cover_image && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      <div className="mb-8 flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <div className="flex items-center gap-4">
          <time>
            {new Date(post.created_at).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views ?? 0}
          </span>
        </div>
        <ShareButton />
      </div>

      <div className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-[var(--accent)]">
        <MarkdownContent content={post.content} />
      </div>

      <CommentsSection postId={post.id} slug={slug} />
    </article>
  );
}
