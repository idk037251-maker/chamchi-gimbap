"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { MOCK_ONLINE_MEMBERS } from "@/data/mockData";
import { UserProfile } from "@/types/chat";
import {
  Hash,
  Megaphone,
  HelpCircle,
  ShieldAlert,
  Info,
  Send,
  Smile,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  X,
} from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "😂", "🎉", "✨"];

export default function CommunityChatRoom() {
  const {
    communities,
    activeCommunityId,
    setActiveCommunityId,
    activeChannelId,
    setActiveChannelId,
    messages,
    sendMessage,
    toggleReaction,
    currentUser,
    chatStyle,
    setChatStyle,
    typingUser,
    triggerDemoIncomingMessage,
    isCloudConnected,
  } = useApp();

  // Sample members are only shown in local demo mode (no fake data in production).
  const sampleMembers = isCloudConnected ? [] : MOCK_ONLINE_MEMBERS;

  const [inputText, setInputText] = useState("");
  const [showRulesPanel, setShowRulesPanel] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  const [inspectedUser, setInspectedUser] = useState<{
    name: string;
    pronouns: string;
    avatar: string;
    role?: string;
    bio?: string;
    bannerColor?: string;
    statusMessage?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const community = communities.find((c) => c.id === activeCommunityId);
  const activeChannel =
    community?.channels.find((ch) => ch.id === activeChannelId) ||
    community?.channels[0];

  const roomMessages = messages.filter(
    (m) =>
      m.communityId === activeCommunityId &&
      m.channelId === (activeChannel?.id || "general")
  );

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages.length, typingUser, activeCommunityId, activeChannelId]);

  if (!community || ! currentUser) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim()) {
        sendMessage(inputText);
        setInputText("");
      }
    }
  };

  const openUserInspector = (
    name: string,
    pronouns: string,
    avatar: string,
    role?: string
  ) => {
    const foundMock = MOCK_ONLINE_MEMBERS.find((u) => u.name === name);
    if (name === currentUser.name) {
      setInspectedUser({
        name: currentUser.name,
        pronouns: currentUser.pronouns,
        avatar: currentUser.avatarUrl,
        role: "나 (본인)",
        bio: currentUser.bio,
        bannerColor: currentUser.bannerColor,
        statusMessage: currentUser.statusMessage,
      });
    } else if (foundMock) {
      setInspectedUser({
        name: foundMock.name,
        pronouns: foundMock.pronouns,
        avatar: foundMock.avatarUrl,
        role: role || "멤버",
        bio: foundMock.bio,
        bannerColor: foundMock.bannerColor,
        statusMessage: foundMock.statusMessage,
      });
    } else {
      setInspectedUser({
        name,
        pronouns,
        avatar,
        role: role || "멤버",
        bio: "KakaoCord 커뮤니티에서 활발히 소통 중인 멤버입니다.",
        bannerColor: community.bannerGradient,
        statusMessage: "실시간 대화 참여 중 💬",
      });
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-white dark:bg-[#313338] text-slate-900 dark:text-slate-100 relative">
      {/* 1. Left Channel Sidebar (Discord Server Channel List style) */}
      <div className="hidden md:flex w-60 flex-col bg-slate-100 dark:bg-[#2b2d31] border-r border-slate-200 dark:border-white/10 flex-shrink-0">
        {/* Community Mini Banner Header */}
        <div
          className="h-24 p-4 flex flex-col justify-end text-white relative overflow-hidden"
          style={{ background: community.bannerGradient }}
        >
          <div className="absolute inset-0 bg-black/25" />
          <div className="relative z-10 flex items-center gap-2.5">
            <span className="text-2xl drop-shadow">{community.iconEmoji}</span>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm truncate drop-shadow">
                {community.name}
              </h2>
              <p className="text-[11px] text-white/85 truncate">
                {community.category} · {community.memberCount.toLocaleString()}명
              </p>
            </div>
          </div>
        </div>

        {/* Back to Lobby button */}
        <div className="p-3 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={() => setActiveCommunityId(null)}
            className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#1e1f22] hover:bg-slate-200/70 dark:hover:bg-[#35373c] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>커뮤니티 로비로 돌아가기</span>
          </button>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="px-2 mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              채팅 채널 목록
            </div>
            <div className="space-y-1">
              {community.channels.map((ch) => {
                const isSelected = activeChannel?.id === ch.id;
                const Icon =
                  ch.type === "announcement"
                    ? Megaphone
                    : ch.type === "qna"
                    ? HelpCircle
                    : Hash;

                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                      isSelected
                        ? "bg-[#5865F2] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#35373c]"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 opacity-85" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Rules Summary Card inside Channel Sidebar */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#FEE500]" />
                핵심 이용 규칙
              </span>
              <button
                onClick={() => setShowRulesPanel((prev) => !prev)}
                className="text-[11px] text-[#5865F2] dark:text-indigo-400 hover:underline"
              >
                {showRulesPanel ? "접기" : "펼치기"}
              </button>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {community.rules.slice(0, 3).map((r, i) => (
                <li key={i} className="line-clamp-2">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* UI Style Switcher (Hybrid / Discord / KakaoTalk) */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-200/50 dark:bg-[#1e1f22]/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 px-1">
            채팅방 말풍선 테마 모드
          </div>
          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-[#2b2d31] p-1 rounded-xl border border-slate-200 dark:border-white/10">
            {(
              [
                { id: "hybrid", label: "하이브리드" },
                { id: "discord", label: "디스코드풍" },
                { id: "kakao", label: "카카오톡풍" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setChatStyle(mode.id)}
                className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                  chatStyle === mode.id
                    ? "bg-[#5865F2] text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Center Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Room Top Header with Community Name & Rules/Details Toggle */}
        <header className="px-4 py-3 bg-white dark:bg-[#313338] border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 z-10 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile back to lobby button */}
            <button
              onClick={() => setActiveCommunityId(null)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#2b2d31] text-slate-700 dark:text-slate-200"
              title="로비로 돌아가기"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-xs flex-shrink-0"
              style={{ background: community.bannerGradient }}
            >
              {community.iconEmoji}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base truncate">
                  {community.name}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-[#2b2d31] text-[#5865F2] dark:text-indigo-300">
                  <Hash className="w-3 h-3" />
                  {activeChannel?.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {activeChannel?.description}
              </p>
            </div>
          </div>

          {/* Right Header Controls: Rules/Details Toggle & Member List Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowRulesPanel((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                showRulesPanel
                  ? "bg-[#FEE500] text-[#3C1E1E] border-[#FEE500] shadow-xs"
                  : "bg-slate-100 dark:bg-[#2b2d31] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-[#35373c]"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>규칙 및 상세 정보</span>
              {showRulesPanel ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {!isCloudConnected && (
              <button
                onClick={triggerDemoIncomingMessage}
                className="hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5865F2]/15 hover:bg-[#5865F2]/25 text-[#5865F2] dark:text-indigo-300 border border-[#5865F2]/30 items-center gap-1.5 transition"
                title="로컬 데모 모드 전용: 상대방 메시지 도착 시뮬레이션"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>실시간 대화 테스트</span>
              </button>
            )}

            <button
              onClick={() => setShowMembersSidebar((prev) => !prev)}
              className={`hidden lg:flex p-2 rounded-xl border transition ${
                showMembersSidebar
                  ? "bg-[#5865F2] text-white border-[#5865F2]"
                  : "bg-slate-100 dark:bg-[#2b2d31] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
              }`}
              title="참여 멤버 목록 토글"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile Channel Switcher Bar */}
        <div className="md:hidden flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-[#2b2d31] border-b border-slate-200 dark:border-white/10 overflow-x-auto">
          {community.channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannelId(ch.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                activeChannel?.id === ch.id
                  ? "bg-[#5865F2] text-white"
                  : "bg-white dark:bg-[#1e1f22] text-slate-600 dark:text-slate-300"
              }`}
            >
              # {ch.name}
            </button>
          ))}
        </div>

        {/* Collapsible Community Rules & Description Megaphone Banner (Kakao OpenChat Notice + Discord Rules) */}
        {showRulesPanel && (
          <div className="bg-slate-50 dark:bg-[#2b2d31]/95 border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 py-4 transition-all">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#5865F2] dark:text-[#FEE500]">
                  <Megaphone className="w-4 h-4" />
                  <span>커뮤니티 상세 소개 (Description)</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {community.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {community.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200/70 dark:bg-[#1e1f22] text-slate-600 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:w-80 lg:w-96 p-3.5 rounded-2xl bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-[#FEE500]" />
                    필독! 커뮤니티 규칙 (Rules)
                  </span>
                  <button
                    onClick={() => setShowRulesPanel(false)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    닫기 ✕
                  </button>
                </div>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {community.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#23a55a] flex-shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Messages Stream Container */}
        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 transition-colors ${
            chatStyle === "kakao"
              ? "bg-[#B2C7DA] dark:bg-[#1e2229]"
              : "bg-slate-50/50 dark:bg-[#313338]"
          }`}
        >
          {/* Welcome Channel Header */}
          <div className="pb-4 border-b border-slate-200/70 dark:border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300 flex items-center justify-center text-2xl mb-2">
              {community.iconEmoji}
            </div>
            <h3 className="text-lg font-extrabold">
              #{activeChannel?.name} 채널에 오신 것을 환영합니다!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              이곳은 <strong>{community.name}</strong>의 실시간 대화 공간입니다. 모든
              대화에서 상대방의 <strong>이름과 대명사(Pronouns)</strong>를 존중해 주세요.
            </p>
          </div>

          {/* Message Items */}
          {roomMessages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-black/10 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                    {msg.content}
                  </span>
                </div>
              );
            }

            const isMe = msg.senderId === currentUser.id;

            // Render in Discord Stream Mode vs Hybrid/Kakao Bubble Mode
            if (chatStyle === "discord") {
              return (
                <div
                  key={msg.id}
                  className="group flex items-start gap-3.5 hover:bg-slate-200/40 dark:hover:bg-[#2b2d31]/60 -mx-3 px-3 py-2 rounded-2xl transition"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openUserInspector(
                        msg.senderName,
                        msg.senderPronouns,
                        msg.senderAvatar,
                        msg.senderRole
                      )
                    }
                    className="flex-shrink-0 focus:outline-none"
                  >
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="w-10 h-10 rounded-2xl bg-slate-700 object-cover hover:scale-105 transition"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          openUserInspector(
                            msg.senderName,
                            msg.senderPronouns,
                            msg.senderAvatar,
                            msg.senderRole
                          )
                        }
                        className="font-extrabold text-sm text-slate-900 dark:text-white hover:underline"
                      >
                        {msg.senderName}
                      </button>

                      {/* Pronouns Badge */}
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300">
                        {msg.senderPronouns}
                      </span>

                      {msg.senderRole && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                            msg.senderRole === "방장"
                              ? "bg-[#FEE500] text-[#3C1E1E]"
                              : msg.senderRole === "BOT"
                              ? "bg-[#5865F2] text-white"
                              : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {msg.senderRole}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 ml-1">
                        {msg.timestamp}
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>

                    {/* Reactions Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {msg.reactions.map((r) => {
                        const reacted = r.users.includes(currentUser.id);
                        return (
                          <button
                            key={r.emoji}
                            onClick={() => toggleReaction(msg.id, r.emoji)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition ${
                              reacted
                                ? "bg-[#5865F2]/20 border-[#5865F2] text-[#5865F2] dark:text-indigo-300"
                                : "bg-white dark:bg-[#2b2d31] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span>{r.users.length}</span>
                          </button>
                        );
                      })}

                      {/* Quick reaction picker on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white dark:bg-[#2b2d31] px-2 py-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                        {QUICK_REACTIONS.map((em) => (
                          <button
                            key={em}
                            onClick={() => toggleReaction(msg.id, em)}
                            className="hover:scale-125 transition text-xs"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Default Hybrid (KakaoTalk Bubble + Discord Identity/Pronouns/Reactions)
            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-3 ${
                  isMe ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Sender Avatar */}
                <button
                  type="button"
                  onClick={() =>
                    openUserInspector(
                      msg.senderName,
                      msg.senderPronouns,
                      msg.senderAvatar,
                      msg.senderRole
                    )
                  }
                  className="flex-shrink-0 focus:outline-none"
                >
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-10 h-10 rounded-2xl bg-slate-700 object-cover shadow-xs hover:scale-105 transition border border-black/10 dark:border-white/10"
                  />
                </button>

                <div
                  className={`flex flex-col max-w-[78%] sm:max-w-[68%] ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender Name, Pronouns & Role Header */}
                  <div
                    className={`flex flex-wrap items-center gap-1.5 mb-1 ${
                      isMe ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openUserInspector(
                          msg.senderName,
                          msg.senderPronouns,
                          msg.senderAvatar,
                          msg.senderRole
                        )
                      }
                      className="font-bold text-xs text-slate-800 dark:text-slate-200 hover:underline"
                    >
                      {msg.senderName}
                    </button>

                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#5865F2]/15 dark:bg-[#5865F2]/25 text-[#5865F2] dark:text-indigo-300">
                      {msg.senderPronouns}
                    </span>

                    {msg.senderRole && (
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                          msg.senderRole === "방장"
                            ? "bg-[#FEE500] text-[#3C1E1E]"
                            : msg.senderRole === "BOT"
                            ? "bg-[#5865F2] text-white"
                            : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {msg.senderRole}
                      </span>
                    )}
                  </div>

                  {/* Bubble + Kakao Unread Count '1' + Timestamp */}
                  <div
                    className={`flex items-end gap-1.5 ${
                      isMe ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs whitespace-pre-wrap break-words ${
                        isMe
                          ? "bg-[#FEE500] text-[#3C1E1E] font-medium rounded-tr-xs"
                          : "bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 rounded-tl-xs"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* KakaoTalk Style Unread '1' & Sent Timestamp */}
                    <div
                      className={`flex flex-col text-[10px] leading-tight flex-shrink-0 ${
                        isMe ? "items-end" : "items-start"
                      }`}
                    >
                      {typeof msg.unreadCount === "number" &&
                        msg.unreadCount > 0 && (
                          <span className="font-extrabold text-[#F59E0B] dark:text-[#FEE500]">
                            {msg.unreadCount}
                          </span>
                        )}
                      <span className="text-slate-500 dark:text-slate-400">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Reactions Bar below Bubble */}
                  <div
                    className={`flex flex-wrap items-center gap-1 mt-1.5 ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.reactions.map((r) => {
                      const reacted = r.users.includes(currentUser.id);
                      return (
                        <button
                          key={r.emoji}
                          onClick={() => toggleReaction(msg.id, r.emoji)}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border transition ${
                            reacted
                              ? "bg-[#5865F2] text-white border-[#5865F2]"
                              : "bg-white/90 dark:bg-[#2b2d31] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span>{r.emoji}</span>
                          <span>{r.users.length}</span>
                        </button>
                      );
                    })}

                    <div className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-white/95 dark:bg-[#2b2d31] px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 shadow-2xs">
                      {QUICK_REACTIONS.map((em) => (
                        <button
                          key={em}
                          onClick={() => toggleReaction(msg.id, em)}
                          className="hover:scale-125 transition text-xs"
                          title={`${em} 반응 남기기`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typingUser && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 animate-pulse pl-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#FEE500]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
              </span>
              <span>
                <strong>{typingUser}</strong> 님이 메시지를 입력하고 있습니다...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar (Discord + KakaoTalk fusion) */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 bg-white dark:bg-[#313338] border-t border-slate-200 dark:border-white/10"
        >
          <div className="flex items-end gap-2 bg-slate-100 dark:bg-[#383a40] rounded-2xl px-3.5 py-2 border border-slate-200/80 dark:border-white/5 focus-within:ring-2 focus-within:ring-[#5865F2]">
            <div className="flex items-center gap-1 pb-1">
              {["👋", "🔥", "👍", "🎉"].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setInputText((prev) => prev + em)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-[#2b2d31] flex items-center justify-center text-sm transition"
                  title={`${em} 이모지 추가`}
                >
                  {em}
                </button>
              ))}
            </div>

            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`#${activeChannel?.name} 채널에 메시지 보내기... (Enter로 전송, Shift+Enter 줄바꿈)`}
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none max-h-28 py-1"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition ${
                inputText.trim()
                  ? "bg-[#FEE500] hover:bg-[#FADA0A] text-[#3C1E1E] shadow-xs"
                  : "bg-slate-200 dark:bg-[#2b2d31] text-slate-400 cursor-not-allowed"
              }`}
            >
              <span>전송</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. Right Online Members Sidebar (Discord Member List with Pronouns & Status) */}
      {showMembersSidebar && (
        <aside className="hidden lg:flex w-64 flex-col bg-slate-100 dark:bg-[#2b2d31] border-l border-slate-200 dark:border-white/10 p-4 overflow-y-auto flex-shrink-0">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>실시간 접속 멤버 — {sampleMembers.length + 1}</span>
            <MessageSquare className="w-3.5 h-3.5 text-[#5865F2]" />
          </div>

          <div className="space-y-2">
            {/* Current Logged-in User */}
            <button
              type="button"
              onClick={() =>
                openUserInspector(
                  currentUser.name,
                  currentUser.pronouns,
                  currentUser.avatarUrl,
                  "나 (본인)"
                )
              }
              className="w-full p-2 rounded-xl bg-white dark:bg-[#1e1f22] hover:bg-slate-200/60 dark:hover:bg-[#35373c] flex items-center gap-2.5 text-left transition border border-[#5865F2]/30"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover bg-slate-700"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#23a55a] border-2 border-white dark:border-[#1e1f22]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-xs truncate">{currentUser.name}</p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-[#5865F2] text-white">
                    ME
                  </span>
                </div>
                <p className="text-[10px] text-[#5865F2] dark:text-indigo-300 truncate">
                  {currentUser.pronouns}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.statusMessage}
                </p>
              </div>
            </button>

            {/* Other Online Members */}
            {sampleMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() =>
                  openUserInspector(
                    member.name,
                    member.pronouns,
                    member.avatarUrl,
                    "멤버"
                  )
                }
                className="w-full p-2 rounded-xl hover:bg-white dark:hover:bg-[#35373c] flex items-center gap-2.5 text-left transition"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-9 h-9 rounded-xl object-cover bg-slate-700"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-100 dark:border-[#2b2d31] ${
                      member.status === "online"
                        ? "bg-[#23a55a]"
                        : member.status === "idle"
                        ? "bg-amber-400"
                        : "bg-rose-500"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                    {member.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {member.pronouns}
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-[#FEE500] truncate">
                    💬 {member.statusMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Mini User Profile Popover Modal when clicking any sender's avatar/name */}
      {inspectedUser && (
        <div
          onClick={() => setInspectedUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl overflow-hidden bg-white dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-white/10"
          >
            <div
              className="h-24 w-full relative"
              style={{
                background:
                  inspectedUser.bannerColor || community.bannerGradient,
              }}
            >
              <button
                onClick={() => setInspectedUser(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 pb-5 relative">
              <div className="flex items-end justify-between -mt-10 mb-3">
                <img
                  src={inspectedUser.avatar}
                  alt={inspectedUser.name}
                  className="w-20 h-20 rounded-2xl border-4 border-white dark:border-[#1e1f22] bg-slate-800 object-cover shadow-md"
                />
                {inspectedUser.role && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEE500] text-[#3C1E1E]">
                    {inspectedUser.role}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-extrabold text-base">{inspectedUser.name}</h4>
                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#5865F2]/20 text-[#5865F2] dark:text-indigo-300">
                  {inspectedUser.pronouns}
                </span>
              </div>

              {inspectedUser.statusMessage && (
                <p className="text-xs font-medium text-amber-600 dark:text-[#FEE500] mt-1">
                  💬 {inspectedUser.statusMessage}
                </p>
              )}

              <div className="mt-3 p-3 rounded-2xl bg-slate-100 dark:bg-[#2b2d31] text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                  소개글 (BIO)
                </div>
                {inspectedUser.bio}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
