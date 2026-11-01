"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { isSuperAdmin, UserProfile } from "@/types/chat";
import {
  X,
  MessageSquare,
  Search,
  Users,
  MessageCircle,
} from "lucide-react";

export default function DmListDrawer() {
  const {
    currentUser,
    isDmDrawerOpen,
    setIsDmDrawerOpen,
    communities,
    openDmWithUser,
    activeDmUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");

  if (!isDmDrawerOpen || !currentUser) return null;

  // Collect all unique members from joined communities to allow starting a DM
  const memberMap = new Map<string, UserProfile>();
  for (const c of communities) {
    for (const m of c.members || []) {
      if (m.userId !== currentUser.id && !memberMap.has(m.userId)) {
        memberMap.set(m.userId, {
          id: m.userId,
          username: m.username || m.name,
          name: m.name,
          pronouns: m.pronouns,
          avatarUrl: m.avatarUrl,
          bannerUrl: "",
          bannerColor: "from-indigo-600 to-purple-600",
          bio: "",
          statusMessage: "",
          status: "online",
          createdAt: m.joinedAt,
          authProvider: "site",
        });
      }
    }
  }

  const allMembers = Array.from(memberMap.values());
  const filtered = allMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.username && m.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setIsDmDrawerOpen(false)}
    >
      <div
        className="w-full max-w-sm h-full bg-white dark:bg-[#1e1f22] border-l border-slate-200 dark:border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="h-14 px-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#5865F2]" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              1:1 개인 DM 대화 목록
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsDmDrawerOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2d31] text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#2b2d31] text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="대화할 사용자 검색..."
              className="bg-transparent border-none outline-none flex-1 placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* DM User List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="px-2 py-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            커뮤니티 멤버 ({filtered.length})
          </p>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <MessageCircle className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">대화할 수 있는 사용자가 없습니다.</p>
              <p className="text-[11px]">다른 커뮤니티에 참가해 사람들을 만나보세요!</p>
            </div>
          ) : (
            filtered.map((user) => {
              const isAdmin = isSuperAdmin(user);
              const isSelected = activeDmUser?.id === user.id;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => openDmWithUser(user)}
                  className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition ${
                    isSelected
                      ? "bg-[#5865F2] text-white shadow-xs"
                      : "hover:bg-slate-100 dark:hover:bg-[#2b2d31] text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover bg-slate-700"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-white dark:border-[#1e1f22]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate">{user.name}</span>
                        {user.pronouns && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300"
                            }`}
                          >
                            {user.pronouns}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-900">
                            👑 관리자
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        @{user.username || user.name}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-xl text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-[#35373c] text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    대화하기
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
