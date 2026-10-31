"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { UserProfile, Community, ChatMessage, ChatStyleMode } from "@/types/chat";
import { BANNER_PRESETS, AVATAR_PRESETS } from "@/data/mockData";
import { cloudStore } from "@/lib/cloudStore";

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

  // Cloud Sync
  isCloudConnected: boolean;
  isCloudConfigModalOpen: boolean;
  setIsCloudConfigModalOpen: (open: boolean) => void;
  updateSupabaseCloudKeys: (url: string, key: string) => Promise<boolean>;
  disconnectSupabaseCloud: () => void;

  // Auth & User Profile (Site-exclusive independent account)
  currentUser: UserProfile | null;
  authError: string;
  registerSiteAccount: (data: {
    username: string;
    password: string;
    name: string;
    pronouns: string;
    avatarUrl: string;
    bannerUrl: string;
    bannerColor: string;
    bio: string;
    statusMessage: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginSiteAccount: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginOrRegister: (user: UserProfile) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "kakaocord_site_user_v3",
  COMMUNITIES: "kakaocord_communities_v3",
  MESSAGES: "kakaocord_messages_v3",
  JOINED: "kakaocord_joined_v3",
  THEME: "kakaocord_theme_v3",
};

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
  } catch {}
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [chatStyle, setChatStyle] = useState<ChatStyleMode>("hybrid");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isCloudConfigModalOpen, setIsCloudConfigModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>("general");

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const activeCommunityIdRef = useRef<string | null>(null);
  activeCommunityIdRef.current = activeCommunityId;

  // Initialize from LocalStorage and Cloud
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);

      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedJoined = localStorage.getItem(STORAGE_KEYS.JOINED);
      if (savedJoined) setJoinedCommunityIds(JSON.parse(savedJoined));
    } catch (e) {
      console.error("Local storage load error", e);
    } finally {
      setIsHydrated(true);
    }

    // Initialize BroadcastChannel for cross-tab sync
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("kakaocord_sync_channel");
      broadcastRef.current = bc;
      bc.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === "NEW_COMMUNITY") {
          setCommunities((prev) => (prev.some((c) => c.id === payload.id) ? prev : [payload, ...prev]));
        } else if (type === "NEW_MESSAGE") {
          if (activeCommunityIdRef.current === payload.communityId) {
            setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
          }
        }
      };
    }

    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  // Sync communities periodically from cloud (every 3s)
  useEffect(() => {
    let isCancelled = false;

    const fetchCommunities = async () => {
      try {
        const comms = await cloudStore.loadCommunities();
        if (!isCancelled) {
          setCommunities(comms);
        }
      } catch (err) {
        console.error("Failed to sync communities from cloud", err);
      }
    };

    fetchCommunities();
    const interval = setInterval(fetchCommunities, 3000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Sync messages periodically for active community (every 2s)
  useEffect(() => {
    if (!activeCommunityId) {
      setMessages([]);
      return;
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        const msgs = await cloudStore.loadMessages(activeCommunityId);
        if (!isCancelled) {
          setMessages(msgs);
        }
      } catch (err) {
        console.error("Failed to sync messages from cloud", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activeCommunityId]);

  // Apply dark class to <html>
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Register site-exclusive account
  const registerSiteAccount = async (data: {
    username: string;
    password: string;
    name: string;
    pronouns: string;
    avatarUrl: string;
    bannerUrl: string;
    bannerColor: string;
    bio: string;
    statusMessage: string;
  }) => {
    setAuthError("");
    const res = await cloudStore.registerUser(data);
    if (!res.success || !res.user) {
      setAuthError(res.error || "회원가입에 실패했습니다.");
      return { success: false, error: res.error };
    }

    setCurrentUser(res.user);
    saveLocal(STORAGE_KEYS.USER, res.user);
    return { success: true };
  };

  // Login site-exclusive account
  const loginSiteAccount = async (username: string, password: string) => {
    setAuthError("");
    const res = await cloudStore.loginUser(username, password);
    if (!res.success || !res.user) {
      setAuthError(res.error || "로그인에 실패했습니다.");
      return { success: false, error: res.error };
    }

    setCurrentUser(res.user);
    saveLocal(STORAGE_KEYS.USER, res.user);
    return { success: true };
  };

  const loginOrRegister = (user: UserProfile) => {
    setCurrentUser(user);
    saveLocal(STORAGE_KEYS.USER, user);
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
    setActiveCommunityId(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, ...updates };
    setCurrentUser(updated);
    saveLocal(STORAGE_KEYS.USER, updated);
    await cloudStore.updateUser(updated);
  };

  // Convert uploaded image to Base64 data URL for permanent universal sharing
  const uploadAvatarOrBannerFile = async (
    _bucket: "avatars" | "banners",
    file: File
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("파일 읽기 실패"));
        }
      };
      reader.onerror = () => reject(new Error("파일 읽기 에러"));
      reader.readAsDataURL(file);
    });
  };

  const joinCommunity = (communityId: string) => {
    setJoinedCommunityIds((prev) => {
      if (prev.includes(communityId)) return prev;
      const next = [...prev, communityId];
      saveLocal(STORAGE_KEYS.JOINED, next);
      return next;
    });
  };

  const createCommunity = async (data: NewCommunityInput): Promise<Community> => {
    const commId = newId("comm");
    const newComm: Community = {
      id: commId,
      name: data.name.trim(),
      description: data.description.trim(),
      rules: data.rules.filter((r) => r.trim().length > 0),
      category: data.category || "자유 / 소통",
      iconEmoji: data.iconEmoji || "💬",
      bannerGradient: data.bannerGradient || BANNER_PRESETS[0].gradient,
      memberCount: 1,
      onlineCount: 1,
      createdBy: currentUser?.name || "방장",
      createdAt: new Date().toISOString().slice(0, 10),
      tags: data.tags || [],
      channels: [{ id: "general", name: "자유-대화방", type: "text", description: "메인 대화 채널" }],
    };

    // Save to Cloud DB
    const updatedList = await cloudStore.saveCommunity(newComm);
    setCommunities(updatedList);

    // Broadcast across tabs
    try {
      broadcastRef.current?.postMessage({ type: "NEW_COMMUNITY", payload: newComm });
    } catch {}

    // Auto join and activate
    joinCommunity(commId);
    setActiveCommunityId(commId);
    setActiveChannelId("general");

    return newComm;
  };

  const sendMessage = async (content: string, attachmentUrl?: string) => {
    if (!currentUser || !activeCommunityId) return;
    if (!content.trim() && !attachmentUrl) return;

    const newMsg: ChatMessage = {
      id: newId("msg"),
      communityId: activeCommunityId,
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPronouns: currentUser.pronouns || "",
      senderAvatar: currentUser.avatarUrl || AVATAR_PRESETS[0],
      senderRole: "멤버",
      content: content.trim(),
      timestamp: formatKoreanTime(),
      unreadCount: 0,
      reactions: [],
      isSystem: false,
      attachmentUrl,
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, newMsg]);

    // Save to Cloud DB
    await cloudStore.saveMessage(activeCommunityId, newMsg);

    // Broadcast across tabs
    try {
      broadcastRef.current?.postMessage({ type: "NEW_MESSAGE", payload: newMsg });
    } catch {}
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser || !activeCommunityId) return;

    // Optimistically update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const reactions = [...(msg.reactions || [])];
        const existingIdx = reactions.findIndex((r) => r.emoji === emoji);
        if (existingIdx >= 0) {
          const item = reactions[existingIdx];
          const hasUser = (item.users || []).includes(currentUser.id);
          const nextUsers = hasUser
            ? item.users.filter((u) => u !== currentUser.id)
            : [...item.users, currentUser.id];
          if (nextUsers.length === 0) {
            reactions.splice(existingIdx, 1);
          } else {
            reactions[existingIdx] = { ...item, users: nextUsers };
          }
        } else {
          reactions.push({ emoji, users: [currentUser.id] });
        }
        return { ...msg, reactions };
      })
    );

    // Save to Cloud DB
    await cloudStore.toggleReaction(activeCommunityId, messageId, emoji, currentUser.id);
  };

  return (
    <AppContext.Provider
      value={{
        isHydrated,
        theme,
        toggleTheme,
        chatStyle,
        setChatStyle,
        isCloudConnected: true,
        isCloudConfigModalOpen,
        setIsCloudConfigModalOpen,
        updateSupabaseCloudKeys: async () => true,
        disconnectSupabaseCloud: () => {},
        currentUser,
        authError,
        registerSiteAccount,
        loginSiteAccount,
        loginOrRegister,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
