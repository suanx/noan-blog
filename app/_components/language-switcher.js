"use client";

import { usePathname, useRouter } from "next/navigation";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "zh", label: "中文" },
];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  function currentLang() {
    const match = pathname.match(/^\/(zh|en)\b/);
    return match ? match[1] : "en";
  }

  function switchTo(code) {
    const cur = currentLang();
    if (code === cur) return;
    const relative = pathname.replace(/^\/(zh|en)(\/|$)/, "/");
    const target = code === "en" ? relative || "/" : `/${code}${relative || ""}`;
    router.push(target);
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {LANGUAGES.map((lang) => {
        const active = currentLang() === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => switchTo(lang.code)}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              active
                ? "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
