import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "KakaoCord — 카카오톡 × 디스코드 하이브리드 실시간 커뮤니티 채팅",
  description:
    "카카오톡 오픈채팅의 친근함과 디스코드의 체계적인 커뮤니티 채널/프로필/대명사(Pronouns) 시스템을 결합한 웹 실시간 채팅 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 selection:bg-[#5865F2] selection:text-white">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
