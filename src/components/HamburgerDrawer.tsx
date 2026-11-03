"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { deduplicateCommunities } from "@/lib/communityUtils";
import { isSuperAdmin, isUserBanned, formatBanExpiry } from "@/types/chat";
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
  Database,
  MessageSquareHeart,
  User,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";

export default function HamburgerDrawer() {
  const {
    currentUser,
    isDrawerOpen,
    setIsDrawerOpen,
    setIsCreateModalOpen,
    setIsProfileModalOpen,
    setIsCloudConfigModalOpen,
    setIsSupportModalOpen,
    isCloudConnected,
    communities,
    joinedCommunityIds,
    activeCommunityId,
    setActiveCommunityId,
    closeDm,
    setIsDmDrawerOpen,
    inspectUser,
    joinCommunity,
    getCommunityUnreadCount,
    totalCommunityUnreadCount,
    followCounts,
    openFollowListModal,
    theme,
    toggleTheme,
    logout,
  } = useApp();

  if (!currentUser) return null;

  const dedupedCommunities = deduplicateCommunities(communities || []);
  const joinedCommunities = dedupedCommunities.filter((c) =>
    (joinedCommunityIds || []).includes(c?.id)
  );

  const statusColor =
    currentUser.status === "online"
      ? "bg-[#23a55a]"
      : currentUser.status === "idle"
      ? "bg-amber-400"
      : currentUser.status === "dnd"
      ? "bg-rose-500"
      : "bg-slate-400";

  const iAmAdmin = isSuperAdmin(currentUser);

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
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5C842]" />
            <span className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
              <span>🍙</span>
              <span>참치김밥 메뉴</span>
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

                {/* Status pill */}
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F5C842]/20 dark:bg-[#F5C842]/15 text-amber-900 dark:text-[#F5C842] border border-[#F5C842]/40 max-w-[160px] truncate">
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
                {iAmAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                    👑 최고 관리자
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                @{currentUser.username || currentUser.name}
              </p>

              {/* Follower / Following Quick Access */}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openFollowListModal("followers", currentUser);
                  }}
                  className="hover:text-[#5865F2] dark:hover:text-[#F5C842] hover:underline transition cursor-pointer"
                  title="내 팔로워 명단 보기"
                >
                  <strong className="text-slate-900 dark:text-white font-extrabold">
                    {followCounts[currentUser.id]?.followers || 0}
                  </strong>{" "}
                  팔로워
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    openFollowListModal("following", currentUser);
                  }}
                  className="hover:text-[#5865F2] dark:hover:text-[#F5C842] hover:underline transition cursor-pointer"
                  title="내 팔로잉 명단 보기"
                >
                  <strong className="text-slate-900 dark:text-white font-extrabold">
                    {followCounts[currentUser.id]?.following || 0}
                  </strong>{" "}
                  팔로잉
                </button>
              </div>

              {/* View My Profile & Feed Button */}
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  inspectUser(currentUser);
                }}
                className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-slate-200/70 dark:bg-[#2b2d31] hover:bg-[#5865F2] hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>내 프로필 및 피드(사진/글) 보기</span>
              </button>

              {/* Banned Alert Banner */}
              {isUserBanned(currentUser) && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold space-y-0.5">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>계정 활동 제한 적용 중</span>
                  </p>
                  <p className="text-[11px] opacity-90">
                    만료: {formatBanExpiry(currentUser.bannedUntil)}
                  </p>
                  <p className="text-[10px] opacity-80">
                    사유: {currentUser.banReason || "운영 원칙 위반"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Primary Actions: '커뮤니티 만들기' & '1:1 DM' & '클라우드 DB' & '문의하기' */}
        <div className="px-4 pb-3 space-y-2">
          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsCreateModalOpen(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#5865F2] to-indigo-600 hover:from-[#4752C4] hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4 text-[#F5C842]" />
            <span>+ 커뮤니티 만들기</span>
          </button>

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsSupportModalOpen(true);
            }}
            className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between bg-slate-50 dark:bg-[#1e1f22] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#35373c] border border-slate-200/80 dark:border-white/5 transition"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#5865F2]" />
              <span>문의하기 / 문제 신고</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-extrabold">
              비공개 1:1
            </span>
          </button>

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsDmDrawerOpen(true);
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] hover:bg-slate-200 dark:hover:bg-[#35373c] text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between transition border border-slate-200/60 dark:border-white/5"
          >
            <span className="flex items-center gap-2">
              <MessageSquareHeart className="w-4 h-4 text-pink-500" />
              <span>1:1 개인 DM 대화 목록</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5C842] text-[#1E1B13] font-extrabold">
              열기
            </span>
          </button>

          <button
            onClick={() => {
              setIsDrawerOpen(false);
              setIsCloudConfigModalOpen(true);
            }}
            className={`w-full py-2 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
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
              className={`w-2 h-2 rounded-full ${
                isCloudConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
          </button>

          <button
            onClick={() => {
              closeDm();
              setActiveCommunityId(null);
              setIsDrawerOpen(false);
            }}
            className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
              activeCommunityId === null
                ? "bg-[#F5C842] text-[#1E1B13] shadow-sm"
                : "bg-slate-100 dark:bg-[#1e1f22] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#35373c]"
            }`}
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              전체 커뮤니티 로비 (탐색)
            </span>
            <div className="flex items-center gap-1.5">
              {totalCommunityUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-4.5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-xs">
                  {totalCommunityUnreadCount > 99 ? "99+" : totalCommunityUnreadCount}
                </span>
              )}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                {dedupedCommunities.length}개
              </span>
            </div>
          </button>
        </div>

        {/* 3. Joined / Available Communities List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#5865F2]" />
                참여 중인 커뮤니티 ({joinedCommunities.length})
              </span>
            </div>

            {joinedCommunities.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-slate-50 dark:bg-[#1e1f22] text-xs text-slate-400">
                아직 참여한 커뮤니티가 없습니다.
              </div>
            ) : (
              <div className="space-y-1">
                {joinedCommunities.map((comm) => {
                  const isActive = activeCommunityId === comm.id;
                  const unreadCount = getCommunityUnreadCount(comm.id);
                  return (
                    <button
                      key={comm.id}
                      onClick={() => {
                        closeDm();
                        joinCommunity(comm.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                        isActive
                          ? "bg-[#5865F2] text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e1f22]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base">{comm.iconEmoji}</span>
                        <span className="truncate">{comm.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-sm">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                        <span className="text-[10px] opacity-75">{comm.memberCount}명</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. Bottom Footer: Dark/Light Mode + Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#1e1f22]/60">
          <button
            onClick={toggleTheme}
            className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#2b2d31] hover:bg-slate-100 dark:hover:bg-[#35373c] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>라이트 모드</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>다크 모드</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (confirm("로그아웃 하시겠습니까?")) {
                logout();
                setIsDrawerOpen(false);
              }
            }}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
            title="로그아웃"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>
    </>
  );
}
