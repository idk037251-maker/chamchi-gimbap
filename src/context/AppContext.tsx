"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { UserProfile, Community, ChatMessage, ChatStyleMode } from "@/types/chat";
import {
  INITIAL_COMMUNITIES,
  INITIAL_MESSAGES,
  SIMULATED_REPLIES,
  AVATAR_PRESETS,
  BANNER_PRESETS,
} from "@/data/mockData";
import {
  supabaseBridge,
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  RealtimeEvent,
} from "@/lib/supabaseClient";

/** Identity obtained from Supabase Auth (Google OAuth / email) that still needs onboarding. */
export interface PendingAuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: "google" | "email";
}

type NewCommunityInput = {
  name: string;
  description: string;
  rules: string[];
  category: string;
  iconEmoji: string;
  bannerGradient: string;
  tags: string[];
};

interface AppContextType {
  isHydrated: boolean;

  // Theme & Style
  theme: "dark" | "light";
  toggleTheme: () => void;
  chatStyle: ChatStyleMode;
  setChatStyle: (style: ChatStyleMode) => void;

  // Supabase Cloud State
  isCloudConnected: boolean;
  isCloudConfigModalOpen: boolean;
  setIsCloudConfigModalOpen: (open: boolean) => void;
  updateSupabaseCloudKeys: (url: string, key: string) => Promise<boolean>;
  disconnectSupabaseCloud: () => void;

  // Auth & User Profile
  currentUser: UserProfile | null;
  pendingAuthUser: PendingAuthUser | null;
  setPendingAuthUser: (u: PendingAuthUser | null) => void;
  authError: string;
  loginOrRegister: (user: UserProfile) => void;
  loginWithAuthUserId: (authUser: PendingAuthUser) => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatarOrBannerFile: (bucket: "avatars" | "banners", file: File) => Promise<string>;
  logout: () => void;

  // Navigation & Drawers/Modals
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  activeCommunityId: string | null;
  setActiveCommunityId: (id: string | null) => void;
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;

  // Communities & Chat
  communities: Community[];
  joinedCommunityIds: string[];
  joinCommunity: (communityId: string) => void;
  createCommunity: (data: NewCommunityInput) => Promise<Community>;
  messages: ChatMessage[];
  sendMessage: (content: string, attachmentUrl?: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => void;
  typingUser: string | null;
  triggerDemoIncomingMessage: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "kakaocord_user_v1",
  COMMUNITIES: "kakaocord_communities_v1",
  MESSAGES: "kakaocord_messages_v1",
  JOINED: "kakaocord_joined_v1",
  THEME: "kakaocord_theme_v1",
};

// ------------------------------------------------------------------ helpers

const formatKoreanTime = (dateObj = new Date()) => {
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "오후" : "오전";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${displayHour}:${minutes}`;
};

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const saveLocal = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode – ignore */
  }
};

function mapCommunityRow(r: any): Community {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    rules: Array.isArray(r.rules) ? r.rules : [],
    category: r.category || "자유 / 소통",
    iconEmoji: r.icon_emoji || "💬",
    bannerGradient: r.banner_gradient || BANNER_PRESETS[0].gradient,
    memberCount: r.member_count || 1,
    onlineCount: r.online_count || 1,
    createdBy: r.created_by || "방장",
    createdAt: r.created_at ? String(r.created_at).slice(0, 10) : "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    channels:
      Array.isArray(r.channels) && r.channels.length > 0
        ? r.channels
        : [{ id: "general", name: "자유-수다방", type: "text", description: "메인 대화 채널" }],
  };
}

function communityToRow(c: Community) {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    rules: c.rules,
    category: c.category,
    icon_emoji: c.iconEmoji,
    banner_gradient: c.bannerGradient,
    member_count: c.memberCount,
    online_count: c.onlineCount,
    created_by: c.createdBy,
    tags: c.tags,
    channels: c.channels,
  };
}

function mapMessageRow(r: any): ChatMessage {
  return {
    id: r.id,
    communityId: r.community_id,
    channelId: r.channel_id || "general",
    senderId: r.sender_id,
    senderName: r.sender_name,
    senderPronouns: r.sender_pronouns,
    senderAvatar: r.sender_avatar || "",
    senderRole: r.sender_role || "멤버",
    content: r.content,
    timestamp: formatKoreanTime(new Date(r.created_at || Date.now())),
    unreadCount: 0,
    reactions: Array.isArray(r.reactions) ? r.reactions : [],
    isSystem: !!r.is_system,
  };
}

function messageToRow(m: ChatMessage) {
  return {
    id: m.id,
    community_id: m.communityId,
    channel_id: m.channelId,
    sender_id: m.senderId,
    sender_name: m.senderName,
    sender_pronouns: m.senderPronouns,
    sender_avatar: m.senderAvatar,
    sender_role: m.senderRole || "멤버",
    content: m.content,
    unread_count: 0,
    reactions: m.reactions,
    is_system: !!m.isSystem,
  };
}

function mapProfileRow(r: any, provider: UserProfile["authProvider"]): UserProfile {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    pronouns: r.pronouns,
    avatarUrl: r.avatar_url || AVATAR_PRESETS[0],
    bannerUrl: r.banner_url || "",
    bannerColor: r.banner_color || BANNER_PRESETS[0].gradient,
    bio: r.bio || "",
    statusMessage: r.status_message || "",
    status: r.status || "online",
    createdAt: r.created_at ? String(r.created_at).slice(0, 10) : "",
    authProvider: provider,
  };
}

function profileToRow(u: UserProfile) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    pronouns: u.pronouns,
    avatar_url: u.avatarUrl,
    banner_url: u.bannerUrl,
    banner_color: u.bannerColor,
    bio: u.bio,
    status_message: u.statusMessage,
    status: u.status,
  };
}

// ------------------------------------------------------------------ provider

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [chatStyle, setChatStyle] = useState<ChatStyleMode>("hybrid");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingAuthUser, setPendingAuthUser] = useState<PendingAuthUser | null>(null);
  const [authError, setAuthError] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isCloudConfigModalOpen, setIsCloudConfigModalOpen] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>("general");
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // ---------------------------------------------------------- cloud bootstrap

  const handleRealtimeEvent = useCallback((evt: RealtimeEvent) => {
    if (evt.table === "messages") {
      const incoming = mapMessageRow(evt.record);
      setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
    } else if (evt.table === "communities") {
      const comm = mapCommunityRow(evt.record);
      setCommunities((prev) => (prev.some((c) => c.id === comm.id) ? prev : [comm, ...prev]));
    }
  }, []);

  const startCloud = useCallback(async () => {
    supabaseBridge.refreshConfig();
    const rows = await supabaseBridge.fetchCommunities();
    setCommunities(rows.map(mapCommunityRow));
    supabaseBridge.connectRealtime(handleRealtimeEvent);
  }, [handleRealtimeEvent]);

  /** After Google OAuth, Supabase redirects back with #access_token=... in the URL. */
  const consumeOAuthRedirect = useCallback(async () => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const params = new URLSearchParams(hash.slice(1));

    if (params.get("error")) {
      setAuthError(
        `Google 로그인 실패: ${params.get("error_description") || params.get("error")}`
      );
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }

    const accessToken = params.get("access_token");
    if (!accessToken) return;
    window.history.replaceState(null, "", window.location.pathname);

    const authUser = await supabaseBridge.getUserFromAccessToken(accessToken);
    if (!authUser?.id) {
      setAuthError("Google 로그인 정보를 확인하지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    const meta = authUser.user_metadata || {};
    const existing = await supabaseBridge.fetchProfile(authUser.id);
    if (existing) {
      const user = mapProfileRow(existing, "google");
      setCurrentUser(user);
      saveLocal(STORAGE_KEYS.USER, user);
      return;
    }

    // First login → onboarding (name prefilled from Google, pronouns default)
    setPendingAuthUser({
      id: authUser.id,
      email: authUser.email || "",
      name: meta.full_name || meta.name || (authUser.email || "").split("@")[0],
      avatarUrl: meta.avatar_url || meta.picture || AVATAR_PRESETS[0],
      provider: "google",
    });
  }, []);

  useEffect(() => {
    const cloud = !!getSupabaseConfig();
    setIsCloudConnected(cloud);

    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);

      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedJoined = localStorage.getItem(STORAGE_KEYS.JOINED);
      setJoinedCommunityIds(
        savedJoined ? JSON.parse(savedJoined) : cloud ? [] : ["comm-frontend-kr", "comm-game-party"]
      );

      if (!cloud) {
        const savedCommunities = localStorage.getItem(STORAGE_KEYS.COMMUNITIES);
        const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        setCommunities(savedCommunities ? JSON.parse(savedCommunities) : INITIAL_COMMUNITIES);
        setMessages(savedMessages ? JSON.parse(savedMessages) : INITIAL_MESSAGES);
      }
    } catch (e) {
      console.error("Failed to restore local state", e);
    }

    if (cloud) {
      startCloud();
      consumeOAuthRedirect();
    }
    setIsHydrated(true);

    return () => supabaseBridge.disconnectRealtime();
  }, [startCloud, consumeOAuthRedirect]);

  // Load persisted history whenever a channel is opened (cloud mode)
  useEffect(() => {
    if (!isCloudConnected || !activeCommunityId) return;
    let cancelled = false;
    supabaseBridge.fetchMessages(activeCommunityId, activeChannelId).then((rows) => {
      if (cancelled) return;
      const mapped = rows.map(mapMessageRow);
      setMessages((prev) => {
        const others = prev.filter(
          (m) => !(m.communityId === activeCommunityId && m.channelId === activeChannelId)
        );
        // keep realtime messages that arrived after the fetch started
        const extra = prev.filter(
          (m) =>
            m.communityId === activeCommunityId &&
            m.channelId === activeChannelId &&
            !mapped.some((x) => x.id === m.id)
        );
        return [...others, ...mapped, ...extra];
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isCloudConnected, activeCommunityId, activeChannelId]);

  // Persist local-demo data
  useEffect(() => {
    if (!isHydrated || isCloudConnected) return;
    saveLocal(STORAGE_KEYS.COMMUNITIES, communities);
  }, [communities, isHydrated, isCloudConnected]);

  useEffect(() => {
    if (!isHydrated || isCloudConnected) return;
    saveLocal(STORAGE_KEYS.MESSAGES, messages.slice(-500));
  }, [messages, isHydrated, isCloudConnected]);

  // Theme class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveLocal(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Cross-tab sync for local demo mode
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("kakaocord_realtime_channel");
    broadcastRef.current = channel;
    channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "NEW_MESSAGE") {
        setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
      } else if (type === "NEW_COMMUNITY") {
        setCommunities((prev) => (prev.some((c) => c.id === payload.id) ? prev : [payload, ...prev]));
      }
    };
    return () => channel.close();
  }, []);

  // ------------------------------------------------------------------ actions

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const updateSupabaseCloudKeys = async (url: string, key: string) => {
    saveSupabaseConfig(url, key);
    setIsCloudConnected(true);
    setMessages([]);
    await startCloud();
    return true;
  };

  const disconnectSupabaseCloud = () => {
    clearSupabaseConfig();
    supabaseBridge.disconnectRealtime();
    supabaseBridge.refreshConfig();
    setIsCloudConnected(false);
    setCommunities(INITIAL_COMMUNITIES);
    setMessages(INITIAL_MESSAGES);
  };

  const loginOrRegister = (user: UserProfile) => {
    setCurrentUser(user);
    setPendingAuthUser(null);
    setAuthError("");
    saveLocal(STORAGE_KEYS.USER, user);
    if (isCloudConnected) supabaseBridge.upsertProfile(profileToRow(user));
  };

  /** Email login: if a profile already exists for this auth user, log straight in. */
  const loginWithAuthUserId = async (authUser: PendingAuthUser) => {
    const existing = await supabaseBridge.fetchProfile(authUser.id);
    if (existing) {
      const user = mapProfileRow(existing, authUser.provider);
      setCurrentUser(user);
      saveLocal(STORAGE_KEYS.USER, user);
      return true;
    }
    setPendingAuthUser(authUser);
    return false;
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    saveLocal(STORAGE_KEYS.USER, updated);
    if (isCloudConnected) await supabaseBridge.upsertProfile(profileToRow(updated));

    setMessages((prev) =>
      prev.map((m) =>
        m.senderId === currentUser.id
          ? { ...m, senderName: updated.name, senderPronouns: updated.pronouns, senderAvatar: updated.avatarUrl }
          : m
      )
    );
  };

  const uploadAvatarOrBannerFile = async (
    bucket: "avatars" | "banners",
    file: File
  ): Promise<string> => {
    if (isCloudConnected) return supabaseBridge.uploadFile(bucket, file, file.name);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveCommunityId(null);
    setIsDrawerOpen(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
  };

  const joinCommunity = (communityId: string) => {
    setActiveCommunityId(communityId);
    setActiveChannelId("general");
    setIsDrawerOpen(false);

    if (joinedCommunityIds.includes(communityId)) return;
    const nextJoined = [...joinedCommunityIds, communityId];
    setJoinedCommunityIds(nextJoined);
    saveLocal(STORAGE_KEYS.JOINED, nextJoined);

    if (!currentUser) return;
    const sysMsg: ChatMessage = {
      id: newId("sys"),
      communityId,
      channelId: "general",
      senderId: "system",
      senderName: "시스템 알림",
      senderPronouns: "-",
      senderAvatar: "",
      content: `🎉 ${currentUser.name} (${currentUser.pronouns}) 님이 커뮤니티에 입장하셨습니다!`,
      timestamp: formatKoreanTime(),
      isSystem: true,
      reactions: [],
    };
    setMessages((prev) => [...prev, sysMsg]);
    if (isCloudConnected) supabaseBridge.insertMessage(messageToRow(sysMsg));
  };

  const createCommunity = async (data: NewCommunityInput) => {
    const newComm: Community = {
      id: newId("comm"),
      name: data.name,
      description: data.description,
      rules: data.rules.length > 0 ? data.rules : ["1. 서로 배려하고 존중하는 대화 문화를 만들어가요."],
      category: data.category || "자유 / 소통",
      iconEmoji: data.iconEmoji || "💬",
      bannerGradient: data.bannerGradient,
      memberCount: 1,
      onlineCount: 1,
      createdBy: currentUser?.name || "익명 방장",
      createdAt: new Date().toISOString().slice(0, 10),
      tags: data.tags.length > 0 ? data.tags : ["#신규오픈"],
      channels: [
        { id: "general", name: "메인-오픈채팅방", type: "text", description: `${data.name}의 메인 실시간 대화 채널` },
        { id: "notice", name: "공지사항-규칙", type: "announcement", description: "커뮤니티 규칙 및 중요 공지" },
        { id: "qna", name: "자유-질문방", type: "qna", description: "궁금한 점을 편하게 물어보는 공간" },
      ],
    };

    const welcomeMsg: ChatMessage = {
      id: newId("msg"),
      communityId: newComm.id,
      channelId: "general",
      senderId: currentUser?.id || "creator",
      senderName: currentUser?.name || "방장",
      senderPronouns: currentUser?.pronouns || "그들/그들의 (They/Them)",
      senderAvatar: currentUser?.avatarUrl || "",
      senderRole: "방장",
      content: `🎉 '${newComm.name}' 커뮤니티가 개설되었습니다! 상단의 [규칙 및 상세 정보]를 확인하고 인사를 나눠보세요!`,
      timestamp: formatKoreanTime(),
      reactions: [],
    };

    if (isCloudConnected) {
      const ok = await supabaseBridge.insertCommunity(communityToRow(newComm));
      if (!ok) throw new Error("커뮤니티를 DB에 저장하지 못했습니다. Supabase 설정을 확인해 주세요.");
      await supabaseBridge.insertMessage(messageToRow(welcomeMsg));
    } else {
      broadcastRef.current?.postMessage({ type: "NEW_COMMUNITY", payload: newComm });
      broadcastRef.current?.postMessage({ type: "NEW_MESSAGE", payload: welcomeMsg });
    }

    setCommunities((prev) => (prev.some((c) => c.id === newComm.id) ? prev : [newComm, ...prev]));
    setMessages((prev) => (prev.some((m) => m.id === welcomeMsg.id) ? prev : [...prev, welcomeMsg]));
    setJoinedCommunityIds((prev) => {
      const next = [...prev, newComm.id];
      saveLocal(STORAGE_KEYS.JOINED, next);
      return next;
    });

    setActiveCommunityId(newComm.id);
    setActiveChannelId("general");
    setIsCreateModalOpen(false);
    setIsDrawerOpen(false);
    return newComm;
  };

  /** Local demo only: simulates another member replying. Never runs in cloud mode. */
  const simulateReply = (communityId: string, channelId: string) => {
    const replier = SIMULATED_REPLIES[Math.floor(Math.random() * SIMULATED_REPLIES.length)];
    setTypingUser(`${replier.senderName} (${replier.senderPronouns})`);
    setTimeout(() => {
      setTypingUser(null);
      const reply: ChatMessage = {
        id: newId("msg-demo"),
        communityId,
        channelId,
        senderId: `sim-${replier.senderName}`,
        senderName: replier.senderName,
        senderPronouns: replier.senderPronouns,
        senderAvatar: replier.senderAvatar,
        senderRole: replier.senderRole,
        content: replier.templates[Math.floor(Math.random() * replier.templates.length)],
        timestamp: formatKoreanTime(),
        unreadCount: 0,
        reactions: [],
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  const sendMessage = async (content: string, attachmentUrl?: string) => {
    if (!currentUser || !activeCommunityId || (!content.trim() && !attachmentUrl)) return;

    const newMsg: ChatMessage = {
      id: newId("msg"),
      communityId: activeCommunityId,
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPronouns: currentUser.pronouns,
      senderAvatar: currentUser.avatarUrl,
      senderRole: "멤버",
      content: content.trim(),
      timestamp: formatKoreanTime(),
      unreadCount: isCloudConnected ? 0 : 1,
      reactions: [],
      attachmentUrl,
    };

    // Optimistic render; the realtime echo is de-duplicated by id.
    setMessages((prev) => [...prev, newMsg]);

    if (isCloudConnected) {
      const ok = await supabaseBridge.insertMessage(messageToRow(newMsg));
      if (!ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newMsg.id ? { ...m, content: `${m.content}\n⚠️ 전송 실패 (네트워크/DB 설정 확인)` } : m
          )
        );
      }
      return;
    }

    broadcastRef.current?.postMessage({ type: "NEW_MESSAGE", payload: newMsg });
    const commId = activeCommunityId;
    const chanId = activeChannelId;
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, unreadCount: 0 } : m)));
      simulateReply(commId, chanId);
    }, 900);
  };

  const triggerDemoIncomingMessage = () => {
    if (!activeCommunityId || isCloudConnected) return;
    simulateReply(activeCommunityId, activeChannelId);
  };

  // Reactions are kept client-side (not persisted) to keep the schema simple.
  const toggleReaction = (messageId: string, emoji: string) => {
    const userId = currentUser?.id || "guest";
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        if (!existing) return { ...m, reactions: [...m.reactions, { emoji, users: [userId] }] };
        const users = existing.users.includes(userId)
          ? existing.users.filter((u) => u !== userId)
          : [...existing.users, userId];
        return {
          ...m,
          reactions:
            users.length === 0
              ? m.reactions.filter((r) => r.emoji !== emoji)
              : m.reactions.map((r) => (r.emoji === emoji ? { ...r, users } : r)),
        };
      })
    );
  };

  return (
    <AppContext.Provider
      value={{
        isHydrated,
        theme,
        toggleTheme,
        chatStyle,
        setChatStyle,
        isCloudConnected,
        isCloudConfigModalOpen,
        setIsCloudConfigModalOpen,
        updateSupabaseCloudKeys,
        disconnectSupabaseCloud,
        currentUser,
        pendingAuthUser,
        setPendingAuthUser,
        authError,
        loginOrRegister,
        loginWithAuthUserId,
        updateProfile,
        uploadAvatarOrBannerFile,
        logout,
        isDrawerOpen,
        setIsDrawerOpen,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        activeCommunityId,
        setActiveCommunityId,
        activeChannelId,
        setActiveChannelId,
        communities,
        joinedCommunityIds,
        joinCommunity,
        createCommunity,
        messages,
        sendMessage,
        toggleReaction,
        typingUser,
        triggerDemoIncomingMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
