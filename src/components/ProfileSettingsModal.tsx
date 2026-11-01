"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { AVATAR_PRESETS, BANNER_PRESETS, PRONOUN_PRESETS } from "@/data/mockData";
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
  Lock,
  KeyRound,
  AlertCircle,
} from "lucide-react";

export default function ProfileSettingsModal() {
  const {
    currentUser,
    updateProfile,
    changePassword,
    uploadAvatarOrBannerFile,
    isCloudConnected,
    isProfileModalOpen,
    setIsProfileModalOpen,
  } = useApp();

  const [name, setName] = useState("");
  const [pronounPreset, setPronounPreset] = useState(PRONOUN_PRESETS[0]);
  const [pronounText, setPronounText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerColor, setBannerColor] = useState("");
  const [bio, setBio] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [status, setStatus] = useState<UserStatus>("online");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [isChangingPw, setIsChangingPw] = useState(false);

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser && isProfileModalOpen) {
      setName(currentUser.name);
      setPronounText(currentUser.pronouns);
      if (PRONOUN_PRESETS.includes(currentUser.pronouns)) {
        setPronounPreset(currentUser.pronouns);
      } else {
        setPronounPreset("직접 입력");
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

  const handlePronounPresetChange = (preset: string) => {
    setPronounPreset(preset);
    if (preset !== "직접 입력") {
      setPronounText(preset);
    }
  };

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
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!currentPassword) {
      setPwError("현재 비밀번호를 입력해 주세요.");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setPwError("새 비밀번호는 4자 이상 입력해 주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("새 비밀번호와 확인 입력이 일치하지 않습니다.");
      return;
    }

    try {
      setIsChangingPw(true);
      const res = await changePassword(currentPassword, newPassword);
      if (!res.success) {
        setPwError(res.error || "비밀번호 변경에 실패했습니다.");
      } else {
        setPwSuccess("비밀번호가 성공적으로 변경되었습니다!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPwError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    try {
      setIsSaving(true);
      await updateProfile({
        name: name.trim(),
        pronouns: pronounText.trim() || currentUser.pronouns,
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
      }, 700);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#1e1f22]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base">프로필 & 대명사 설정</h2>
                {isCloudConnected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                    클라우드 저장됨
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                사진, 배경, 이름, 대명사(Pronouns 직접 입력), 소개글을 자유롭게 수정하세요.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#35373c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preview Card */}
          <div className="rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 shadow-inner">
            <div
              className="h-28 w-full relative bg-cover bg-center group"
              style={{
                background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : bannerColor,
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
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  배경 사진 업로드
                </button>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl("")}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold backdrop-blur-md"
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
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 mb-0.5" />}
                    사진 변경
                  </button>
                </div>

                {/* Status Selector */}
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
                        status === st.id ? "bg-[#5865F2] text-white" : "text-slate-400"
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
                  {pronounText.trim() || "대명사"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE500]/20 text-amber-800 dark:text-[#FEE500]">
                  💬 {statusMessage || "상태 메시지"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{bio}</p>
            </div>
          </div>

          {/* 1. Name & Pronouns (Direct Input) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                대명사 (Pronouns 직접 입력) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                {PRONOUN_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePronounPresetChange(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      pronounPreset === preset
                        ? "bg-[#5865F2] text-white border-[#5865F2]"
                        : "bg-slate-100 dark:bg-[#1e1f22] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={pronounText}
                onChange={(e) => setPronounText(e.target.value)}
                placeholder="직접 대명사/호칭을 자유롭게 입력하세요 (예: 그/그의, 그녀/그녀의, they/them)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>
          </div>

          {/* 2. Photo Upload & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                프로필 아바타 (기기 업로드 / 프리셋)
              </label>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="text-xs font-semibold text-[#5865F2] hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />내 기기에서 사진 업로드
              </button>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`rounded-2xl p-0.5 transition flex-shrink-0 ${
                    avatarUrl === preset ? "ring-2 ring-[#5865F2] scale-105" : "opacity-70"
                  }`}
                >
                  <img src={preset} alt="" className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#1e1f22]" />
                </button>
              ))}
            </div>
          </div>

          {/* 3. Banner Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              배경 배너 색상 프리셋
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
                  className={`h-10 rounded-xl px-3 flex items-center justify-between text-xs font-bold text-white shadow-xs ${
                    !bannerUrl && bannerColor === b.gradient ? "ring-2 ring-offset-1 ring-[#5865F2]" : "opacity-80"
                  }`}
                  style={{ background: b.gradient }}
                >
                  <span className="truncate">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status & BIO */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                상태 메시지
              </label>
              <input
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="예: 오늘도 화이팅!"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                소개글 (BIO)
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="나를 소개하는 글을 작성해 주세요."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
              />
            </div>
          </div>

          {/* Password Change Section */}
          <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  비밀번호 변경
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  현재 비밀번호를 검증한 후 안전하게 새 비밀번호로 갱신합니다.
                </p>
              </div>
            </div>

            {pwError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  현재 비밀번호
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="기존 비밀번호 입력"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    새 비밀번호 (4자 이상)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="새 비밀번호 입력"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    새 비밀번호 확인
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="새 비밀번호 재입력"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={isChangingPw || !currentPassword || !newPassword}
                onClick={handleChangePassword}
                className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                {isChangingPw ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>변경 중...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>비밀번호 변경하기</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
            {savedToast && (
              <span className="text-xs font-bold text-[#23a55a] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                저장 완료!
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? "저장 중..." : "변경사항 저장"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
