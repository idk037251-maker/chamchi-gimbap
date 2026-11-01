"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { deduplicateCommunities } from "@/lib/communityUtils";
import { isSuperAdmin } from "@/types/chat";
import {
  Menu,
  PlusCircle,
  Compass,
  Sun,
  Moon,
  Settings,
  MessageSquareHeart,
  Database,
} from "lucide-react";

export default function TopNavigationBar() {
  const {
    currentUser,
    setIsDrawerOpen,
    setIsCreateModalOpen,
    setIsProfileModalOpen,
    setIsCloudConfigModalOpen,
    isCloudConnected,
    activeCommunityId,
    setActiveCommunityId,
    activeDmUser,
    closeDm,
    setIsDmDrawerOpen,
    communities,
    joinedCommunityIds,
    joinCommunity,
    getCommunityUnreadCount,
    totalCommunityUnreadCount,
    theme,
    toggleTheme,
  } = useApp();

  if (!currentUser) return null;

  const dedupedCommunities = deduplicateCommunities(communities || []);
  const joinedCommunities = dedupedCommunities.filter((c) =>
    (joinedCommunityIds || []).includes(c?.id)
  );

  const iAmAdmin = isSuperAdmin(currentUser);

  return (
    <nav className="h-14 px-3 sm:px-5 bg-white dark:bg-[#1e1f22] border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 flex-shrink-0 z-20">
      {/* Left: Hamburger Button (3-line menu icon) + Brand + Quick Server Dock */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#2b2d31] hover:bg-[#5865F2] hover:text-white text-slate-800 dark:text-slate-100 transition flex items-center gap-2 shadow-2xs"
          aria-label="사이드 메뉴 열기 (햄버거 메뉴)"
          title="메뉴 및 내 미니 프로필 열기"
        >
          <Menu className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-extrabold pr-1">
            메뉴
          </span>
        </button>

        {/* Brand Logo (Clicks back to Community Lobby) */}
        <button
          onClick={() => {
            closeDm();
            setActiveCommunityId(null);
          }}
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2d31] transition"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#5865F2] to-indigo-500 flex items-center justify-center text-white shadow-xs text-base">
            🍙
          </div>
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                참치김밥
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#FEE500] text-[#3C1E1E]">
                LIVE
              </span>
              {iAmAdmin && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-2xs">
                  👑 최고 관리자
                </span>
              )}
            </div>
          </div>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden md:block mx-1" />

        {/* Quick Discord-style Server Pill Icons */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => {
              closeDm();
              setActiveCommunityId(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeCommunityId === null && activeDmUser === null
                ? "bg-[#5865F2] text-white shadow-xs"
                : "bg-slate-100 dark:bg-[#2b2d31] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#35373c]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>커뮤니티 로비</span>
            {totalCommunityUnreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black shadow-xs">
                {totalCommunityUnreadCount > 99 ? "99+" : totalCommunityUnreadCount}
              </span>
            )}
          </button>

          {joinedCommunities.map((comm) => {
            const isActive = activeCommunityId === comm.id && activeDmUser === null;
            const unreadCount = getCommunityUnreadCount(comm.id);
            return (
              <button
                key={comm.id}
                onClick={() => {
                  closeDm();
                  joinCommunity(comm.id);
                }}
                className={`relative px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition max-w-[160px] ${
                  isActive
                    ? "bg-[#FEE500] text-[#3C1E1E] shadow-xs"
                    : "bg-slate-100 dark:bg-[#2b2d31] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#35373c]"
                }`}
                title={comm.name}
              >
                <span>{comm.iconEmoji}</span>
                <span className="truncate">{comm.name}</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black shadow-md border-2 border-white dark:border-[#1e1f22]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: DM Button + Cloud DB Status + Create Community + Theme Toggle + Current User Mini Pill */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 1:1 DM Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsDmDrawerOpen(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeDmUser !== null
              ? "bg-[#FEE500] text-[#3C1E1E] shadow-xs"
              : "bg-slate-100 dark:bg-[#2b2d31] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#35373c]"
          }`}
          title="1:1 개인 DM 대화 목록 열기"
        >
          <MessageSquareHeart className="w-3.5 h-3.5 text-pink-500" />
          <span className="hidden sm:inline">1:1 DM</span>
        </button>

        {/* Supabase Cloud Status Pill Button */}
        <button
          onClick={() => setIsCloudConfigModalOpen(true)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
            isCloudConnected
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
          }`}
          title="Supabase 클라우드 데이터베이스 설정"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">
            {isCloudConnected ? "Supabase 연결됨" : "클라우드 DB 연동"}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              isCloudConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
        </button>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#FEE500]" />
          <span className="hidden sm:inline">커뮤니티 만들기</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#2b2d31] hover:bg-slate-200 dark:hover:bg-[#35373c] text-slate-700 dark:text-slate-200 transition"
          aria-label="다크/라이트 모드 전환"
          title={theme === "dark" ? "라이트 모드 켜기" : "다크 모드 켜기"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Mini User Profile Trigger (Opens Profile Settings / MyPage) */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#2b2d31] hover:bg-slate-200 dark:hover:bg-[#35373c] border border-slate-200/80 dark:border-white/10 flex items-center gap-2 transition"
          title="마이페이지 · 프로필 및 대명사 설정"
        >
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover bg-slate-700"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-white dark:border-[#2b2d31]" />
          </div>
          <div className="text-left hidden sm:block max-w-[130px]">
            <p className="text-xs font-bold leading-none truncate text-slate-900 dark:text-white flex items-center gap-1">
              <span>{currentUser.name}</span>
              {iAmAdmin && <span className="text-[10px]">👑</span>}
            </p>
            <p className="text-[10px] text-[#5865F2] dark:text-indigo-300 truncate mt-0.5">
              {currentUser.pronouns}
            </p>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
        </button>
      </div>
    </nav>
  );
}
