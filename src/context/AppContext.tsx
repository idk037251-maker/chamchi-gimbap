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
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
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
  joinCommunity: (communityId: string) => Promise<boolean>;
  createCommunity: (data: NewCommunityInput) => Promise<Community>;
  deleteCommunity: (communityId: string) => Promise<boolean>;
  kickMember: (communityId: string, targetUserId: string, targetName?: string) => Promise<boolean>;
  messages: ChatMessage[];
  sendMessage: (content: string, attachmentUrl?: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "chamchi_site_user_v1",
  COMMUNITIES: "chamchi_communities_v1",
  MESSAGES: "chamchi_messages_v1",
  JOINED: "chamchi_joined_v1",
  THEME: "chamchi_theme_v1",
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
  const currentUserRef = useRef<UserProfile | null>(null);
  currentUserRef.current = currentUser;

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
      const bc = new BroadcastChannel("chamchi_sync_channel");
      broadcastRef.current = bc;
      bc.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === "NEW_COMMUNITY") {
          setCommunities((prev) => (prev.some((c) => c.id === payload.id) ? prev : [payload, ...prev]));
        } else if (type === "COMMUNITY_DELETED") {
          setCommunities((prev) => prev.filter((c) => c.id !== payload));
          if (activeCommunityIdRef.current === payload) {
            setActiveCommunityId(null);
          }
        } else if (type === "NEW_MESSAGE") {
          if (activeCommunityIdRef.current === payload.communityId) {
            setMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
          }
        } else if (type === "MEMBER_KICKED") {
          const { communityId, userId } = payload || {};
          setCommunities((prev) =>
            prev.map((c) => {
              if (c.id !== communityId) return c;
              const nextMembers = (c.members || []).filter((m) => m.userId !== userId);
              const nextKicked = Array.from(new Set([...(c.kickedUserIds || []), userId]));
              return {
                ...c,
                members: nextMembers,
                kickedUserIds: nextKicked,
                memberCount: Math.max(1, nextMembers.length),
              };
            })
          );
          if (currentUserRef.current?.id === userId && activeCommunityIdRef.current === communityId) {
            setActiveCommunityId(null);
            setJoinedCommunityIds((prev) => {
              const next = prev.filter((id) => id !== communityId);
              saveLocal(STORAGE_KEYS.JOINED, next);
              return next;
            });
            alert("커뮤니티 관리자에 의해 이 방에서 내보내졌습니다.");
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
          if (activeCommunityIdRef.current && currentUserRef.current) {
            const activeComm = comms.find((c) => c.id === activeCommunityIdRef.current);
            if (activeComm && (activeComm.kickedUserIds || []).includes(currentUserRef.current.id)) {
              setActiveCommunityId(null);
              setJoinedCommunityIds((prev) => {
                const next = prev.filter((id) => id !== activeCommunityIdRef.current);
                saveLocal(STORAGE_KEYS.JOINED, next);
                return next;
              });
              alert("커뮤니티 관리자에 의해 이 방에서 내보내졌습니다.");
            }
          }
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

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser?.username) {
      return { success: false, error: "로그인된 계정 정보를 확인할 수 없습니다." };
    }
    return await cloudStore.changePassword(currentUser.username, currentPassword, newPassword);
  };

  const joinCommunity = async (communityId: string): Promise<boolean> => {
    if (!currentUser) return false;

    // Check if user is kicked from this community
    const targetComm = communities.find((c) => c.id === communityId);
    if (targetComm && (targetComm.kickedUserIds || []).includes(currentUser.id)) {
      alert("해당 커뮤니티에서 내보내진(강퇴된) 계정이므로 입장할 수 없습니다.");
      return false;
    }

    // Call cloudStore to add to members and persist
    const res = await cloudStore.joinCommunity(communityId, {
      userId: currentUser.id,
      username: currentUser.username,
      name: currentUser.name,
      pronouns: currentUser.pronouns,
      avatarUrl: currentUser.avatarUrl,
    });

    if (!res.success) {
      alert(res.error || "입장 처리에 실패했습니다.");
      return false;
    }

    if (res.community) {
      const updated = res.community;
      setCommunities((prev) => prev.map((c) => (c.id === communityId ? updated : c)));
    }

    setJoinedCommunityIds((prev) => {
      const next = prev.includes(communityId) ? prev : [...prev, communityId];
      saveLocal(STORAGE_KEYS.JOINED, next);
      return next;
    });

    // Immediately navigate to the community's chat room!
    setActiveCommunityId(communityId);
    setActiveChannelId("general");
    return true;
  };

  const isCreatingRef = useRef(false);

  const createCommunity = async (data: NewCommunityInput): Promise<Community> => {
    if (isCreatingRef.current) {
      throw new Error("이미 커뮤니티를 생성하는 중입니다.");
    }
    isCreatingRef.current = true;

    try {
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
        createdById: currentUser?.id,
        createdAt: new Date().toISOString().slice(0, 10),
        tags: data.tags || [],
        channels: [{ id: "general", name: "자유-대화방", type: "text", description: "메인 대화 채널" }],
        members: currentUser
          ? [
              {
                userId: currentUser.id,
                username: currentUser.username,
                name: currentUser.name,
                pronouns: currentUser.pronouns,
                avatarUrl: currentUser.avatarUrl,
                role: "방장",
                joinedAt: new Date().toISOString(),
              },
            ]
          : [],
        kickedUserIds: [],
      };

      // 1. Optimistically add to state and immediately switch to chat view
      setCommunities((prev) => {
        if (prev.some((c) => c.id === commId || c.name.trim() === newComm.name.trim())) {
          return prev;
        }
        return [newComm, ...prev];
      });

      setJoinedCommunityIds((prev) => {
        const next = prev.includes(commId) ? prev : [...prev, commId];
        saveLocal(STORAGE_KEYS.JOINED, next);
        return next;
      });

      setActiveCommunityId(commId);
      setActiveChannelId("general");

      // 2. Persist to Cloud DB
      const updatedList = await cloudStore.saveCommunity(newComm);
      setCommunities(updatedList);

      // 3. Broadcast across tabs
      try {
        broadcastRef.current?.postMessage({ type: "NEW_COMMUNITY", payload: newComm });
      } catch {}

      return newComm;
    } finally {
      isCreatingRef.current = false;
    }
  };

  const kickMember = async (
    communityId: string,
    targetUserId: string,
    targetName?: string
  ): Promise<boolean> => {
    const res = await cloudStore.kickMember(communityId, targetUserId, targetName);
    if (!res.success) {
      alert(res.error || "강퇴 처리에 실패했습니다.");
      return false;
    }

    if (res.community) {
      const updated = res.community;
      setCommunities((prev) => prev.map((c) => (c.id === communityId ? updated : c)));
    }

    // Broadcast kick across all tabs
    try {
      broadcastRef.current?.postMessage({
        type: "MEMBER_KICKED",
        payload: { communityId, userId: targetUserId, targetName },
      });
    } catch {}

    // If local user is targetUserId, kick out
    if (currentUser?.id === targetUserId && activeCommunityId === communityId) {
      setActiveCommunityId(null);
      setJoinedCommunityIds((prev) => {
        const next = prev.filter((id) => id !== communityId);
        saveLocal(STORAGE_KEYS.JOINED, next);
        return next;
      });
      alert("커뮤니티 관리자에 의해 이 방에서 내보내졌습니다.");
    }

    return true;
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

  const deleteCommunity = async (communityId: string): Promise<boolean> => {
    // 1. Optimistic removal from state
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
    setJoinedCommunityIds((prev) => {
      const next = prev.filter((id) => id !== communityId);
      saveLocal(STORAGE_KEYS.JOINED, next);
      return next;
    });

    if (activeCommunityIdRef.current === communityId) {
      setActiveCommunityId(null);
    }

    // 2. Broadcast across tabs
    try {
      broadcastRef.current?.postMessage({ type: "COMMUNITY_DELETED", payload: communityId });
    } catch {}

    // 3. Cascade delete in Cloud DB
    await cloudStore.deleteCommunity(communityId);
    return true;
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
        changePassword,
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
        deleteCommunity,
        kickMember,
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
