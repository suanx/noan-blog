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
        placeholder="Search..."
        className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:w-48 focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-blue-500"
      />
    </form>
  );
}
