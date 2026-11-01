import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "참치김밥 — 실시간 커뮤니티 채팅",
  description: "참치김밥 — 간편하고 빠른 익명 실시간 커뮤니티 채팅 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body className="bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 selection:bg-[#5865F2] selection:text-white">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
