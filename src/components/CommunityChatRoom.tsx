"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { compressImage } from "@/lib/imageUtils";
import { isSuperAdmin } from "@/types/chat";
import {
  Megaphone,
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
    deleteChatMessage,
    claimCommunityOwnership,
    markCommunityMessagesRead,
    recordCommunityRead,
    inspectUser,
    deleteCommunity,
    kickMember,
    currentUser,
  } = useApp();

  const [inputText, setInputText] = useState("");
  const [showRulesPanel, setShowRulesPanel] = useState(true);
  const [showMembersSidebar, setShowMembersSidebar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [kickTarget, setKickTarget] = useState<{ userId: string; name: string } | null>(null);
  const [isKicking, setIsKicking] = useState(false);

  // Media & Emoji states
  const [pendingImage, setPendingImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const community = (communities || []).find((c) => c.id === activeCommunityId);
  const activeChannel =
    (community?.channels || []).find((ch) => ch.id === activeChannelId) ||
    (community?.channels || [])[0];

  const isOwner =
    !!currentUser &&
    !!community &&
    (community.createdById === currentUser.id ||
      community.createdBy === currentUser.name ||
      (!!currentUser.username && community.createdBy === currentUser.username));

  const iAmAdmin = isSuperAdmin(currentUser);

  // User join timestamp filter (hide messages prior to joining)
  const myMemberRecord = (community?.members || []).find((m) => m?.userId === currentUser?.id);
  const storedJoinTime = typeof window !== "undefined" && community && currentUser
    ? localStorage.getItem(`chamchi_join_${community.id}_${currentUser.id}`)
    : null;
  const myJoinedAtIso = (isOwner || iAmAdmin) ? null : (myMemberRecord?.joinedAt || storedJoinTime);

  const roomMessages = (messages || []).filter((m) => {
    if (!m) return false;
    if (m.communityId !== activeCommunityId) return false;
    if (m.channelId !== (activeChannel?.id || "general")) return false;

    // Room owner and super admin see all past and present messages
    if (isOwner || iAmAdmin) return true;

    // For other members, hide messages created before join time
    if (myJoinedAtIso) {
      let msgTimeMs = 0;
      if (m.createdAt) {
        msgTimeMs = new Date(m.createdAt).getTime();
      } else if (m.id && m.id.startsWith("msg-")) {
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

  // Auto mark messages as read
  useEffect(() => {
    if (!currentUser || !activeCommunityId) return;
    if (roomMessages.length > 0) {
      const unreadIds = roomMessages
        .filter((m) => !(m.readUserIds || [m.senderId]).includes(currentUser.id))
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markCommunityMessagesRead(activeCommunityId, unreadIds);
      }
    }
    recordCommunityRead(activeCommunityId);
  }, [currentUser?.id, activeCommunityId, roomMessages, markCommunityMessagesRead, recordCommunityRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages.length, activeCommunityId, activeChannelId]);

  if (!currentUser) return null;

  if (!community) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-[#313338] text-slate-500">
        <p className="font-bold text-base mb-2">커뮤니티를 찾을 수 없습니다.</p>
        <button
          onClick={() => setActiveCommunityId(null)}
          className="px-4 py-2 rounded-xl bg-[#5865F2] text-white text-xs font-bold"
        >
          로비로 돌아가기
        </button>
      </div>
    );
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("이미지 크기는 15MB 이하여야 합니다.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      setPendingImage(compressed);
    } catch {
      alert("이미지 압축 처리에 실패했습니다.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !pendingImage) return;

    const textToSend = inputText;
    const imgToSend = pendingImage;
    setInputText("");
    setPendingImage("");

    await sendMessage(textToSend, imgToSend || undefined);
  };

  const handleConfirmDelete = async () => {
    if (!community || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteCommunity(community.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleConfirmKick = async () => {
    if (!community || !kickTarget || isKicking) return;
    setIsKicking(true);
    try {
      await kickMember(community.id, kickTarget.userId, kickTarget.name);
      setKickTarget(null);
    } finally {
      setIsKicking(false);
    }
  };

  const handleClaimOwnership = async () => {
    if (!community || !iAmAdmin || isClaiming) return;
    if (
      !confirm(
        "👑 최고 관리자 권한으로 이 커뮤니티의 방장 권한을 회수하시겠습니까?\n회수 시 귀하가 즉시 방장으로 임명되며, 채팅방에 공식 시스템 공지가 등록됩니다."
      )
    ) {
      return;
    }
    setIsClaiming(true);
    try {
      const ok = await claimCommunityOwnership(community.id);
      if (ok) {
        alert("👑 방장 권한을 성공적으로 회수하였습니다!");
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const displayMembers = community.members && community.members.length > 0
    ? community.members
    : [
        {
          userId: community.createdById || "owner-1",
          username: community.createdBy,
          name: community.createdBy,
          pronouns: "방장",
          avatarUrl: "",
          role: "방장" as const,
          joinedAt: community.createdAt,
        },
      ];

  return (
    <div className="flex-1 flex h-full overflow-hidden text-slate-800 dark:text-slate-100">
      {/* 1. Left Channel Sidebar (Discord style) */}
      <div className="w-60 hidden lg:flex flex-col bg-slate-100 dark:bg-[#2b2d31] border-r border-slate-200 dark:border-white/10 flex-shrink-0">
        {/* Community Title Banner */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl flex-shrink-0">{community.iconEmoji}</span>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm truncate text-slate-900 dark:text-white">
                {community.name}
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold truncate">
                방장: {community.createdBy}
              </p>
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center justify-between">
              <span>대화 채널</span>
            </div>
            <div className="space-y-0.5">
              {(community.channels || []).map((ch) => {
                const isActive = activeChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      isActive
                        ? "bg-[#5865F2] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-[#35373c]"
                    }`}
                  >
                    <span className="text-sm">#</span>
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
            {/* Super Admin Ownership Claim Button */}
            {iAmAdmin && !isOwner && (
              <button
                type="button"
                onClick={handleClaimOwnership}
                disabled={isClaiming}
                className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 transition shadow-xs"
                title="최고 관리자 전용: 방장 권한을 즉시 회수하여 내 계정으로 이전합니다."
              >
                {isClaiming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crown className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">방장 권한 회수 (방장 뺏기)</span>
                <span className="sm:hidden">방장 뺏기</span>
              </button>
            )}

            <button
              onClick={() => setShowRulesPanel((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                showRulesPanel
                  ? "bg-[#FEE500] text-[#3C1E1E] border-[#FEE500]"
                  : "bg-slate-100 dark:bg-[#2b2d31] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">규칙 및 상세 정보</span>
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

            {/* Owner or Super Admin Delete Community Button */}
            {(isOwner || iAmAdmin) && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition shadow-xs"
                title={iAmAdmin && !isOwner ? "최고 관리자 전용: 부적절한 커뮤니티 강제 삭제" : "방장 전용: 커뮤니티와 모든 대화 내용을 영구 삭제합니다."}
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
                  {(community.rules || []).map((rule, idx) => (
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
              const isSenderAdmin =
                msg.senderRole === "관리자" ||
                (msg.senderName || "").trim().toLowerCase() === "참치김밥";

              // KakaoTalk Unread Count
              const readUsers = msg.readUserIds || [msg.senderId];
              const unreadCount = Math.max(
                0,
                displayMembers.filter((m) => !readUsers.includes(m.userId)).length
              );

              const canDeleteMsg = isMe || isOwner || iAmAdmin;

              return (
                <div
                  key={msg.id}
                  className={`group flex items-start gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                >
                  <button
                    type="button"
                    onClick={() => inspectUser(msg.senderId)}
                    title="프로필 보기"
                    className="flex-shrink-0"
                  >
                    <img
                      src={msg.senderAvatar}
                      alt=""
                      className="w-10 h-10 rounded-2xl bg-slate-700 object-cover shadow-xs border border-black/10 dark:border-white/10 hover:opacity-90 transition"
                    />
                  </button>

                  <div className={`flex flex-col max-w-[78%] sm:max-w-[68%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-1.5 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      <button
                        type="button"
                        onClick={() => inspectUser(msg.senderId)}
                        className="font-bold text-xs hover:underline text-left"
                      >
                        {msg.senderName}
                      </button>

                      {msg.senderPronouns && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300">
                          {msg.senderPronouns}
                        </span>
                      )}

                      {/* Super Admin Badge */}
                      {isSenderAdmin ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs flex items-center gap-1">
                          👑 최고 관리자
                        </span>
                      ) : (
                        msg.senderRole && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FEE500] text-[#3C1E1E]">
                            {msg.senderRole}
                          </span>
                        )
                      )}

                      {/* Delete Message button for Author, Owner, or Admin */}
                      {canDeleteMsg && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("이 메시지를 삭제하시겠습니까?")) {
                              deleteChatMessage(community.id, msg.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                          title={iAmAdmin && !isMe ? "최고 관리자 권한으로 삭제" : "메시지 삭제"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
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

                      {/* KakaoTalk Unread Count & Timestamp */}
                      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} text-[10px] flex-shrink-0`}>
                        {unreadCount > 0 && (
                          <span className="text-[#f59e0b] dark:text-[#FEE500] font-black text-[11px] leading-tight">
                            {unreadCount}
                          </span>
                        )}
                        <span className="text-slate-400">{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Reactions */}
                    {(msg.reactions || []).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {(msg.reactions || []).map((r) => {
                          const reacted = (r.users || []).includes(currentUser.id);
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
                              <span>{(r.users || []).length}</span>
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
              <div className="grid grid-cols-6 gap-1.5 text-xl max-h-48 overflow-y-auto p-1">
                {EMOJIS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e1f22] flex items-center justify-center transition hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pending Image Preview */}
          {pendingImage && (
            <div className="mb-2 relative inline-block">
              <img
                src={pendingImage}
                alt="첨부 사진 미리보기"
                className="h-20 w-20 rounded-2xl object-cover border-2 border-[#5865F2] shadow-md"
              />
              <button
                type="button"
                onClick={() => setPendingImage("")}
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition"
                title="첨부 취소"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#2b2d31] hover:bg-slate-200 dark:hover:bg-[#35373c] text-slate-600 dark:text-slate-300 transition"
              title="사진 첨부하기"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#5865F2]" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#23a55a]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#2b2d31] hover:bg-slate-200 dark:hover:bg-[#35373c] text-slate-600 dark:text-slate-300 transition"
              title="이모티콘 선택"
            >
              <Smile className="w-4 h-4 text-amber-500" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`#${activeChannel?.name || "대화방"}에 메시지 보내기...`}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#2b2d31] border-0 text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#5865F2]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !pendingImage}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition ${
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
              const isMemberAdmin =
                member.role === "방장" &&
                (member.name.trim().toLowerCase() === "참치김밥" ||
                  (member.username && member.username.trim().toLowerCase() === "참치김밥"));

              return (
                <div
                  key={member.userId}
                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 transition ${
                    isMe
                      ? "bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 shadow-xs"
                      : "hover:bg-white dark:hover:bg-[#1e1f22] border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => inspectUser(member.userId)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
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
                        {isMemberAdmin ? (
                          <span className="text-[9px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            👑 최고 관리자
                          </span>
                        ) : (
                          isMemberOwner && (
                            <span className="text-[9px] font-extrabold bg-[#FEE500] text-[#3C1E1E] px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                              <Crown className="w-2.5 h-2.5" />
                              방장
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{member.pronouns}</p>
                    </div>
                  </button>

                  {/* Owner or Super Admin kick button */}
                  {(isOwner || iAmAdmin) && !isMe && !isMemberOwner && (
                    <button
                      type="button"
                      onClick={() => setKickTarget({ userId: member.userId, name: member.name })}
                      className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/20 text-[11px] font-bold flex items-center gap-1 transition shrink-0"
                      title={iAmAdmin && !isOwner ? "최고 관리자 전용 강퇴" : "방장 전용: 해당 사용자를 커뮤니티에서 내보냅니다."}
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

      {/* Delete Confirmation Modal */}
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
                  {iAmAdmin && !isOwner ? "👑 최고 관리자 권한" : `방장(${currentUser.name}) 전용 관리 기능`}
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
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>삭제 진행 중...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>영구 삭제</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Kick Confirmation Modal */}
      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-[#2b2d31] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                <UserX className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  멤버 강제 퇴장(강퇴)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {kickTarget.name} 님을 내보냅니다.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              강퇴된 사용자는 즉시 채팅방에서 튕겨 나가며, 다시는 이 커뮤니티에 입장할 수 없도록 영구 차단됩니다.
            </p>

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
                onClick={handleConfirmKick}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
              >
                {isKicking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>내보내는 중...</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>강퇴 실행</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="확대 이미지"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
