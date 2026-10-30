"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  AVATAR_PRESETS,
  BANNER_PRESETS,
  PRONOUN_OPTIONS,
} from "@/data/mockData";
import { UserProfile } from "@/types/chat";
import { supabaseBridge } from "@/lib/supabaseClient";
import {
  Mail,
  Lock,
  Sparkles,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  MessageSquareHeart,
  ShieldCheck,
  Database,
  Cloud,
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
  } = useApp();

  // Mode: 'login' | 'signup' | 'onboarding'
  const [mode, setMode] = useState<"login" | "signup" | "onboarding">("signup");
  const [authProvider, setAuthProvider] = useState<"email" | "google" | "kakao">("email");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedPronoun, setSelectedPronoun] = useState(PRONOUN_OPTIONS[0]);
  const [customPronoun, setCustomPronoun] = useState("");
  const [bio, setBio] = useState(
    "안녕하세요! KakaoCord 커뮤니티에서 반갑게 소통해요 ✨"
  );
  const [statusMessage, setStatusMessage] = useState("실시간 접속 중 💬");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [selectedBanner, setSelectedBanner] = useState(BANNER_PRESETS[0].gradient);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google OAuth / email auth finished → jump to onboarding with prefilled values
  useEffect(() => {
    if (!pendingAuthUser) return;
    setMode("onboarding");
    setAuthProvider(pendingAuthUser.provider);
    setEmail(pendingAuthUser.email);
    setName((prev) => prev || pendingAuthUser.name);
    if (pendingAuthUser.avatarUrl) setSelectedAvatar(pendingAuthUser.avatarUrl);
  }, [pendingAuthUser]);

  useEffect(() => {
    if (authError) setError(authError);
  }, [authError]);

  const avatarChoices =
    pendingAuthUser?.avatarUrl && !AVATAR_PRESETS.includes(pendingAuthUser.avatarUrl)
      ? [pendingAuthUser.avatarUrl, ...AVATAR_PRESETS]
      : AVATAR_PRESETS;

  const finalPronoun =
    selectedPronoun === "직접 입력"
      ? customPronoun.trim() || "그들/그들의 (They/Them)"
      : selectedPronoun;

  // Handle Google / Kakao OAuth
  const handleSocialAuth = async (provider: "google" | "kakao") => {
    setError("");
    setAuthProvider(provider);

    // If Supabase Cloud is configured with Google OAuth:
    if (provider === "google" && isCloudConnected) {
      const oauthUrl = supabaseBridge.getGoogleOAuthUrl();
      if (oauthUrl) {
        window.location.href = oauthUrl;
        return;
      }
    }

    if (provider === "google") {
      setEmail("developer.kr@gmail.com");
      if (!name) setName("김디스코드");
    } else {
      setEmail("openchat.user@kakao.com");
      if (!name) setName("박카카오");
      setSelectedBanner(BANNER_PRESETS[1].gradient);
    }
    setMode("onboarding");
  };

  // Handle standard email step or direct signup
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("올바른 이메일 주소(예: user@gmail.com)를 입력해 주세요.");
      return;
    }
    if (password.length < 4) {
      setError("비밀번호를 4자 이상 입력해 주세요.");
      return;
    }

    if (isCloudConnected) {
      if (password.length < 6) {
        setError("Supabase 정책상 비밀번호는 6자 이상이어야 합니다.");
        return;
      }
      try {
        setIsLoading(true);
        if (mode === "login") {
          const authData = await supabaseBridge.signInWithPassword(email, password);
          const authUser = authData?.user;
          if (!authUser?.id) throw new Error("로그인 응답에 사용자 정보가 없습니다.");
          const meta = authUser.user_metadata || {};
          if (meta.pronouns && PRONOUN_OPTIONS.includes(meta.pronouns)) {
            setSelectedPronoun(meta.pronouns);
          }
          // Existing profile → straight in. Otherwise → onboarding (via pendingAuthUser effect).
          await loginWithAuthUserId({
            id: authUser.id,
            email: authUser.email || email,
            name: meta.name || email.split("@")[0],
            avatarUrl: selectedAvatar,
            provider: "email",
          });
        } else {
          const data = await supabaseBridge.signUpWithEmail(email, password, {
            name: name || email.split("@")[0],
            pronouns: finalPronoun,
          });
          const authId = data?.user?.id || data?.id;
          if (!authId) throw new Error("회원가입 응답에 사용자 ID가 없습니다.");
          if (!data?.access_token) {
            setInfo("📧 인증 메일이 발송되었습니다. 다음 로그인 전에 메일의 링크를 눌러 주세요.");
          }
          setPendingAuthUser({
            id: authId,
            email,
            name: name || email.split("@")[0],
            avatarUrl: selectedAvatar,
            provider: "email",
          });
        }
      } catch (err: any) {
        setError(err.message || "인증 처리 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setMode("onboarding");
  };

  // Finalize Onboarding (Requires Name & Pronouns)
  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("필수 항목: 표시될 이름(닉네임)을 입력해 주세요.");
      return;
    }
    if (selectedPronoun === "직접 입력" && !customPronoun.trim()) {
      setError("필수 항목: 직접 입력할 대명사(Pronouns)를 적어 주세요.");
      return;
    }

    const newUser: UserProfile = {
      // Cloud mode: keyed by the Supabase Auth user id so the profile survives re-login.
      id: pendingAuthUser?.id || `user-${Date.now()}`,
      email: email || "user@gmail.com",
      name: name.trim(),
      pronouns: finalPronoun,
      avatarUrl: selectedAvatar,
      bannerUrl: "",
      bannerColor: selectedBanner,
      bio: bio.trim() || "반갑습니다!",
      statusMessage: statusMessage.trim() || "접속 중",
      status: "online",
      createdAt: new Date().toISOString().slice(0, 10),
      authProvider,
    };

    loginOrRegister(newUser);
  };

  // Quick Demo Login for instant testing
  const handleQuickDemoLogin = () => {
    const demoUser: UserProfile = {
      id: "user-demo-kr",
      email: "kakaocord.master@gmail.com",
      name: "한결 (프론트엔드 & 게이머)",
      pronouns: "그들/그들의 (They/Them)",
      avatarUrl: AVATAR_PRESETS[0],
      bannerUrl: "",
      bannerColor: BANNER_PRESETS[0].gradient,
      bio: "카카오톡의 친근한 오픈채팅 감성과 디스코드의 깔끔한 채널 UI를 모두 좋아하는 개발자입니다 🚀",
      statusMessage: "커뮤니티 라운지 탐방 중 ✨",
      status: "online",
      createdAt: "2026-10-30",
      authProvider: "google",
    };
    loginOrRegister(demoUser);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-hidden">
      {/* Top-right Controls: Supabase Config, Demo Login, Theme Toggle */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => setIsCloudConfigModalOpen(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
            isCloudConnected
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-white/80 dark:bg-[#2b2d31] text-amber-600 dark:text-amber-400 border-amber-500/30 shadow-xs"
          }`}
          title="Supabase 클라우드 설정"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isCloudConnected ? "클라우드 연결됨" : "Supabase DB 설정"}</span>
        </button>

        {!isCloudConnected && (
          <button
            onClick={handleQuickDemoLogin}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FEE500] hover:bg-[#FADA0A] text-[#3C1E1E] shadow-sm transition flex items-center gap-1.5"
            title="입력 없이 데모 계정으로 즉시 체험하기 (로컬 데모 모드 전용)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            데모 1초 입장
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/90 dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:scale-105 transition shadow-sm"
          aria-label="테마 전환"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>

      {/* Left Showcase Column (KakaoTalk + Discord Fusion Visual) */}
      <div className="lg:w-5/12 bg-gradient-to-br from-[#5865F2] via-[#3b429f] to-[#1e1f22] p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#FEE500]/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEE500] animate-pulse" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              KakaoTalk × Discord Hybrid
            </span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight mb-4">
            오픈채팅의 친근함과
            <br />
            <span className="text-[#FEE500]">디스코드의 커뮤니티</span>를 하나로.
          </h1>
          <p className="text-sm lg:text-base text-indigo-100/90 leading-relaxed max-w-md">
            Gmail 간편 연동으로 시작하고, 나만의 <strong>이름(Name)</strong>과{" "}
            <strong>대명사(Pronouns)</strong>, 커스텀 배너 프로필을 설정해 공개
            커뮤니티 채팅방에 참여해 보세요.
          </p>
        </div>

        {/* Live Preview Profile Card inside Left Panel */}
        <div className="relative z-10 my-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-200/80 mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#FEE500]" />
            실시간 내 미니 프로필 미리보기
          </div>
          <div className="rounded-2xl overflow-hidden bg-[#2b2d31]/95 border border-white/15 shadow-2xl backdrop-blur-lg max-w-sm">
            <div
              className="h-20 w-full transition-all duration-300 relative"
              style={{ background: selectedBanner }}
            >
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/40 text-white backdrop-blur-sm">
                {authProvider === "google"
                  ? "Google 연동"
                  : authProvider === "kakao"
                  ? "Kakao 연동"
                  : "Email 계정"}
              </span>
            </div>
            <div className="px-5 pb-5 pt-0 relative">
              <div className="relative -mt-9 mb-3 inline-block">
                <img
                  src={selectedAvatar}
                  alt="Preview Avatar"
                  className="w-16 h-16 rounded-2xl border-4 border-[#2b2d31] bg-slate-800 object-cover shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#23a55a] border-2 border-[#2b2d31]" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  {name.trim() || "이름을 입력해 주세요"}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#5865F2]/30 text-indigo-200 border border-indigo-400/30">
                  {finalPronoun}
                </span>
              </div>
              <p className="text-xs text-[#FEE500] font-medium mt-1">
                💬 {statusMessage || "상태 메시지를 입력해 보세요"}
              </p>
              <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 bg-[#1e1f22]/70 p-2.5 rounded-xl border border-white/5">
                {bio || "나를 표현하는 한 줄 소개글(BIO)이 여기에 표시됩니다."}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-indigo-200/75 border-t border-white/10 pt-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FEE500]" />
            대명사(Pronouns) 필수 등록 지원
          </span>
          <span>영구 클라우드 DB 연동 지원</span>
        </div>
      </div>

      {/* Right Auth / Onboarding Form Panel */}
      <div className="lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        <div className="w-full max-w-lg bg-white dark:bg-[#2b2d31] rounded-3xl shadow-xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8">
          {/* Step Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#5865F2] flex items-center justify-center text-white font-bold shadow-md">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {mode === "onboarding"
                    ? "필수 프로필 & 대명사 설정"
                    : mode === "signup"
                    ? "KakaoCord 계정 만들기"
                    : "다시 오신 것을 환영해요!"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === "onboarding"
                    ? "커뮤니티에서 사용할 이름(Name)과 대명사(Pronouns)를 등록해 주세요."
                    : "이메일 또는 Gmail/카카오 소셜 계정으로 간편하게 시작하세요."}
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
                    mode === "signup"
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
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
                    mode === "login"
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  로그인
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              {info}
            </div>
          )}

          {mode !== "onboarding" ? (
            <div className="space-y-5">
              {/* Gmail / Kakao Social Login Buttons */}
              <div className={`grid grid-cols-1 gap-3 ${isCloudConnected ? "" : "sm:grid-cols-2"}`}>
                <button
                  type="button"
                  onClick={() => handleSocialAuth("google")}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#1e1f22] hover:bg-slate-50 dark:hover:bg-[#35373c] text-slate-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
                    />
                  </svg>
                  Gmail 계정으로 계속하기
                </button>

                {!isCloudConnected && (
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("kakao")}
                    className="w-full py-3 px-4 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#3C1E1E] font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <span className="text-sm">💬</span>
                    카카오 계정으로 시작 (데모)
                  </button>
                )}
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
                <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-medium">
                  또는 이메일로 진행
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-white/10" />
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    이메일 주소 (Gmail 등) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    비밀번호 <span className="text-rose-500">*</span>
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

                {/* Allow entering Name & Pronouns right on the signup screen or next step */}
                {mode === "signup" && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-[#1e1f22]/90 border border-indigo-200/60 dark:border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#5865F2] dark:text-indigo-400 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" />
                        필수 온보딩 정보 (이름 & 대명사)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        필수 입력
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        이름 / 닉네임 (Name) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예: 김민지, 코딩하는라이언"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        대명사 (Pronouns) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedPronoun}
                        onChange={(e) => setSelectedPronoun(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                      >
                        {PRONOUN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      {selectedPronoun === "직접 입력" && (
                        <input
                          type="text"
                          value={customPronoun}
                          onChange={(e) => setCustomPronoun(e.target.value)}
                          placeholder="직접 대명사 입력 (예: 그/그녀/they)"
                          className="mt-2 w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                        />
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>
                    {isLoading
                      ? "처리 중..."
                      : mode === "signup"
                      ? "다음: 프로필 꾸미기 및 완료"
                      : "로그인 진행"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* Step 2: Mandatory Name & Pronouns + Avatar/Banner Onboarding */
            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    이름 (Name) <span className="text-rose-500">* 필수</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="커뮤니티 활동 이름"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    대명사 (Pronouns) <span className="text-rose-500">* 필수</span>
                  </label>
                  <select
                    value={selectedPronoun}
                    onChange={(e) => setSelectedPronoun(e.target.value)}
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

              {selectedPronoun === "직접 입력" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    직접 입력할 대명사 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customPronoun}
                    onChange={(e) => setCustomPronoun(e.target.value)}
                    placeholder="예: 그/그녀, Ze/Zir, 자유롭게 불러주세요"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>
              )}

              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  프로필 아바타 선택
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {avatarChoices.map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative rounded-2xl p-0.5 transition flex-shrink-0 ${
                        selectedAvatar === avatar
                          ? "ring-2 ring-[#5865F2] scale-105"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={`아바타 ${idx + 1}`}
                        className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-[#1e1f22]"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                  프로필 배경 배너 테마
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BANNER_PRESETS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBanner(b.gradient)}
                      className={`h-10 rounded-xl p-2 flex items-center justify-between text-[11px] font-semibold text-white shadow-sm transition ${
                        selectedBanner === b.gradient
                          ? "ring-2 ring-offset-2 ring-[#5865F2] dark:ring-offset-[#2b2d31]"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ background: b.gradient }}
                    >
                      <span className="truncate drop-shadow">{b.label}</span>
                      {selectedBanner === b.gradient && (
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio & Status Message */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    상태 메시지 (카카오톡 프로필 스타일)
                  </label>
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    placeholder="예: 오늘도 화이팅! 🔥"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    소개글 (BIO)
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="자신을 소개하는 짧은 글을 작성해 주세요."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAuthUser(null);
                    setMode("signup");
                  }}
                  className="px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition"
                >
                  이전
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
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
