"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import {
  X,
  PlusCircle,
  Compass,
  Settings,
  LogOut,
  Users,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  Hash,
  Database,
  Cloud,
} from "lucide-react";

export default function HamburgerDrawer() {
  const {
    currentUser,
    isDrawerOpen,
    setIsDrawerOpen,
    setIsCreateModalOpen,
    setIsProfileModalOpen,
    setIsCloudConfigModalOpen,
    isCloudConnected,
    communities,
    joinedCommunityIds,
    activeCommunityId,
    setActiveCommunityId,
    joinCommunity,
    theme,
    toggleTheme,
    logout,
  } = useApp();

  if (!currentUser) return null;

  const joinedCommunities = communities.filter((c) =>
    joinedCommunityIds.includes(c.id)
  );

  const statusColor =
    currentUser.status === "online"
      ? "bg-[#23a55a]"
      : currentUser.status === "idle"
      ? "bg-amber-400"
      : currentUser.status === "dnd"
      ? "bg-rose-500"
      : "bg-slate-400";

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isDrawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over Sidebar Drawer */}
      <aside
        aria-label="사이드 네비게이션 메뉴"
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 sm:w-88 bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 shadow-2xl border-r border-slate-200 dark:border-white/10 flex flex-col transition-transform duration-300 ease-out ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Bar inside Drawer */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500]" />
            <span className="font-extrabold text-sm tracking-tight">
              KakaoCord 내비게이션
            </span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#35373c] transition"
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Top Mini Profile Card (Avatar, Name, Pronouns, Custom Banner, Bio) */}
        <div className="p-4">
          <div className="rounded-2xl overflow-hidden bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/10 shadow-md">
            {/* Custom Banner Image or Gradient */}
            <div
              className="h-20 w-full relative bg-cover bg-center"
              style={{
                background: currentUser.bannerUrl
                  ? `url(${currentUser.bannerUrl}) center/cover no-repeat`
                  : currentUser.bannerColor,
              }}
            >
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/70 text-white text-[11px] font-semibold backdrop-blur-md flex items-center gap-1 transition"
              >
                <Settings className="w-3 h-3" />
                프로필 편집
              </button>
            </div>

            {/* Avatar & Identity Details */}
            <div className="px-4 pb-4 relative">
              <div className="flex items-end justify-between -mt-8 mb-2.5">
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-16 h-16 rounded-2xl border-4 border-slate-50 dark:border-[#1e1f22] bg-slate-700 object-cover shadow-md"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${statusColor} border-2 border-slate-50 dark:border-[#1e1f22]`}
                    title={`상태: ${currentUser.status}`}
                  />
                </div>

                {/* Kakao style status pill */}
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FEE500]/20 dark:bg-[#FEE500]/15 text-amber-900 dark:text-[#FEE500] border border-[#FEE500]/40 max-w-[160px] truncate">
                  💬 {currentUser.statusMessage || "상태 메시지 없음"}
                </span>
              </div>

              {/* Name & Pronouns Badge */}
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {currentUser.name}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#5865F2]/15 dark:bg-[#5865F2]/25 text-[#5865F2] dark:text-indigo-300 border border-[#5865F2]/30">
                  {currentUser.pronouns}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                @{currentUser.username || currentUser.name}
              </p>

              {/* BIO box */}
              <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200/70 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {currentUser.bio || "등록된 소개글(BIO)이 없습니다."}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Primary Actions: '커뮤니티 만들기' & '클라우드 DB 연동' */}
        <div className="px-4 pb-3 space-y-2">
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsCreateModalOpen(true);
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#5865F2] to-indigo-600 hover:from-[#4752C4] hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition transform active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4 text-[#FEE500]" />
            <span>+ 커뮤니티 만들기</span>
          </button>

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsCloudConfigModalOpen(true);
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
              isCloudConnected
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            }`}
          >
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Supabase 클라우드 DB 연동
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCloudConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
          </button>

          <button
            onClick={() => {
              setActiveCommunityId(null);
              setIsDrawerOpen(false);
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
              activeCommunityId === null
                ? "bg-[#FEE500] text-[#3C1E1E] shadow-sm"
                : "bg-slate-100 dark:bg-[#1e1f22] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#35373c]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              전체 커뮤니티 로비 (탐색)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
              {communities.length}개
            </span>
          </button>
        </div>

        {/* 3. Joined / Available Communities List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2 px-1">
              <span>참여 중인 커뮤니티 ({joinedCommunities.length})</span>
              <Sparkles className="w-3 h-3 text-[#FEE500]" />
            </div>
            <div className="space-y-1.5">
              {joinedCommunities.map((comm) => {
                const isActive = activeCommunityId === comm.id;
                return (
                  <button
                    key={comm.id}
                    onClick={() => {
                      joinCommunity(comm.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition ${
                      isActive
                        ? "bg-[#5865F2] text-white shadow-sm"
                        : "hover:bg-slate-100 dark:hover:bg-[#35373c] text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner flex-shrink-0"
                      style={{ background: comm.bannerGradient }}
                    >
                      {comm.iconEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs truncate">{comm.name}</p>
                      <p
                        className={`text-[11px] truncate flex items-center gap-1 mt-0.5 ${
                          isActive
                            ? "text-indigo-100"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Hash className="w-3 h-3" />
                        <span>{comm.category}</span>
                        <span>·</span>
                        <Users className="w-3 h-3" />
                        <span>{comm.memberCount.toLocaleString()}명</span>
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle2 className="w-4 h-4 text-[#FEE500] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. Bottom Account & Theme Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e1f22] flex items-center justify-between gap-2">
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsProfileModalOpen(true);
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#2b2d31] hover:bg-slate-100 dark:hover:bg-[#35373c] border border-slate-200 dark:border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Settings className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>내 프로필 편집</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#2b2d31] hover:bg-slate-100 dark:hover:bg-[#35373c] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 transition"
            title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
