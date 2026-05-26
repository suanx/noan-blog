"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const [q, setQ] = useState("");
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    if (q.trim()) {
      const lang = window.location.pathname.match(/^\/(zh|en)\b/)?.[1] || "";
      const prefix = lang ? `/${lang}` : "";
      router.push(`${prefix}/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索..."
        className="w-32 rounded-lg border border-[var(--border)] bg-transparent px-3 py-1.5 text-sm outline-none transition focus:w-40 focus:border-[var(--accent)]"
      />
    </form>
  );
}
