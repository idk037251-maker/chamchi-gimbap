"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  AVATAR_PRESETS,
  BANNER_PRESETS,
  PRONOUN_OPTIONS,
} from "@/data/mockData";
import { UserStatus } from "@/types/chat";
import {
  X,
  Camera,
  Image as ImageIcon,
  Save,
  Sparkles,
  CheckCircle2,
  Upload,
  Cloud,
  Loader2,
} from "lucide-react";

export default function ProfileSettingsModal() {
  const {
    currentUser,
    updateProfile,
    uploadAvatarOrBannerFile,
    isCloudConnected,
    isProfileModalOpen,
    setIsProfileModalOpen,
  } = useApp();

  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [customPronoun, setCustomPronoun] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerColor, setBannerColor] = useState("");
  const [bio, setBio] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [status, setStatus] = useState<UserStatus>("online");
  const [isUploading, setIsUploading] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && isProfileModalOpen) {
      setName(currentUser.name);
      if (PRONOUN_OPTIONS.includes(currentUser.pronouns)) {
        setPronouns(currentUser.pronouns);
        setCustomPronoun("");
      } else {
        setPronouns("직접 입력");
        setCustomPronoun(currentUser.pronouns);
      }
      setAvatarUrl(currentUser.avatarUrl);
      setBannerUrl(currentUser.bannerUrl || "");
      setBannerColor(currentUser.bannerColor || BANNER_PRESETS[0].gradient);
      setBio(currentUser.bio);
      setStatusMessage(currentUser.statusMessage || "");
      setStatus(currentUser.status || "online");
      setSavedToast(false);
      setIsUploading(false);
    }
  }, [currentUser, isProfileModalOpen]);

  if (!isProfileModalOpen || !currentUser) return null;

  const finalPronoun =
    pronouns === "직접 입력"
      ? customPronoun.trim() || currentUser.pronouns
      : pronouns;

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadAvatarOrBannerFile(
        target === "avatar" ? "avatars" : "banners",
        file
      );
      if (target === "avatar") {
        setAvatarUrl(uploadedUrl);
      } else {
        setBannerUrl(uploadedUrl);
      }
    } catch (err) {
      console.error("Upload error:", err);
      // Fallback local reader
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          if (target === "avatar") setAvatarUrl(reader.result);
          else setBannerUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await updateProfile({
      name: name.trim(),
      pronouns: finalPronoun,
      avatarUrl,
      bannerUrl: bannerUrl.trim(),
      bannerColor,
      bio: bio.trim(),
      statusMessage: statusMessage.trim(),
      status,
    });

    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      setIsProfileModalOpen(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#1e1f22]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base">
                  마이페이지 · 프로필 및 대명사 설정
                </h2>
                {isCloudConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    클라우드 영구 보관 중
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                아바타, 배경 배너, 이름, 대명사(Pronouns), BIO 소개글을 자유롭게 변경하세요.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Live Interactive Preview Banner + Avatar Card */}
          <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 shadow-inner">
            <div
              className="h-28 w-full relative bg-cover bg-center group"
              style={{
                background: bannerUrl
                  ? `url(${bannerUrl}) center/cover no-repeat`
                  : bannerColor,
              }}
            >
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageFileUpload(e, "banner")}
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 transition"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                  배경 사진 업로드
                </button>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl("")}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold backdrop-blur-md transition"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 pb-5 relative">
              <div className="flex flex-wrap items-end justify-between gap-4 -mt-10 mb-3">
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-20 h-20 rounded-2xl border-4 border-slate-100 dark:border-[#1e1f22] bg-slate-800 object-cover shadow-lg"
                  />
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageFileUpload(e, "avatar")}
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 mb-0.5" />
                    )}
                    사진 변경
                  </button>
                </div>

                {/* Online Status Selector */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-[#2b2d31] p-1.5 rounded-xl border border-slate-200 dark:border-white/10">
                  {(
                    [
                      { id: "online", label: "온라인", dot: "bg-[#23a55a]" },
                      { id: "idle", label: "자리비움", dot: "bg-amber-400" },
                      { id: "dnd", label: "방해금지", dot: "bg-rose-500" },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatus(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        status === st.id
                          ? "bg-[#5865F2] text-white"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#35373c]"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold">{name || "이름 없음"}</h3>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#5865F2]/20 text-[#5865F2] dark:text-indigo-300 border border-[#5865F2]/30">
                  {finalPronoun}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE500]/20 text-amber-800 dark:text-[#FEE500]">
                  💬 {statusMessage || "상태 메시지"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {bio}
              </p>
            </div>
          </div>

          {/* Avatar Presets & Custom Image File Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                1. 프로필 아바타 (프리셋 또는 내 PC 사진)
              </label>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="text-xs font-semibold text-[#5865F2] dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                내 기기에서 사진 업로드 (스토리지 저장)
              </button>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`rounded-2xl p-0.5 transition flex-shrink-0 ${
                    avatarUrl === preset
                      ? "ring-2 ring-[#5865F2] scale-105"
                      : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={preset}
                    alt={`프리셋 ${idx + 1}`}
                    className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#1e1f22]"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Banner Presets & Custom URL */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
              2. 배경 사진 (배너 테마 / 커스텀 이미지)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BANNER_PRESETS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBannerUrl("");
                    setBannerColor(b.gradient);
                  }}
                  className={`h-11 rounded-xl px-3 flex items-center justify-between text-xs font-bold text-white shadow-sm transition ${
                    !bannerUrl && bannerColor === b.gradient
                      ? "ring-2 ring-offset-2 ring-[#5865F2] dark:ring-offset-[#2b2d31]"
                      : "opacity-85 hover:opacity-100"
                  }`}
                  style={{ background: b.gradient }}
                >
                  <span className="truncate drop-shadow">{b.label}</span>
                  {!bannerUrl && bannerColor === b.gradient && (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="또는 배경 이미지 URL 직접 입력 (https://...)"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          {/* Name & Pronouns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                이름 (Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1.5">
                대명사 (Pronouns) <span className="text-rose-500">*</span>
              </label>
              <select
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              >
                {PRONOUN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pronouns === "직접 입력" && (
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-300 mb-1">
                직접 대명사 입력
              </label>
              <input
                type="text"
                required
                value={customPronoun}
                onChange={(e) => setCustomPronoun(e.target.value)}
                placeholder="예: 그/그녀/they"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>
          )}

          {/* Status Message & BIO */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                상태 메시지 (한 줄 상태 표시)
              </label>
              <input
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="예: 사이드 프로젝트 불태우는 중 🔥"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1">
                소개글 (BIO)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="나를 소개하는 BIO 메시지를 자유롭게 적어주세요."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
            {savedToast && (
              <span className="text-xs font-bold text-[#23a55a] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                프로필이 성공적으로 저장되었습니다!
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#35373c] transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              변경사항 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
