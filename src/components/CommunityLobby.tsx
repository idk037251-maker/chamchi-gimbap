"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Users,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  MessageSquare,
  Flame,
} from "lucide-react";

const CATEGORIES = [
  "전체",
  "IT / 개발",
  "게임 / e스포츠",
  "디자인 / 예술",
  "라이프 / 자기계발",
  "취미 / 친목",
  "음악 / 문화",
];

export default function CommunityLobby() {
  const {
    communities,
    joinedCommunityIds,
    joinCommunity,
    setIsCreateModalOpen,
    currentUser,
    setIsProfileModalOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const filteredCommunities = communities.filter((comm) => {
    const matchesCategory =
      selectedCategory === "전체" || comm.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      comm.name.toLowerCase().includes(q) ||
      comm.description.toLowerCase().includes(q) ||
      comm.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#313338] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Banner (Discord Discovery + Kakao OpenChat Lounge vibe) */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#5865F2] via-indigo-600 to-[#1e1f22] text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-[#FEE500]/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-[#FEE500]" />
                <span>실시간 오픈 커뮤니티 로비</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                관심사로 모이는 공개 커뮤니티를 탐색해 보세요!
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                원하는 커뮤니티 카드를 클릭하면 즉시 채팅방으로 입장합니다. 왼쪽 상단{" "}
                <strong>햄버거 메뉴(☰)</strong> 또는 우측 버튼을 눌러 직접 새로운
                커뮤니티를 개설할 수도 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#3C1E1E] font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2 transition transform hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>새 커뮤니티 만들기</span>
              </button>

              {currentUser && (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 transition"
                >
                  내 프로필/대명사 편집
                </button>
              )}
            </div>
          </div>

          {/* Search Bar inside Hero */}
          <div className="relative z-10 mt-6 max-w-2xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="커뮤니티 이름, 관심사, #해시태그로 검색해 보세요..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-[#1e1f22] text-slate-900 dark:text-white placeholder:text-slate-400 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-[#FEE500]"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-[#5865F2] text-white shadow-sm"
                    : "bg-white dark:bg-[#2b2d31] text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#35373c] border border-slate-200/70 dark:border-white/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            공개 커뮤니티 총{" "}
            <strong className="text-[#5865F2] dark:text-[#FEE500]">
              {filteredCommunities.length}
            </strong>
            개
          </div>
        </div>

        {/* Community Cards Grid */}
        {filteredCommunities.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/15 text-[#5865F2] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base">
              조건에 맞는 커뮤니티가 없습니다
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              직접 첫 번째 방장이 되어 새로운 오픈 커뮤니티를 개설해 보세요!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5865F2] text-white text-xs font-bold"
            >
              <PlusCircle className="w-4 h-4" />
              커뮤니티 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {filteredCommunities.map((comm) => {
              const isJoined = joinedCommunityIds.includes(comm.id);

              return (
                <div
                  key={comm.id}
                  onClick={() => joinCommunity(comm.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      joinCommunity(comm.id);
                    }
                  }}
                  className="group cursor-pointer rounded-3xl overflow-hidden bg-white dark:bg-[#2b2d31] border border-slate-200/90 dark:border-white/10 hover:border-[#5865F2] dark:hover:border-[#5865F2] shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top Banner */}
                    <div
                      className="h-24 w-full p-4 flex items-start justify-between relative"
                      style={{ background: comm.bannerGradient }}
                    >
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/45 text-white backdrop-blur-md">
                        {comm.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isJoined && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#FEE500] text-[#3C1E1E] shadow-xs">
                            참여 중
                          </span>
                        )}
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/45 text-emerald-300 backdrop-blur-md flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          실시간 {comm.onlineCount}명
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 pt-0 relative">
                      <div className="flex items-end justify-between -mt-7 mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border-4 border-white dark:border-[#2b2d31] flex items-center justify-center text-2xl shadow-md">
                          {comm.iconEmoji}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          방장:{" "}
                          <strong className="text-slate-600 dark:text-slate-300">
                            {comm.createdBy}
                          </strong>
                        </span>
                      </div>

                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-[#5865F2] dark:group-hover:text-indigo-400 transition flex items-center justify-between gap-2">
                        <span className="truncate">{comm.name}</span>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition flex-shrink-0 text-[#5865F2]" />
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                        {comm.description}
                      </p>

                      {/* Preview of Rules count & Tags */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {comm.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-[#1e1f22] text-slate-600 dark:text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-[#1e1f22]/60 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold">
                        <Users className="w-3.5 h-3.5 text-[#5865F2]" />
                        멤버 {comm.memberCount.toLocaleString()}명
                      </span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        규칙 {comm.rules.length}개
                      </span>
                    </div>

                    <span className="font-extrabold text-[#5865F2] dark:text-[#FEE500] flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      <MessageSquare className="w-3.5 h-3.5" />
                      채팅방 입장하기
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
