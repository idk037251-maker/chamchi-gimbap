"use client";

import React, { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { AVATAR_PRESETS, BANNER_PRESETS, PRONOUN_PRESETS } from "@/data/mockData";
import {
  User,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  MessageSquareHeart,
  Upload,
  Camera,
  Image as ImageIcon,
  Check,
  ShieldAlert,
} from "lucide-react";

export default function AuthOnboarding() {
  const {
    registerSiteAccount,
    loginSiteAccount,
    theme,
    toggleTheme,
    uploadAvatarOrBannerFile,
  } = useApp();

  const [tab, setTab] = useState<"signup" | "login">("signup");

  // Sign up fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pronounPreset, setPronounPreset] = useState(PRONOUN_PRESETS[0]);
  const [pronounText, setPronounText] = useState(PRONOUN_PRESETS[0]);
  const [bio, setBio] = useState("반갑습니다! 커뮤니티에서 활발히 소통해요 ✨");
  const [statusMessage, setStatusMessage] = useState("온라인");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedBanner, setSelectedBanner] = useState(BANNER_PRESETS[0].gradient);
  const [bannerUrl, setBannerUrl] = useState("");

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handlePronounPresetChange = (preset: string) => {
    setPronounPreset(preset);
    if (preset !== "직접 입력") {
      setPronounText(preset);
    } else {
      setPronounText("");
    }
  };

  // Local file upload for avatar
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const url = await uploadAvatarOrBannerFile("avatars", file);
      setSelectedAvatar(url);
    } catch (err: any) {
      setError("프로필 사진 업로드 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Local file upload for banner
  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const url = await uploadAvatarOrBannerFile("banners", file);
      setBannerUrl(url);
    } catch (err: any) {
      setError("배경 사진 업로드 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit sign up
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("아이디를 입력해 주세요.");
      return;
    }
    if (!password || password.length < 4) {
      setError("비밀번호는 4자 이상 입력해 주세요.");
      return;
    }
    if (!name.trim()) {
      setError("이름(닉네임)을 입력해 주세요.");
      return;
    }
    if (!pronounText.trim()) {
      setError("대명사(Pronouns)를 직접 입력해 주세요.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await registerSiteAccount({
        username: username.trim(),
        password,
        name: name.trim(),
        pronouns: pronounText.trim(),
        avatarUrl: selectedAvatar,
        bannerUrl: bannerUrl.trim(),
        bannerColor: selectedBanner,
        bio: bio.trim() || "반갑습니다!",
        statusMessage: statusMessage.trim() || "온라인",
      });

      if (!res.success) {
        setError(res.error || "계정 생성에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginUsername.trim()) {
      setError("아이디를 입력해 주세요.");
      return;
    }
    if (!loginPassword) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await loginSiteAccount(loginUsername.trim(), loginPassword);
      if (!res.success) {
        setError(res.error || "로그인에 실패했습니다.");
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white/90 dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-sm"
          aria-label="테마 전환"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      {/* Left panel: Live Profile Preview & Branding */}
      <div className="lg:w-5/12 bg-gradient-to-br from-[#5865F2] via-[#3b429f] to-[#1e1f22] p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">🍙 참치김밥 커뮤니티</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-4">
            맛있고 즐거운 소통,
            <br />
            <span className="text-[#FEE500]">참치김밥</span>에 오신 것을 환영해요.
          </h1>
          <p className="text-sm text-indigo-100/90 leading-relaxed max-w-md">
            외부 이메일이나 소셜 연동 없이, <strong>오직 참치김밥만을 위한 나만의 독립 계정</strong>을 만들어 커뮤니티에 입장하세요.
          </p>
        </div>

        {/* Live Profile Card Preview */}
        <div className="relative z-10 my-8 max-w-sm w-full">
          <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>✨ 실시간 프로필 미리보기</span>
          </div>
          <div className="rounded-3xl overflow-hidden bg-[#2b2d31]/95 border border-white/15 shadow-2xl backdrop-blur-lg">
            <div
              className="h-24 w-full relative bg-cover bg-center transition-all duration-300"
              style={{
                background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : selectedBanner,
              }}
            />
            <div className="px-5 pb-5 pt-0 relative">
              <div className="relative -mt-10 mb-3 inline-block">
                <img
                  src={selectedAvatar}
                  alt="Preview"
                  className="w-18 h-18 rounded-2xl border-4 border-[#2b2d31] bg-slate-800 object-cover shadow-lg"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#23a55a] border-2 border-[#2b2d31]" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  {name.trim() || username.trim() || "내 이름"}
                </h3>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#5865F2]/40 text-indigo-200 border border-indigo-400/30">
                  {pronounText.trim() || "대명사"}
                </span>
                {username && (
                  <span className="text-xs text-slate-400">@{username.trim()}</span>
                )}
              </div>
              <p className="text-xs text-[#FEE500] font-medium mt-1">💬 {statusMessage || "상태 메시지"}</p>
              <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 bg-[#1e1f22]/80 p-3 rounded-xl border border-white/5">
                {bio || "한 줄 소개글이 여기에 표시됩니다."}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200/90 border-t border-white/10 pt-4 flex flex-col gap-1">
          <p>✓ 외부 이메일 연동 없는 순수 사이트 전용 독립 계정</p>
          <p>✓ 내가 개설한 커뮤니티와 대화는 데이터베이스에 영구 보존</p>
        </div>
      </div>

      {/* Right panel: Tabbed Auth Forms */}
      <div className="lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto max-h-screen">
        <div className="w-full max-w-lg bg-white dark:bg-[#2b2d31] rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#5865F2] flex items-center justify-center text-white shadow-md">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {tab === "signup" ? "새 계정 만들기" : "계정 로그인"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tab === "signup"
                    ? "아이디와 이름을 설정하고 커뮤니티에 입장하세요."
                    : "기존에 만든 아이디로 로그인합니다."}
                </p>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex bg-slate-100 dark:bg-[#1e1f22] p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setError("");
                }}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  tab === "signup"
                    ? "bg-[#5865F2] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                계정 만들기
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setError("");
                }}
                className={`px-3.5 py-1.5 rounded-xl transition ${
                  tab === "login"
                    ? "bg-[#5865F2] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                로그인
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Sign up Form */}
          {tab === "signup" ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {/* Credentials Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 space-y-3.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  1. 사이트 전용 로그인 정보
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    아이디 (ID) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="로그인에 사용할 아이디"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    비밀번호 (Password) <span className="text-rose-500">* (4자 이상)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Identity Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 space-y-3.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  2. 커뮤니티 노출 정보
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    이름 / 닉네임 (Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="채팅방에서 불릴 이름"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>

                {/* Direct Pronoun Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    대명사 (Pronouns) <span className="text-rose-500">* 직접 타이핑 입력</span>
                  </label>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {PRONOUN_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePronounPresetChange(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                          pronounPreset === preset
                            ? "bg-[#5865F2] text-white border-[#5865F2]"
                            : "bg-white dark:bg-[#2b2d31] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10"
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
                    placeholder="원하는 대명사/호칭을 자유롭게 직접 입력하세요 (예: 그/그의, they/them, 자유)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>
              </div>

              {/* Profile Customization Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 space-y-3.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  3. 프로필 사진 & 배경 꾸미기
                </span>

                {/* Avatar Selection & Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      프로필 사진
                    </label>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="text-xs text-[#5865F2] hover:underline font-bold flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      내 기기에서 사진 업로드
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_PRESETS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`relative rounded-xl overflow-hidden border-2 transition aspect-square ${
                          selectedAvatar === av ? "border-[#5865F2] scale-105" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                        {selectedAvatar === av && (
                          <div className="absolute inset-0 bg-[#5865F2]/40 flex items-center justify-center text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Selection & Upload */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      배경 사진 / 배너
                    </label>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="text-xs text-[#5865F2] hover:underline font-bold flex items-center gap-1"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      내 기기에서 배경 업로드
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {BANNER_PRESETS.map((bp) => (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => {
                          setSelectedBanner(bp.gradient);
                          setBannerUrl("");
                        }}
                        className={`h-7 rounded-lg border-2 transition ${
                          selectedBanner === bp.gradient && !bannerUrl
                            ? "border-white ring-2 ring-[#5865F2]"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        style={{ background: bp.gradient }}
                        title={bp.label}
                      />
                    ))}
                  </div>
                </div>

                {/* BIO */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    한 줄 소개 (BIO)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="커뮤니티 멤버들에게 전할 소개글"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>

                {/* Status Message */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    상태 메시지
                  </label>
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="예: 온라인, 즐거운 주말 ✨"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? "계정 생성 중..." : "🚀 계정 만들고 커뮤니티 입장하기"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  이미 가입한 계정이 있으신가요?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("login");
                      setError("");
                    }}
                    className="text-[#5865F2] font-bold hover:underline ml-1"
                  >
                    기존 계정으로 로그인하기
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Tab 2: Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    아이디 (ID) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="가입했던 아이디 입력"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    비밀번호 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-5 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2"
              >
                <span>{isLoading ? "로그인 중..." : "로그인하고 입장하기"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  아직 계정이 없으신가요?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("signup");
                      setError("");
                    }}
                    className="text-[#5865F2] font-bold hover:underline"
                  >
                    새 계정 만들기
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
