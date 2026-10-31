"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Hash,
  Megaphone,
  HelpCircle,
  ShieldAlert,
  Info,
  Send,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  X,
} from "lucide-react";

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
  } = useApp();

  const [inputText, setInputText] = useState("");
  const [showRulesPanel, setShowRulesPanel] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [inspectedUser, setInspectedUser] = useState<{
    name: string;
    pronouns: string;
    avatar: string;
    role?: string;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages.length, activeCommunityId, activeChannelId]);

  if (!community || !currentUser) return null;

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

  // Collect unique active members in this room
  const activeParticipants = Array.from(
    new Map(
      roomMessages
        .filter((m) => !m.isSystem)
        .map((m) => [m.senderId, { id: m.senderId, name: m.senderName, pronouns: m.senderPronouns, avatar: m.senderAvatar, role: m.senderRole }])
    ).values()
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-white dark:bg-[#313338] text-slate-900 dark:text-slate-100 relative">
      {/* 1. Left Channel Sidebar */}
      <div className="hidden md:flex w-60 flex-col bg-slate-100 dark:bg-[#2b2d31] border-r border-slate-200 dark:border-white/10 flex-shrink-0">
        <div
          className="h-24 p-4 flex flex-col justify-end text-white relative overflow-hidden"
          style={{ background: community.bannerGradient }}
        >
          <div className="absolute inset-0 bg-black/25" />
          <div className="relative z-10 flex items-center gap-2.5">
            <span className="text-2xl drop-shadow">{community.iconEmoji}</span>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm truncate drop-shadow">{community.name}</h2>
              <p className="text-[11px] text-white/85 truncate">{community.category}</p>
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={() => setActiveCommunityId(null)}
            className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#1e1f22] hover:bg-slate-200/70 dark:hover:bg-[#35373c] text-xs font-bold flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#5865F2]" />
            <span>로비로 돌아가기</span>
          </button>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="px-2 mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              채널 목록
            </div>
            <div className="space-y-1">
              {community.channels.map((ch) => {
                const isSelected = activeChannel?.id === ch.id;
                const Icon =
                  ch.type === "announcement" ? Megaphone : ch.type === "qna" ? HelpCircle : Hash;

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
        </div>
      </div>

      {/* 2. Main Chat Stream */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 bg-white dark:bg-[#313338] border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setActiveCommunityId(null)}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#2b2d31]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xl">{community.iconEmoji}</span>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base truncate">{community.name}</h2>
              <p className="text-[11px] text-slate-400 truncate">#{activeChannel?.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowRulesPanel((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                showRulesPanel
                  ? "bg-[#FEE500] text-[#3C1E1E] border-[#FEE500]"
                  : "bg-slate-100 dark:bg-[#2b2d31] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>규칙 및 상세 정보</span>
              {showRulesPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setShowMembersSidebar((prev) => !prev)}
              className={`p-2 rounded-xl border transition ${
                showMembersSidebar
                  ? "bg-[#5865F2] text-white border-[#5865F2]"
                  : "bg-slate-100 dark:bg-[#2b2d31] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
              }`}
              title="참여 멤버 보기"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Collapsible Rules & Info */}
        {showRulesPanel && (
          <div className="bg-slate-50 dark:bg-[#2b2d31]/95 border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 py-4">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 justify-between">
              <div className="space-y-1.5 flex-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#5865F2] dark:text-[#FEE500]">
                  <Megaphone className="w-4 h-4" />
                  <span>커뮤니티 소개</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {community.description}
                </p>
              </div>

              <div className="md:w-80 p-3.5 rounded-2xl bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 space-y-2">
                <span className="text-xs font-extrabold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#FEE500]" />
                  커뮤니티 이용 규칙
                </span>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
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

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-[#313338]">
          {roomMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
              <span className="text-3xl">💬</span>
              <p className="font-bold text-sm">아직 작성된 메시지가 없습니다.</p>
              <p className="text-xs">이 방의 첫 번째 메시지를 보내 대화를 시작해 보세요!</p>
            </div>
          ) : (
            roomMessages.map((msg) => {
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

              return (
                <div key={msg.id} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <button
                    type="button"
                    onClick={() =>
                      setInspectedUser({
                        name: msg.senderName,
                        pronouns: msg.senderPronouns,
                        avatar: msg.senderAvatar,
                        role: msg.senderRole,
                      })
                    }
                  >
                    <img
                      src={msg.senderAvatar}
                      alt=""
                      className="w-10 h-10 rounded-2xl bg-slate-700 object-cover shadow-xs border border-black/10 dark:border-white/10"
                    />
                  </button>

                  <div className={`flex flex-col max-w-[78%] sm:max-w-[68%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="font-bold text-xs">{msg.senderName}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300">
                        {msg.senderPronouns}
                      </span>
                      {msg.senderRole && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FEE500] text-[#3C1E1E]">
                          {msg.senderRole}
                        </span>
                      )}
                    </div>

                    <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isMe
                            ? "bg-[#FEE500] text-[#3C1E1E] font-medium rounded-tr-xs"
                            : "bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 rounded-tl-xs"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{msg.timestamp}</span>
                    </div>

                    {/* Reactions */}
                    {msg.reactions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {msg.reactions.map((r) => {
                          const reacted = r.users.includes(currentUser.id);
                          return (
                            <button
                              key={r.emoji}
                              onClick={() => toggleReaction(msg.id, r.emoji)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border transition ${
                                reacted
                                  ? "bg-[#5865F2] text-white border-[#5865F2]"
                                  : "bg-white dark:bg-[#2b2d31] border-slate-200 dark:border-white/10"
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white dark:bg-[#313338] border-t border-slate-200 dark:border-white/10">
          <div className="flex items-end gap-2 bg-slate-100 dark:bg-[#383a40] rounded-2xl px-3.5 py-2 border border-slate-200/80 dark:border-white/5 focus-within:ring-2 focus-within:ring-[#5865F2]">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`#${activeChannel?.name} 채널에 실시간 메시지 전송... (Enter)`}
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

      {/* 3. Right Members Sidebar */}
      {showMembersSidebar && (
        <aside className="w-64 flex flex-col bg-slate-100 dark:bg-[#2b2d31] border-l border-slate-200 dark:border-white/10 p-4 overflow-y-auto flex-shrink-0">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>대화 참여자 ({activeParticipants.length || 1})</span>
            <button onClick={() => setShowMembersSidebar(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {/* Current user */}
            <div className="p-2 rounded-xl bg-white dark:bg-[#1e1f22] flex items-center gap-2.5">
              <img src={currentUser.avatarUrl} alt="" className="w-8 h-8 rounded-xl object-cover bg-slate-700" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="font-bold text-xs truncate">{currentUser.name}</p>
                  <span className="text-[9px] font-extrabold bg-[#5865F2] text-white px-1 rounded">나</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.pronouns}</p>
              </div>
            </div>

            {/* Other participants */}
            {activeParticipants
              .filter((p) => p.id !== currentUser.id)
              .map((p) => (
                <div key={p.id} className="p-2 rounded-xl hover:bg-white dark:hover:bg-[#1e1f22] flex items-center gap-2.5 transition">
                  <img src={p.avatar} alt="" className="w-8 h-8 rounded-xl object-cover bg-slate-700" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{p.pronouns}</p>
                  </div>
                </div>
              ))}
          </div>
        </aside>
      )}

      {/* Inspect User Modal */}
      {inspectedUser && (
        <div
          onClick={() => setInspectedUser(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl overflow-hidden bg-white dark:bg-[#1e1f22] p-5 space-y-3 shadow-2xl border border-slate-200 dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <img src={inspectedUser.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover bg-slate-700" />
              <button onClick={() => setInspectedUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h4 className="font-extrabold text-base">{inspectedUser.name}</h4>
              <p className="text-xs text-[#5865F2] dark:text-indigo-300">{inspectedUser.pronouns}</p>
              {inspectedUser.role && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEE500] text-[#3C1E1E]">
                  {inspectedUser.role}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
