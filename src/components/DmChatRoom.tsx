"use client";

import React, { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { isSuperAdmin } from "@/types/chat";
import { compressImage } from "@/lib/imageUtils";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Smile,
  X,
  Loader2,
  Info,
} from "lucide-react";

const EMOJIS = [
  "🍙", "🍱", "🍣", "🍜", "🍚", "🍤",
  "😀", "😂", "🤣", "🥰", "😍", "😎",
  "🤔", "🥳", "😭", "😱", "🥺", "😴",
  "👍", "👏", "🙌", "❤️", "💖", "🔥",
  "✨", "🎉", "💯", "🚀", "🍀", "💡",
  "☕", "🎮", "🌟", "🌈", "🍕", "🍔",
];

export default function DmChatRoom() {
  const {
    currentUser,
    activeDmUser,
    closeDm,
    dmMessages,
    sendDmMessage,
    setInspectedUser,
  } = useApp();

  const [inputText, setInputText] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dmMessages]);

  if (!currentUser || !activeDmUser) return null;

  const isAdmin = isSuperAdmin(activeDmUser);

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

    await sendDmMessage(textToSend, imgToSend || undefined);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#313338] overflow-hidden">
      {/* DM Header */}
      <header className="h-14 px-4 sm:px-6 bg-white dark:bg-[#2b2d31] border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-shrink-0 z-10 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={closeDm}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] hover:bg-slate-200 dark:hover:bg-[#35373c] text-slate-700 dark:text-slate-200 transition"
            title="대화방 나가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setInspectedUser(activeDmUser)}
            className="flex items-center gap-2.5 text-left hover:opacity-90 transition min-w-0"
          >
            <div className="relative flex-shrink-0">
              <img
                src={activeDmUser.avatarUrl}
                alt={activeDmUser.name}
                className="w-9 h-9 rounded-xl object-cover bg-slate-700 border border-black/10 dark:border-white/10"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#23a55a] border-2 border-white dark:border-[#2b2d31]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm truncate text-slate-900 dark:text-white">
                  {activeDmUser.name}
                </span>
                {activeDmUser.pronouns && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300">
                    {activeDmUser.pronouns}
                  </span>
                )}
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
                    👑 최고 관리자
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {activeDmUser.statusMessage || "1:1 비밀 대화 중"}
              </p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setInspectedUser(activeDmUser)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] hover:bg-slate-200 dark:hover:bg-[#35373c] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200/80 dark:border-white/10 transition"
        >
          <Info className="w-3.5 h-3.5 text-[#5865F2]" />
          <span className="hidden sm:inline">프로필 보기</span>
        </button>
      </header>

      {/* DM Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {dmMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
            <span className="text-4xl">💌</span>
            <p className="font-bold text-sm">
              {activeDmUser.name} 님과의 첫 1:1 대화입니다.
            </p>
            <p className="text-xs">
              인사를 건네거나 사진을 공유하며 소통해 보세요!
            </p>
          </div>
        ) : (
          dmMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            // KakaoTalk unread '1' badge:
            // If I sent the message, and recipient has not read it yet -> unread = 1
            const isUnreadByRecipient = isMe && !msg.readUserIds.includes(activeDmUser.id);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => setInspectedUser(activeDmUser)}
                    className="flex-shrink-0"
                  >
                    <img
                      src={msg.senderAvatar || activeDmUser.avatarUrl}
                      alt=""
                      className="w-9 h-9 rounded-2xl bg-slate-700 object-cover shadow-xs border border-black/10 dark:border-white/10"
                    />
                  </button>
                )}

                <div className={`flex flex-col max-w-[78%] sm:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-xs">{msg.senderName}</span>
                      {msg.senderPronouns && (
                        <span className="text-[10px] text-slate-400">
                          ({msg.senderPronouns})
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`flex items-end gap-1.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isMe
                          ? "bg-[#FEE500] text-[#3C1E1E] font-medium rounded-tr-xs shadow-xs"
                          : "bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 rounded-tl-xs shadow-xs"
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
                        </div>
                      )}
                    </div>

                    {/* KakaoTalk Unread '1' & Timestamp */}
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} text-[10px] flex-shrink-0`}>
                      {isUnreadByRecipient && (
                        <span className="text-[#f59e0b] dark:text-[#FEE500] font-black text-[11px] leading-tight">
                          1
                        </span>
                      )}
                      <span className="text-slate-400">{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* DM Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 bg-white dark:bg-[#2b2d31] border-t border-slate-200 dark:border-white/10 relative"
      >
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full mb-3 left-4 sm:left-6 z-40 p-3 bg-white dark:bg-[#1e1f22] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 w-72 animate-in fade-in duration-150"
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
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2b2d31] flex items-center justify-center transition hover:scale-125"
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
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1e1f22] hover:bg-slate-200 dark:hover:bg-[#35373c] text-slate-600 dark:text-slate-300 transition"
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
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-[#1e1f22] hover:bg-slate-200 dark:hover:bg-[#35373c] text-slate-600 dark:text-slate-300 transition"
            title="이모티콘 선택"
          >
            <Smile className="w-4 h-4 text-amber-500" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${activeDmUser.name} 님에게 1:1 메시지 보내기...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1e1f22] border-0 text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#5865F2]"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !pendingImage}
            className="p-2.5 rounded-2xl bg-[#FEE500] hover:bg-[#fdd835] disabled:opacity-40 text-[#3C1E1E] transition shadow-xs flex-shrink-0"
            title="메시지 전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

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
