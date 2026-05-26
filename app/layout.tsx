import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "./_components/theme-provider";
import SearchBox from "./_components/search-box";
import LanguageSwitcher from "./_components/language-switcher";
import ThemeToggle from "./_components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Noan Blog",
  description: "A blog built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <div className="flex items-center gap-6">
                <Link href="/" className="text-lg font-bold tracking-tight text-[var(--text)]">
                  Noan Blog
                </Link>
                <nav className="hidden items-center gap-1 sm:flex">
                  <Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]">
                    首页
                  </Link>
                  <Link href="/search" className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]">
                    搜索
                  </Link>
                  <a href="/admin/dashboard" className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]">
                    管理
                  </a>
                </nav>
              </div>
              <div className="flex items-center gap-2">
                <SearchBox />
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--border)] py-8 text-center text-sm text-[var(--text-tertiary)]">
            <div className="mx-auto max-w-6xl px-4">
              <p>&copy; {new Date().getFullYear()} Noan Blog. All rights reserved.</p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
