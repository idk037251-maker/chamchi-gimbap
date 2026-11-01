"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { UserProfile } from "@/types/chat";
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  X,
  Search,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function FollowListModal() {
  const {
    followModalState,
    closeFollowListModal,
    getFollowersList,
    getFollowingList,
    inspectUser,
    currentUser,
    followingIds,
    toggleFollowUser,
  } = useApp();

  const { isOpen, type, targetUser } = followModalState;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [followActionLoadingId, setFollowActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !targetUser) return;

    let isMounted = true;
    setIsLoading(true);
    setSearchQuery("");

    const fetchUsers = async () => {
      try {
        const list =
          type === "followers"
            ? await getFollowersList(targetUser.id)
            : await getFollowingList(targetUser.id);
        if (isMounted) {
          setUsers(list);
        }
      } catch (err) {
        console.error("Failed to fetch follow list:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, type, targetUser?.id, getFollowersList, getFollowingList]);

  if (!isOpen || !targetUser) return null;

  const titleText = type === "followers" ? "팔로워" : "팔로잉";
  const subtitleText =
    type === "followers"
      ? `${targetUser.name} 님을 팔로우하는 사람들`
      : `${targetUser.name} 님이 팔로우하는 사람들`;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = (u.name || "").toLowerCase().includes(q);
    const unameMatch = (u.username || "").toLowerCase().includes(q);
    const bioMatch = (u.bio || "").toLowerCase().includes(q);
    return nameMatch || unameMatch || bioMatch;
  });

  const handleSelectUser = (u: UserProfile) => {
    closeFollowListModal();
    inspectUser(u);
  };

  const handleToggleFollow = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    if (followActionLoadingId) return;
    setFollowActionLoadingId(targetUserId);
    try {
      await toggleFollowUser(targetUserId);
    } finally {
      setFollowActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-[#1e1f22]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-sm shrink-0">
              {type === "followers" ? (
                <Users className="w-5 h-5" />
              ) : (
                <UserCheck className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{titleText}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-extrabold">
                  {users.length}명
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {subtitleText}
              </p>
            </div>
          </div>

          <button
            onClick={closeFollowListModal}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2b2d31] transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter */}
        <div className="px-4 py-2.5 border-b border-slate-200/70 dark:border-white/5 bg-white dark:bg-[#2b2d31]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, @아이디 또는 소개글 검색..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 border-0 outline-hidden focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>
        </div>

        {/* User List Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#5865F2]" />
              <span className="text-xs font-semibold">{titleText} 명단 불러오는 중...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center space-y-2 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#1e1f22] flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {searchQuery
                  ? "검색 결과가 없습니다."
                  : type === "followers"
                  ? "아직 팔로워가 없습니다."
                  : "아직 팔로잉하는 유저가 없습니다."}
              </p>
              {!searchQuery && (
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  커뮤니티와 피드에서 다양한 유저를 만나 팔로우해 보세요!
                </p>
              )}
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isCurrentUser = currentUser?.id === u.id;
              const isFollowing = (followingIds || []).includes(u.id);
              const isActionLoading = followActionLoadingId === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleSelectUser(u);
                  }}
                  className="group p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-white/5 hover:border-[#5865F2] dark:hover:border-[#5865F2] bg-slate-50/50 dark:bg-[#1e1f22]/70 hover:bg-white dark:hover:bg-[#1e1f22] transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer shadow-2xs hover:shadow-md"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={
                        u.avatarUrl ||
                        `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
                          u.name || u.id
                        )}`
                      }
                      alt={u.name}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-700 shrink-0 border border-slate-200 dark:border-white/10 group-hover:scale-105 transition transform"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-[#5865F2] dark:group-hover:text-[#FEE500] transition">
                          {u.name}
                        </span>

                        {u.pronouns && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300">
                            {u.pronouns}
                          </span>
                        )}

                        {isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-[#5865F2] text-white">
                            나
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        @{u.username || u.id}
                      </p>

                      {/* Bio or Status message */}
                      {(u.bio || u.statusMessage) && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5 leading-snug">
                          {u.bio || `💬 ${u.statusMessage}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Follow / Unfollow Button */}
                  {!isCurrentUser && (
                    <button
                      type="button"
                      onClick={(e) => handleToggleFollow(e, u.id)}
                      disabled={isActionLoading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-2xs ${
                        isFollowing
                          ? "bg-slate-200 dark:bg-[#2b2d31] text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white border border-slate-300 dark:border-white/10"
                          : "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                      }`}
                      title={isFollowing ? "클릭하여 언팔로우" : "팔로우하기"}
                    >
                      {isActionLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500 group-hover:hidden" />
                          <UserMinus className="w-3.5 h-3.5 hidden group-hover:inline" />
                          <span>팔로잉</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>팔로우</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}