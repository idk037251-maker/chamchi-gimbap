"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { compressImage } from "@/lib/imageUtils";
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
  Loader2,
  Trash2,
  AlertTriangle,
  UserX,
  Crown,
  Image as ImageIcon,
  Smile,
  Download,
} from "lucide-react";

const EMOJIS = [
  "🍙", "🍱", "🍣", "🍜", "🍚", "🍤",
  "😀", "😂", "🤣", "🥰", "😍", "😎",
  "🤔", "🥳", "😭", "😱", "🥺", "😴",
  "👍", "👏", "🙌", "❤️", "💖", "🔥",
  "✨", "🎉", "💯", "🚀", "🍀", "💡",
  "☕", "🎮", "🌟", "🌈", "🍕", "🍔",
];

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
    deleteCommunity,
    kickMember,
    currentUser,
  } = useApp();

  const [inputText, setInputText] = useState("");
  const [showRulesPanel, setShowRulesPanel] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [kickTarget, setKickTarget] = useState<{ userId: string; name: string } | null>(null);
  const [isKicking, setIsKicking] = useState(false);

  // Media & Emoji states
  const [pendingImage, setPendingImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  const isOwner =
    !!currentUser &&
    !!community &&
    (community.createdById === currentUser.id ||
      community.createdBy === currentUser.name ||
      (!!currentUser.username && community.createdBy === currentUser.username));

  // User join timestamp filter (hide messages prior to joining)
  const myMemberRecord = (community?.members || []).find((m) => m.userId === currentUser?.id);
  const storedJoinTime = typeof window !== "undefined" && community && currentUser
    ? localStorage.getItem(`chamchi_join_${community.id}_${currentUser.id}`)
    : null;
  const myJoinedAtIso = isOwner ? null : (myMemberRecord?.joinedAt || storedJoinTime);

  const roomMessages = messages.filter((m) => {
    if (m.communityId !== activeCommunityId) return false;
    if (m.channelId !== (activeChannel?.id || "general")) return false;

    // Room owner sees all past and present messages
    if (isOwner) return true;

    // For other members, hide messages created before join time
    if (myJoinedAtIso) {
      let msgTimeMs = 0;
      if (m.createdAt) {
        msgTimeMs = new Date(m.createdAt).getTime();
      } else if (m.id.startsWith("msg-")) {
        const rawNum = parseInt(m.id.replace("msg-", "").split("-")[0], 10);
        if (!isNaN(rawNum)) msgTimeMs = rawNum;
      }
      const joinTimeMs = new Date(myJoinedAtIso).getTime();
      if (msgTimeMs && msgTimeMs < joinTimeMs - 3000) {
        return false;
      }
    }

    return true;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages.length, activeCommunityId, activeChannelId]);

  if (!currentUser) return null;

  if (!community) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#313338] text-slate-500 dark:text-slate-400 p-8 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#5865F2]" />
        <p className="font-bold text-sm">커뮤니티 채팅방에 연결 중...</p>
        <button
          onClick={() => setActiveCommunityId(null)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-[#1e1f22] text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition"
        >
          로비로 돌아가기
        </button>
      </div>
    );
  }

  // Auto-kick listener for current user
  useEffect(() => {
    if (community && currentUser && (community.kickedUserIds || []).includes(currentUser.id)) {
      alert("커뮤니티 관리자에 의해 이 방에서 내보내졌습니다.");
      setActiveCommunityId(null);
    }
  }, [community, currentUser, setActiveCommunityId]);

  const handleDeleteCommunity = async () => {
    if (!isOwner || isDeleting) return;
    try {
      setIsDeleting(true);
      await deleteCommunity(community.id);
    } catch (err) {
      console.error("Failed to delete community", err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleKickConfirm = async () => {
    if (!kickTarget || !community || !isOwner || isKicking) return;
    try {
      setIsKicking(true);
      await kickMember(community.id, kickTarget.userId, kickTarget.name);
    } catch (err) {
      console.error("Failed to kick member", err);
    } finally {
      setIsKicking(false);
      setKickTarget(null);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      setPendingImage(compressed);
    } catch (err: any) {
      alert("사진 첨부 처리 실패: " + err.message);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingImage) return;
    sendMessage(inputText, pendingImage || undefined);
    setInputText("");
    setPendingImage("");
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputText.trim() || pendingImage) {
        sendMessage(inputText, pendingImage || undefined);
        setInputText("");
        setPendingImage("");
        setShowEmojiPicker(false);
      }
    }
  };

  // Deduplicate and aggregate community members
  const memberMap = new Map<string, { userId: string; username?: string; name: string; pronouns: string; avatarUrl: string; role: string }>();

  // 1. Current user
  if (currentUser) {
    const isMeOwner =
      community.createdById === currentUser.id ||
      community.createdBy === currentUser.name ||
      (!!currentUser.username && community.createdBy === currentUser.username);
    memberMap.set(currentUser.id, {
      userId: currentUser.id,
      username: currentUser.username,
      name: currentUser.name,
      pronouns: currentUser.pronouns,
      avatarUrl: currentUser.avatarUrl,
      role: isMeOwner ? "방장" : "멤버",
    });
  }

  // 2. Stored community members
  (community.members || []).forEach((m) => {
    if (!memberMap.has(m.userId)) {
      const isMemOwner =
        m.userId === community.createdById ||
        m.name === community.createdBy ||
        (!!m.username && m.username === community.createdBy);
      memberMap.set(m.userId, {
        userId: m.userId,
        username: m.username,
        name: m.name,
        pronouns: m.pronouns,
        avatarUrl: m.avatarUrl,
        role: isMemOwner ? "방장" : (m.role || "멤버"),
      });
    }
  });

  // 3. Message participants
  roomMessages.forEach((m) => {
    if (!m.isSystem && m.senderId && !memberMap.has(m.senderId)) {
      const isSenderOwner =
        m.senderId === community.createdById ||
        m.senderName === community.createdBy;
      memberMap.set(m.senderId, {
        userId: m.senderId,
        name: m.senderName,
        pronouns: m.senderPronouns,
        avatarUrl: m.senderAvatar,
        role: isSenderOwner ? "방장" : (m.senderRole || "멤버"),
      });
    }
  });

  // Filter out kicked users
  const kickedSet = new Set(community.kickedUserIds || []);
  const displayMembers = Array.from(memberMap.values()).filter((m) => !kickedSet.has(m.userId));

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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                showMembersSidebar
                  ? "bg-[#5865F2] text-white border-[#5865F2] shadow-xs"
                  : "bg-slate-100 dark:bg-[#2b2d31] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10"
              }`}
              title="참여 멤버 목록"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">멤버</span>
              <span className="text-[11px] font-extrabold px-1.5 py-0.2 bg-black/15 dark:bg-white/15 rounded-full">
                {displayMembers.length}
              </span>
            </button>

            {/* Owner-only Delete Community Button */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition shadow-xs"
                title="방장 전용: 커뮤니티와 모든 대화 내용을 영구 삭제합니다."
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">커뮤니티 삭제</span>
              </button>
            )}
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
                        {msg.content && <div>{msg.content}</div>}
                        {msg.attachmentUrl && (
                          <div className={msg.content ? "mt-2" : ""}>
                            <img
                              src={msg.attachmentUrl}
                              alt="첨부 사진"
                              onClick={() => setLightboxImage(msg.attachmentUrl || null)}
                              className="rounded-xl max-w-[240px] sm:max-w-[320px] max-h-60 object-cover cursor-pointer hover:opacity-90 hover:scale-[1.01] transition border border-black/10 dark:border-white/10 shadow-sm"
                            />
                            <p
                              onClick={() => setLightboxImage(msg.attachmentUrl || null)}
                              className="text-[10px] text-slate-400 mt-1 cursor-pointer hover:underline"
                            >
                              🔍 클릭하여 원본 사진 보기
                            </p>
                          </div>
                        )}
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
        <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white dark:bg-[#313338] border-t border-slate-200 dark:border-white/10 relative">
          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-full mb-3 left-4 sm:left-6 z-40 p-3 bg-white dark:bg-[#2b2d31] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 w-72 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-100">
                <span>🍙 이모티콘 선택</span>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2 text-xl max-h-48 overflow-y-auto p-1">
                {EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition transform hover:scale-125 flex items-center justify-center cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending Image Preview Bar */}
          {pendingImage && (
            <div className="mb-2 p-2.5 bg-slate-100 dark:bg-[#2b2d31] rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between max-w-sm shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <img src={pendingImage} alt="미리보기" className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-white/10" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">첨부된 사진</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ 전송 준비 완료</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingImage("")}
                className="p-1.5 rounded-xl hover:bg-rose-500/15 text-rose-500 transition"
                title="사진 첨부 취소"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden File Input for Image Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          <div className="flex items-end gap-2 bg-slate-100 dark:bg-[#383a40] rounded-2xl px-3 py-2 border border-slate-200/80 dark:border-white/5 focus-within:ring-2 focus-within:ring-[#5865F2]">
            {/* Image Attachment Button */}
            <button
              type="button"
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-[#5865F2] hover:bg-white dark:hover:bg-[#2b2d31] transition shrink-0"
              title="사진 첨부하기"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </button>

            {/* Emoji Picker Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-2 rounded-xl transition shrink-0 ${
                showEmojiPicker
                  ? "bg-[#FEE500] text-[#3C1E1E]"
                  : "text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-[#2b2d31]"
              }`}
              title="이모티콘 선택"
            >
              <Smile className="w-4 h-4" />
            </button>

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
              disabled={!inputText.trim() && !pendingImage}
              className={`px-4 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition ${
                inputText.trim() || pendingImage
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
        <aside className="w-72 flex flex-col bg-slate-100 dark:bg-[#2b2d31] border-l border-slate-200 dark:border-white/10 p-4 overflow-y-auto flex-shrink-0 animate-in slide-in-from-right duration-150">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#5865F2]" />
              참여자 목록 ({displayMembers.length}명)
            </span>
            <button
              onClick={() => setShowMembersSidebar(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {displayMembers.map((member) => {
              const isMe = member.userId === currentUser.id;
              const isMemberOwner = member.role === "방장";

              return (
                <div
                  key={member.userId}
                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 transition ${
                    isMe
                      ? "bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 shadow-xs"
                      : "hover:bg-white dark:hover:bg-[#1e1f22] border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={member.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(member.name)}`}
                      alt={member.name}
                      className="w-8 h-8 rounded-xl object-cover bg-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs truncate text-slate-900 dark:text-slate-100">
                          {member.name}
                        </p>
                        {isMe && (
                          <span className="text-[9px] font-extrabold bg-[#5865F2] text-white px-1.5 py-0.2 rounded-full">
                            나
                          </span>
                        )}
                        {isMemberOwner && (
                          <span className="text-[9px] font-extrabold bg-[#FEE500] text-[#3C1E1E] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                            <Crown className="w-2.5 h-2.5" />
                            방장
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{member.pronouns}</p>
                    </div>
                  </div>

                  {/* Owner-only kick button */}
                  {isOwner && !isMe && !isMemberOwner && (
                    <button
                      type="button"
                      onClick={() => setKickTarget({ userId: member.userId, name: member.name })}
                      className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/20 text-[11px] font-bold flex items-center gap-1 transition shrink-0"
                      title="방장 전용: 해당 사용자를 커뮤니티에서 내보냅니다."
                    >
                      <UserX className="w-3 h-3" />
                      <span>강퇴</span>
                    </button>
                  )}
                </div>
              );
            })}
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

      {/* Full-screen Lightbox Image Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-150"
        >
          <div
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="원본 사진 미리보기"
              className="max-w-full max-h-[82vh] rounded-3xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxImage}
                download="chamchi-chat-image.png"
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>사진 다운로드</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Owner Only) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#2b2d31] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  커뮤니티 영구 삭제
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  방장({currentUser.name}) 전용 관리 기능
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
              ⚠️ <strong>정말 삭제하시겠습니까?</strong>
              <br />
              커뮤니티 정보와 그 안에서 오간 <strong>모든 채팅 내역(대화 데이터)이 영구적으로 사라지며</strong> 복구할 수 없습니다.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteCommunity}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>삭제 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>영구 삭제 승인</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Lightbox Image Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-150"
        >
          <div
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="원본 사진 미리보기"
              className="max-w-full max-h-[82vh] rounded-3xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxImage}
                download="chamchi-chat-image.png"
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>사진 다운로드</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Member Confirmation Modal (Owner Only) */}
      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-[#2b2d31] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <UserX className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  멤버 내보내기 (강퇴)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  방장({currentUser.name}) 전용 커뮤니티 관리 권한
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
              ⚠️ <strong>&quot;{kickTarget.name}&quot;</strong> 사용자를 커뮤니티에서 내보내시겠습니까?
              <br />
              해당 사용자는 <strong>커뮤니티 채팅방에서 즉시 퇴장</strong> 처리되며, 재입장이 차단됩니다.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isKicking}
                onClick={() => setKickTarget(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isKicking}
                onClick={handleKickConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isKicking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>내보내는 중...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-4 h-4" />
                    <span>내보내기 승인</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Lightbox Image Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-zoom-out animate-in fade-in duration-150"
        >
          <div
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage}
              alt="원본 사진 미리보기"
              className="max-w-full max-h-[82vh] rounded-3xl object-contain shadow-2xl border border-white/10"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxImage}
                download="chamchi-chat-image.png"
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>사진 다운로드</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>닫기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
