"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { AVATAR_PRESETS, BANNER_PRESETS, PRONOUN_PRESETS } from "@/data/mockData";
import { UserProfile } from "@/types/chat";
import { supabaseBridge } from "@/lib/supabaseClient";
import { getGoogleClientId, saveGoogleClientId, redirectToGoogleLogin } from "@/lib/googleAuth";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  MessageSquareHeart,
  Database,
  Upload,
  Camera,
  Image as ImageIcon,
} from "lucide-react";

export default function AuthOnboarding() {
  const {
    loginOrRegister,
    theme,
    toggleTheme,
    isCloudConnected,
    setIsCloudConfigModalOpen,
    pendingAuthUser,
    setPendingAuthUser,
    authError,
    loginWithAuthUserId,
    uploadAvatarOrBannerFile,
  } = useApp();

  const [mode, setMode] = useState<"login" | "signup" | "onboarding">("signup");
  const [authProvider, setAuthProvider] = useState<"email" | "google">("google");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [pronounPreset, setPronounPreset] = useState(PRONOUN_PRESETS[0]);
  const [pronounText, setPronounText] = useState(PRONOUN_PRESETS[0]);
  const [bio, setBio] = useState("반갑습니다! 커뮤니티에서 활발히 소통해요 ✨");
  const [statusMessage, setStatusMessage] = useState("온라인");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedBanner, setSelectedBanner] = useState(BANNER_PRESETS[0].gradient);
  const [bannerUrl, setBannerUrl] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickGoogleClientId, setQuickGoogleClientId] = useState("");
  const [showGoogleConfigInline, setShowGoogleConfigInline] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuickGoogleClientId(getGoogleClientId());
  }, []);

  // When Google OAuth finishes, the user lands back here to set name & pronouns
  useEffect(() => {
    if (!pendingAuthUser) return;
    setMode("onboarding");
    setAuthProvider(pendingAuthUser.provider);
    setEmail(pendingAuthUser.email);
    setName(pendingAuthUser.name || "");
    if (pendingAuthUser.avatarUrl) setSelectedAvatar(pendingAuthUser.avatarUrl);
  }, [pendingAuthUser]);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  const handlePronounPresetChange = (preset: string) => {
    setPronounPreset(preset);
    if (preset !== "직접 입력") {
      setPronounText(preset);
    } else {
      setPronounText("");
    }
  };

  // Real Google OAuth login -> redirects directly to accounts.google.com
  const handleGoogleAuth = () => {
    setError("");
    const clientId = (getGoogleClientId() || quickGoogleClientId).trim();

    // 1. Direct Google OAuth 2.0 (redirects directly to accounts.google.com)
    if (clientId) {
      saveGoogleClientId(clientId);
      redirectToGoogleLogin(clientId);
      return;
    }

    // 2. Supabase Google Provider (redirects through Supabase to accounts.google.com)
    if (isCloudConnected) {
      const oauthUrl = supabaseBridge.getGoogleOAuthUrl();
      if (oauthUrl) {
        window.location.href = oauthUrl;
        return;
      }
    }

    // 3. Open inline quick-input without any disruptive popup modal
    setShowGoogleConfigInline(true);
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

  // Email login/signup
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim() || !email.includes("@")) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (isCloudConnected) {
      try {
        setIsLoading(true);
        if (mode === "login") {
          const authData = await supabaseBridge.signInWithPassword(email, password);
          const authUser = authData?.user;
          if (!authUser?.id) throw new Error("로그인 정보를 확인하지 못했습니다.");
          const meta = authUser.user_metadata || {};

          await loginWithAuthUserId({
            id: authUser.id,
            email: authUser.email || email,
            name: meta.name || email.split("@")[0],
            avatarUrl: selectedAvatar,
            provider: "email",
          });
        } else {
          // Signup
          const finalP = pronounText.trim() || "그들/그들의 (They/Them)";
          const data = await supabaseBridge.signUpWithEmail(email, password, {
            name: name.trim() || email.split("@")[0],
            pronouns: finalP,
          });
          const authId = data?.user?.id || data?.id;
          if (!authId) throw new Error("회원가입 실패: 사용자 ID가 발급되지 않았습니다.");

          if (!data?.access_token) {
            setInfo("📧 인증 메일이 발송되었습니다. 확인 후 로그인하거나 온보딩을 진행하세요.");
          }

          setPendingAuthUser({
            id: authId,
            email,
            name: name.trim() || email.split("@")[0],
            avatarUrl: selectedAvatar,
            provider: "email",
          });
        }
      } catch (err: any) {
        setError(err?.message || "인증 처리 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Local mode (if user hasn't connected cloud yet)
    setPendingAuthUser({
      id: `user-${Date.now()}`,
      email,
      name: name.trim() || email.split("@")[0],
      avatarUrl: selectedAvatar,
      provider: "email",
    });
    setMode("onboarding");
  };

  // Finalize onboarding with mandatory Name & Pronouns
  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const finalName = name.trim();
    const finalPronoun = pronounText.trim();

    if (!finalName) {
      setError("커뮤니티에서 활동할 이름(닉네임)을 입력해 주세요.");
      return;
    }
    if (!finalPronoun) {
      setError("대명사(Pronouns, 예: 그/그의, 그녀/그녀의, they)를 직접 입력해 주세요.");
      return;
    }

    const newUser: UserProfile = {
      id: pendingAuthUser?.id || `user-${Date.now()}`,
      email: email || pendingAuthUser?.email || "user@kakaocord.local",
      name: finalName,
      pronouns: finalPronoun,
      avatarUrl: selectedAvatar,
      bannerUrl: bannerUrl.trim(),
      bannerColor: selectedBanner,
      bio: bio.trim() || "반갑습니다!",
      statusMessage: statusMessage.trim() || "온라인",
      status: "online",
      createdAt: new Date().toISOString().slice(0, 10),
      authProvider,
    };

    loginOrRegister(newUser);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsCloudConfigModalOpen(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
            isCloudConnected
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-white/80 dark:bg-[#2b2d31] text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs"
          }`}
          title="Supabase 클라우드 DB & Google OAuth 설정"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isCloudConnected ? "Supabase 클라우드 연결됨" : "Supabase 클라우드 설정"}</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/90 dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-sm"
          aria-label="테마 전환"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>

      {/* Left panel */}
      <div className="lg:w-5/12 bg-gradient-to-br from-[#5865F2] via-[#3b429f] to-[#1e1f22] p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">KakaoCord Live Community</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-4">
            오픈채팅의 친근함과
            <br />
            <span className="text-[#FEE500]">디스코드의 실시간 소통</span>을 하나로.
          </h1>
          <p className="text-sm text-indigo-100/90 leading-relaxed max-w-md">
            실제 유저들이 개설한 공개 커뮤니티에서 실시간 대화를 나누세요.
            본인의 <strong>이름(Name)</strong>과 <strong>대명사(Pronouns)</strong>를 직접 지정하고 나만의 프로필을 완성하세요.
          </p>
        </div>

        {/* Live Profile Preview */}
        <div className="relative z-10 my-8 max-w-sm">
          <div className="rounded-2xl overflow-hidden bg-[#2b2d31]/95 border border-white/15 shadow-2xl backdrop-blur-lg">
            <div
              className="h-20 w-full relative bg-cover bg-center"
              style={{
                background: bannerUrl ? `url(${bannerUrl}) center/cover no-repeat` : selectedBanner,
              }}
            />
            <div className="px-5 pb-5 pt-0 relative">
              <div className="relative -mt-9 mb-3 inline-block">
                <img
                  src={selectedAvatar}
                  alt="Preview"
                  className="w-16 h-16 rounded-2xl border-4 border-[#2b2d31] bg-slate-800 object-cover shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#23a55a] border-2 border-[#2b2d31]" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-white">{name.trim() || "내 이름"}</h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#5865F2]/30 text-indigo-200 border border-indigo-400/30">
                  {pronounText.trim() || "대명사"}
                </span>
              </div>
              <p className="text-xs text-[#FEE500] font-medium mt-1">💬 {statusMessage || "상태 메시지"}</p>
              <p className="text-xs text-slate-300 mt-2 line-clamp-2 bg-[#1e1f22]/70 p-2.5 rounded-xl border border-white/5">
                {bio || "소개글이 여기에 표시됩니다."}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200/80 border-t border-white/10 pt-4">
          ✓ 가짜 더미 데이터 없는 순수 100% 실제 유저 실시간 커뮤니티
        </div>
      </div>

      {/* Right form panel */}
      <div className="lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-lg bg-white dark:bg-[#2b2d31] rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#5865F2] flex items-center justify-center text-white font-bold shadow-md">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {mode === "onboarding"
                    ? "프로필 & 대명사(Pronouns) 설정"
                    : mode === "signup"
                    ? "계정 만들기"
                    : "로그인"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === "onboarding"
                    ? "커뮤니티에서 불릴 이름과 대명사를 직접 작성해 주세요."
                    : "Google 계정(Gmail) 또는 이메일로 시작하세요."}
                </p>
              </div>
            </div>

            {mode !== "onboarding" && (
              <div className="flex bg-slate-100 dark:bg-[#1e1f22] p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    mode === "signup" ? "bg-[#5865F2] text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  회원가입
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    mode === "login" ? "bg-[#5865F2] text-white shadow-sm" : "text-slate-500"
                  }`}
                >
                  로그인
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {info && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              {info}
            </div>
          )}

          {mode !== "onboarding" ? (
            <div className="space-y-5">
              {/* Real Google OAuth Login Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#1e1f22] hover:bg-slate-50 dark:hover:bg-[#35373c] text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                  <path fill="#FBBC05" d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z" />
                </svg>
                Google 계정(Gmail)으로 계속하기
              </button>

              {/* Inline Google OAuth direct configuration (No popup modal) */}
              {showGoogleConfigInline && !getGoogleClientId() && !isCloudConnected && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-[#1e1f22]/90 border border-[#5865F2]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      🔑 Google OAuth 2.0 공식 로그인 설정
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowGoogleConfigInline(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Google 공식 인증창(<code>accounts.google.com</code>)으로 이동하려면 Google Cloud 콘솔에서 발급받은 OAuth Client ID가 필요합니다.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={quickGoogleClientId}
                      onChange={(e) => setQuickGoogleClientId(e.target.value)}
                      placeholder="OAuth Client ID (예: xxxx.apps.googleusercontent.com)"
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!quickGoogleClientId.trim()) {
                          setError("Google OAuth Client ID를 입력해 주세요.");
                          return;
                        }
                        saveGoogleClientId(quickGoogleClientId.trim());
                        redirectToGoogleLogin(quickGoogleClientId.trim());
                      }}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white shrink-0 shadow-xs"
                    >
                      저장 후 accounts.google.com 이동
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50 dark:border-white/5">
                    <span>Supabase Google Auth 연동을 원하시면:</span>
                    <button
                      type="button"
                      onClick={() => setIsCloudConfigModalOpen(true)}
                      className="text-[#5865F2] hover:underline font-semibold"
                    >
                      Supabase 설정
                    </button>
                  </div>
                </div>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-medium">또는 이메일로 진행</span>
                <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    이메일 주소 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    비밀번호 <span className="text-rose-500">* (6자 이상)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? "인증 중..." : mode === "signup" ? "다음: 이름 및 대명사 설정" : "로그인"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Onboarding: Name, Pronouns (Direct Input), Photo Upload */
            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  이름 / 닉네임 (Name) <span className="text-rose-500">* 필수</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 홍길동, 프론트엔드개발자"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              {/* Pronouns with direct input field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  대명사 (Pronouns) <span className="text-rose-500">* 필수</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
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
                <div>
                  <input
                    type="text"
                    required
                    value={pronounText}
                    onChange={(e) => setPronounText(e.target.value)}
                    placeholder="원하는 대명사를 직접 타이핑하세요 (예: 그/그의, 그녀/그녀의, they/them, 자유롭게)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    위 프리셋을 누르거나 직접 자유롭게 호칭/대명사를 입력할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* Profile Photo (Local file upload + Presets) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    프로필 사진
                  </label>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-xs font-semibold text-[#5865F2] hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />내 기기에서 사진 업로드
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`rounded-2xl p-0.5 flex-shrink-0 transition ${
                        selectedAvatar === avatar ? "ring-2 ring-[#5865F2] scale-105" : "opacity-70"
                      }`}
                    >
                      <img src={avatar} alt="" className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-[#1e1f22]" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Background */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    배경 배너 테마
                  </label>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerFile}
                  />
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="text-xs font-semibold text-[#5865F2] hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />배경 이미지 파일 업로드
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {BANNER_PRESETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBannerUrl("");
                        setSelectedBanner(b.gradient);
                      }}
                      className={`h-9 rounded-xl px-2 flex items-center justify-between text-[11px] font-bold text-white shadow-xs ${
                        !bannerUrl && selectedBanner === b.gradient ? "ring-2 ring-offset-1 ring-[#5865F2]" : "opacity-80"
                      }`}
                      style={{ background: b.gradient }}
                    >
                      <span className="truncate">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status & BIO */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  상태 메시지
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="예: 실시간 참여 중"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  한 줄 소개 (BIO)
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="자신을 자유롭게 소개해 주세요."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAuthUser(null);
                    setMode("signup");
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  이전
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>프로필 등록 완료 및 커뮤니티 입장</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
