import { headers } from "next/headers";
import PostsList from "./_components/posts-list";

export default async function HomePage() {
  const h = await headers();
  const lang = h.get("x-language") || "en";

  let data;
  try {
    const res = await fetch(`/api/posts?limit=6&language=${lang}`, {
      next: { revalidate: 60 },
    });
    data = await res.json();
  } catch {
    data = { rows: [], nextCursor: null };
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-10 text-center text-4xl font-bold tracking-tight sm:text-5xl">
        Noan Blog
      </h1>
      <PostsList initialPosts={data.rows} initialCursor={data.nextCursor} />
    </div>
  );
}
