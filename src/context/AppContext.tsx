"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  UserProfile,
  Community,
  ChatMessage,
  ChatStyleMode,
  Post,
  PostComment,
  DmMessage,
  DmConversation,
  isSuperAdmin,
  isUserBanned,
  formatBanExpiry,
  SupportInquiry,
  ReportRecord,
} from "@/types/chat";
import { analyzeMessageForReport } from "@/lib/profanityAiEngine";
import { BANNER_PRESETS, AVATAR_PRESETS } from "@/data/mockData";
import { cloudStore } from "@/lib/cloudStore";
import { filterProfanity } from "@/lib/profanityFilter";
import { compressImage } from "@/lib/imageUtils";
import { deduplicateCommunities } from "@/lib/communityUtils";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  supabaseBridge,
} from "@/lib/supabaseClient";

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

  // KakaoTalk Unread & Message Deletion & Admin Claim
  markCommunityMessagesRead: (communityId: string, messageIds: string[]) => Promise<void>;
  deleteChatMessage: (communityId: string, messageId: string) => Promise<void>;
  claimCommunityOwnership: (communityId: string) => Promise<boolean>;

  // Community Unread Notification Badges
  unreadCounts: Record<string, number>;
  recordCommunityRead: (communityId: string) => void;
  getCommunityUnreadCount: (communityId: string) => number;
  totalCommunityUnreadCount: number;

  // User Inspection & Follow
  inspectedUser: UserProfile | null;
  setInspectedUser: (user: UserProfile | null) => void;
  inspectUser: (userIdOrProfile: string | Partial<UserProfile>) => Promise<void>;
  followingIds: string[];
  followCounts: Record<string, { followers: number; following: number }>;
  toggleFollowUser: (targetUserId: string) => Promise<boolean>;
  refreshFollowCounts: (userId: string) => Promise<{ followers: number; following: number }>;
  followModalState: {
    isOpen: boolean;
    type: "followers" | "following";
    targetUser: UserProfile | null;
  };
  openFollowListModal: (type: "followers" | "following", targetUser?: UserProfile) => void;
  closeFollowListModal: () => void;
  getFollowersList: (userId: string) => Promise<UserProfile[]>;
  getFollowingList: (userId: string) => Promise<UserProfile[]>;

  // Posts & Feed
  userPosts: Post[];
  loadUserPosts: (authorId?: string) => Promise<Post[]>;
  createPost: (content: string, mediaUrl?: string, mediaType?: "image" | "video") => Promise<Post | null>;
  deletePost: (postId: string) => Promise<boolean>;
  toggleLikePost: (postId: string) => Promise<void>;
  addPostComment: (postId: string, content: string) => Promise<void>;
  uploadMediaFile: (file: File) => Promise<{ url: string; type: "image" | "video" }>;

  // 1:1 Direct Messages (DM)
  activeDmUser: UserProfile | null;
  setActiveDmUser: (user: UserProfile | null) => void;
  openDmWithUser: (user: UserProfile) => void;
  closeDm: () => void;
  dmMessages: DmMessage[];
  sendDmMessage: (content: string, attachmentUrl?: string) => Promise<void>;
  markDmMessagesRead: (otherUserId: string) => Promise<void>;
  isDmDrawerOpen: boolean;
  setIsDmDrawerOpen: (open: boolean) => void;
  dmConversations: DmConversation[];
  totalDmUnreadCount: number;

  // Support & Inquiry
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;
  submitSupportInquiry: (data: { category: string; title: string; content: string }) => Promise<{ success: boolean; error?: string }>;

  // Moderation & AI Reports
  reportingMessage: ChatMessage | null;
  setReportingMessage: (msg: ChatMessage | null) => void;
  reportMessage: (message: ChatMessage, reason: string) => Promise<{ success: boolean; verdict?: any; error?: string }>;

  // Super Admin Custom Ban
  adminBanningUser: UserProfile | null;
  setAdminBanningUser: (user: UserProfile | null) => void;
  adminBanUser: (targetUserId: string, durationMs: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  adminUnbanUser: (targetUserId: string) => Promise<{ success: boolean; error?: string }>;

  // Real-time Community Presence (n/m)
  communityActivePresences: Record<string, string[]>;
  getCommunityActiveCount: (communityId: string) => number;

  // Community Chat Volume Ranking
  communityMessageCounts: Record<string, number>;
  topRankedCommunities: Community[];
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

  // Navigation & Modal states
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isCloudConfigModalOpen, setIsCloudConfigModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string>("general");

  // Community Unread Notification Badges
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // User Profile Inspection & Follow states
  const [inspectedUser, setInspectedUser] = useState<UserProfile | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followCounts, setFollowCounts] = useState<Record<string, { followers: number; following: number }>>({});
  const [followModalState, setFollowModalState] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
    targetUser: UserProfile | null;
  }>({
    isOpen: false,
    type: "followers",
    targetUser: null,
  });

  // Posts Feed states
  const [userPosts, setUserPosts] = useState<Post[]>([]);

  // 1:1 DM states
  const [activeDmUser, setActiveDmUser] = useState<UserProfile | null>(null);
  const [dmMessages, setDmMessages] = useState<DmMessage[]>([]);
  const [isDmDrawerOpen, setIsDmDrawerOpen] = useState(false);
  const [dmConversations, setDmConversations] = useState<DmConversation[]>([]);

  // Support & Inquiry
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Moderation & AI Reports
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);

  // Super Admin Custom Ban
  const [adminBanningUser, setAdminBanningUser] = useState<UserProfile | null>(null);

  // Presence State (communityId -> userId -> timestamp)
  const [presenceMap, setPresenceMap] = useState<Record<string, Record<string, number>>>({});

  // Message Counts for communities
  const [communityMessageCounts, setCommunityMessageCounts] = useState<Record<string, number>>({});

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const activeCommunityIdRef = useRef<string | null>(null);
  activeCommunityIdRef.current = activeCommunityId;
  const currentUserRef = useRef<UserProfile | null>(null);
  currentUserRef.current = currentUser;
  const activeDmUserRef = useRef<UserProfile | null>(null);
  activeDmUserRef.current = activeDmUser;

  // Record community read timestamp and clear badge
  const recordCommunityRead = useCallback((communityId: string) => {
    if (!currentUserRef.current || !communityId) return;
    const uid = currentUserRef.current.id;
    cloudStore.recordLastRead(communityId, uid);
    setUnreadCounts((prev) => {
      if (!prev[communityId]) return prev;
      const next = { ...prev };
      delete next[communityId];
      return next;
    });
    try {
      broadcastRef.current?.postMessage({
        type: "COMMUNITY_READ",
        payload: { communityId, userId: uid },
      });
    } catch {}
  }, []);

  // Initialize from LocalStorage and Cloud
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);

      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        const savedFollowing = localStorage.getItem(`chamchi_following_${u.id}`);
        if (savedFollowing) setFollowingIds(JSON.parse(savedFollowing));
      }

      const savedJoined = localStorage.getItem(STORAGE_KEYS.JOINED);
      if (savedJoined) setJoinedCommunityIds(JSON.parse(savedJoined));

      // Restore cached communities
      const savedComms = localStorage.getItem(STORAGE_KEYS.COMMUNITIES);
      if (savedComms) {
        try {
          const parsed = JSON.parse(savedComms);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCommunities(deduplicateCommunities(parsed));
          }
        } catch {}
      }

      // Check cloud DB connection status
      const cfg = getSupabaseConfig();
      setIsCloudConnected(!!cfg && !!cfg.url && !!cfg.anonKey);
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
          setCommunities((prev) => deduplicateCommunities([payload, ...prev]));
        } else if (type === "COMMUNITY_DELETED") {
          setCommunities((prev) => prev.filter((c) => c.id !== payload));
          if (activeCommunityIdRef.current === payload) {
            setActiveCommunityId(null);
          }
        } else if (type === "COMMUNITY_CLAIMED") {
          setCommunities((prev) =>
            deduplicateCommunities(prev.map((c) => (c.id === payload.id ? payload : c)))
          );
        } else if (type === "NEW_MESSAGE") {
          const msg = payload as ChatMessage;
          if (activeCommunityIdRef.current === msg.communityId) {
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            if (currentUserRef.current) {
              cloudStore.recordLastRead(msg.communityId, currentUserRef.current.id);
            }
          } else if (msg.senderId !== currentUserRef.current?.id && !msg.isSystem) {
            // Realtime unread count bump for community card & nav badge!
            setUnreadCounts((prev) => ({
              ...prev,
              [msg.communityId]: (prev[msg.communityId] || 0) + 1,
            }));
          }
        } else if (type === "COMMUNITY_READ") {
          const { communityId, userId } = payload || {};
          if (currentUserRef.current?.id === userId) {
            setUnreadCounts((prev) => {
              if (!prev[communityId]) return prev;
              const next = { ...prev };
              delete next[communityId];
              return next;
            });
          }
        } else if (type === "MESSAGE_DELETED") {
          const { communityId, messageId } = payload || {};
          if (activeCommunityIdRef.current === communityId) {
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
        } else if (type === "NEW_DM") {
          if (
            currentUserRef.current &&
            (payload.recipientId === currentUserRef.current.id ||
              payload.senderId === currentUserRef.current.id)
          ) {
            setDmMessages((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
          }
        } else if (type === "NEW_POST") {
          setUserPosts((prev) => (prev.some((p) => p.id === payload.id) ? prev : [payload, ...prev]));
        } else if (type === "POST_DELETED") {
          setUserPosts((prev) => prev.filter((p) => p.id !== payload));
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
        } else if (type === "PRESENCE_PING") {
          const { communityId, userId, timestamp } = payload || {};
          if (communityId && userId) {
            setPresenceMap((prev) => {
              const commMap = { ...(prev[communityId] || {}) };
              commMap[userId] = timestamp || Date.now();
              return { ...prev, [communityId]: commMap };
            });
          }
        } else if (type === "USER_BANNED") {
          const { userId, bannedUntil, reason } = payload || {};
          if (currentUserRef.current?.id === userId) {
            setCurrentUser((prev) => (prev ? { ...prev, bannedUntil, banReason: reason } : null));
            alert(`⚠️ 운영 정책 위반으로 계정 활동이 일시 제한되었습니다.\n만료 일시: ${formatBanExpiry(bannedUntil)}\n사유: ${reason}`);
          }
        } else if (type === "USER_UNBANNED") {
          const { userId } = payload || {};
          if (currentUserRef.current?.id === userId) {
            setCurrentUser((prev) => {
              if (!prev) return null;
              const next = { ...prev };
              delete next.bannedUntil;
              delete next.banReason;
              return next;
            });
            alert("👑 관리자에 의해 계정 활동 정지가 해제되었습니다.");
          }
        } else if (type === "FOLLOW_TOGGLED") {
          const { followerId, followingId } = payload || {};
          if (followerId) cloudStore.getFollowCounts(followerId).then((c) => setFollowCounts((prev) => ({ ...prev, [followerId]: c })));
          if (followingId) cloudStore.getFollowCounts(followingId).then((c) => setFollowCounts((prev) => ({ ...prev, [followingId]: c })));
        }
      };
    }

    // Periodic Presence Heartbeat (every 5 seconds)
    const presenceTimer = setInterval(() => {
      const u = currentUserRef.current;
      const cId = activeCommunityIdRef.current;
      const now = Date.now();

      if (u && cId) {
        try {
          broadcastRef.current?.postMessage({
            type: "PRESENCE_PING",
            payload: { communityId: cId, userId: u.id, timestamp: now },
          });
        } catch {}

        setPresenceMap((prev) => {
          const commMap = { ...(prev[cId] || {}) };
          commMap[u.id] = now;
          return { ...prev, [cId]: commMap };
        });

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`chamchi_presence_${cId}_${u.id}`, now.toString());
          } catch {}
        }
      }

      // Cleanup presence entries older than 15s
      setPresenceMap((prev) => {
        let changed = false;
        const next: Record<string, Record<string, number>> = {};
        for (const [commKey, userMap] of Object.entries(prev)) {
          const cleanUserMap: Record<string, number> = {};
          for (const [userId, ts] of Object.entries(userMap)) {
            if (now - ts < 15000) {
              cleanUserMap[userId] = ts;
            } else {
              changed = true;
            }
          }
          next[commKey] = cleanUserMap;
        }
        return changed ? next : prev;
      });
    }, 5000);

    // Connect Supabase WebSocket Realtime for live cross-device unread notification badges
    const cfg = getSupabaseConfig();
    if (cfg && cfg.url && cfg.anonKey) {
      try {
        supabaseBridge.connectRealtime((evt) => {
          if (evt.table === "messages" && evt.record) {
            const rec = evt.record;
            const commId = rec.community_id;
            const senderId = rec.sender_id;
            const isSystem = rec.is_system;
            if (commId && senderId !== currentUserRef.current?.id && !isSystem) {
              if (activeCommunityIdRef.current === commId) {
                if (currentUserRef.current) {
                  cloudStore.recordLastRead(commId, currentUserRef.current.id);
                }
              } else {
                // Realtime badge bump without page reload!
                setUnreadCounts((prev) => ({
                  ...prev,
                  [commId]: (prev[commId] || 0) + 1,
                }));
              }
            }
          }
        });
      } catch (e) {
        console.warn("Supabase realtime init error:", e);
      }
    }

    return () => {
      clearInterval(presenceTimer);
      broadcastRef.current?.close();
      supabaseBridge.disconnectRealtime();
    };
  }, []);

  // When activeCommunityId changes to non-null, clear its unread badge
  useEffect(() => {
    if (activeCommunityId) {
      recordCommunityRead(activeCommunityId);
    }
  }, [activeCommunityId, recordCommunityRead]);

  // Sync communities periodically from cloud with non-destructive merge
  const fetchCommunities = useCallback(async () => {
    try {
      const comms = await cloudStore.loadCommunities();
      if (Array.isArray(comms) && comms.length > 0) {
        const deduped = deduplicateCommunities(comms);
        setCommunities(deduped);
        saveLocal(STORAGE_KEYS.COMMUNITIES, deduped);

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
      console.warn("Background communities sync:", err);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
    const interval = setInterval(fetchCommunities, 10000);
    const onFocus = () => fetchCommunities();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }
    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [fetchCommunities]);

  // Compute unread counts per community based on last_read_at
  const syncUnreadCounts = useCallback(async () => {
    if (!currentUserRef.current || communities.length === 0) return;
    const uid = currentUserRef.current.id;
    const newCounts: Record<string, number> = {};

    for (const comm of communities) {
      if (activeCommunityIdRef.current === comm.id) {
        newCounts[comm.id] = 0;
        continue;
      }

      const lastReadAt = cloudStore.getLastRead(comm.id, uid);
      const lastReadMs = lastReadAt ? new Date(lastReadAt).getTime() : 0;

      const member = (comm.members || []).find((m) => m.userId === uid);
      const storedJoin = typeof window !== "undefined" ? localStorage.getItem(`chamchi_join_${comm.id}_${uid}`) : null;
      const joinIso = member?.joinedAt || storedJoin;
      const joinMs = joinIso ? new Date(joinIso).getTime() - 3000 : 0;

      const cacheKey = `chamchi_messages_${comm.id}`;
      let msgs: ChatMessage[] = [];
      const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        try {
          msgs = JSON.parse(cached);
        } catch {}
      }

      const isJoined = (joinedCommunityIds || []).includes(comm.id);
      if ((!msgs || msgs.length === 0) && isJoined) {
        try {
          msgs = await cloudStore.loadMessages(comm.id);
        } catch {}
      }

      if (Array.isArray(msgs) && msgs.length > 0) {
        let count = 0;
        for (const m of msgs) {
          if (m.isSystem) continue;
          if (m.senderId === uid) continue;
          if ((m.readUserIds || []).includes(uid)) continue;

          let msgMs = 0;
          if (m.createdAt) {
            msgMs = new Date(m.createdAt).getTime();
          } else if (m.id && m.id.startsWith("msg-")) {
            msgMs = parseInt(m.id.replace("msg-", "").split("-")[0], 10) || 0;
          }

          if (joinMs > 0 && msgMs > 0 && msgMs < joinMs) continue;

          if (lastReadMs > 0) {
            if (msgMs > lastReadMs) count++;
          } else {
            count++;
          }
        }
        if (count > 0) {
          newCounts[comm.id] = count;
        }
      }
    }

    setUnreadCounts((prev) => {
      const merged = { ...prev };
      for (const [cid, cnt] of Object.entries(newCounts)) {
        merged[cid] = Math.max(merged[cid] || 0, cnt);
      }
      if (activeCommunityIdRef.current) {
        delete merged[activeCommunityIdRef.current];
      }
      return merged;
    });
  }, [communities, joinedCommunityIds]);

  useEffect(() => {
    syncUnreadCounts();
    const interval = setInterval(syncUnreadCounts, 8000);
    const onFocus = () => syncUnreadCounts();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }
    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [syncUnreadCounts]);

  const getCommunityUnreadCount = useCallback(
    (communityId: string) => {
      if (activeCommunityId === communityId) return 0;
      return unreadCounts[communityId] || 0;
    },
    [activeCommunityId, unreadCounts]
  );

  const totalCommunityUnreadCount = Object.values(unreadCounts).reduce((acc, c) => acc + (c || 0), 0);

  // Real-time Community Presence (n/m)
  const communityActivePresences = React.useMemo(() => {
    const res: Record<string, string[]> = {};
    const now = Date.now();
    for (const [cId, uMap] of Object.entries(presenceMap)) {
      const activeUids = Object.entries(uMap)
        .filter(([_, ts]) => now - ts < 15000)
        .map(([uid]) => uid);
      res[cId] = activeUids;
    }
    return res;
  }, [presenceMap]);

  const getCommunityActiveCount = useCallback(
    (communityId: string): number => {
      const userMap = presenceMap[communityId] || {};
      const now = Date.now();
      let count = 0;
      for (const [uid, ts] of Object.entries(userMap)) {
        if (now - ts < 15000) count++;
      }
      if (activeCommunityIdRef.current === communityId && count === 0) {
        count = 1;
      }
      return Math.max(1, count);
    },
    [presenceMap]
  );

  // Sync Community Message Counts & Rankings
  const syncCommunityMessageCounts = useCallback(async () => {
    if (communities.length === 0) return;
    try {
      const counts = await cloudStore.getCommunityMessageCounts(communities);
      setCommunityMessageCounts(counts);
    } catch {}
  }, [communities]);

  useEffect(() => {
    syncCommunityMessageCounts();
    const interval = setInterval(syncCommunityMessageCounts, 8000);
    return () => clearInterval(interval);
  }, [syncCommunityMessageCounts]);

  const topRankedCommunities = React.useMemo(() => {
    const deduped = deduplicateCommunities(communities || []);
    return [...deduped].sort((a, b) => {
      const countA = communityMessageCounts[a.id] || 0;
      const countB = communityMessageCounts[b.id] || 0;
      return countB - countA;
    });
  }, [communities, communityMessageCounts]);

  const checkBanAndBlock = (actionName: string): boolean => {
    if (isUserBanned(currentUserRef.current)) {
      const exp = formatBanExpiry(currentUserRef.current?.bannedUntil);
      const r = currentUserRef.current?.banReason || "운영 원칙 위반";
      alert(`⚠️ 이용 규정 위반으로 활동이 제한된 계정입니다.\n해제 일시: ${exp}\n사유: ${r}\n\n'${actionName}' 작업을 수행할 수 없습니다.`);
      return true;
    }
    return false;
  };

  // Sync messages periodically for active community
  useEffect(() => {
    if (!activeCommunityId) {
      setMessages([]);
      return;
    }

    const cacheKey = `chamchi_messages_${activeCommunityId}`;
    const cachedMsgs = localStorage.getItem(cacheKey);
    if (cachedMsgs) {
      try {
        const parsed = JSON.parse(cachedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch {}
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      try {
        const msgs = await cloudStore.loadMessages(activeCommunityId);
        if (!isCancelled && Array.isArray(msgs) && msgs.length > 0) {
          setMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            prev.forEach((m) => map.set(m.id, m));
            msgs.forEach((m) => map.set(m.id, m));
            const merged = Array.from(map.values());
            saveLocal(cacheKey, merged);
            return merged;
          });
        }
      } catch (err) {
        console.warn("Background messages sync:", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    const onFocus = () => fetchMessages();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }
    return () => {
      isCancelled = true;
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [activeCommunityId]);

  // Sync DM messages for active DM conversation
  useEffect(() => {
    if (!currentUser || !activeDmUser) {
      setDmMessages([]);
      return;
    }

    const convId = cloudStore.getDmConversationId(currentUser.id, activeDmUser.id);
    let isCancelled = false;

    const fetchDms = async () => {
      try {
        const dms = await cloudStore.loadDmMessages(convId);
        if (!isCancelled && Array.isArray(dms)) {
          setDmMessages(dms);
          const unreadForMe = dms.filter(
            (m) => m.recipientId === currentUser.id && !m.readUserIds.includes(currentUser.id)
          );
          if (unreadForMe.length > 0) {
            await cloudStore.markDmMessagesAsRead(currentUser.id, activeDmUser.id);
          }
        }
      } catch (err) {
        console.warn("Background DM sync:", err);
      }
    };

    fetchDms();
    const interval = setInterval(fetchDms, 4000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id, activeDmUser?.id]);

  // Load follows and DM list periodically
  useEffect(() => {
    if (!currentUser) return;

    const loadFollowData = async () => {
      try {
        const fList = await cloudStore.loadFollows();
        const following = fList
          .filter((f) => f.followerId === currentUser.id)
          .map((f) => f.followingId);
        setFollowingIds(following);
        saveLocal(`chamchi_following_${currentUser.id}`, following);

        const myCounts = await cloudStore.getFollowCounts(currentUser.id);
        setFollowCounts((prev) => ({ ...prev, [currentUser.id]: myCounts }));
      } catch (e) {
        console.warn("Follows load error", e);
      }
    };

    loadFollowData();
    const interval = setInterval(loadFollowData, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

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
    setActiveDmUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, ...updates };
    setCurrentUser(updated);
    saveLocal(STORAGE_KEYS.USER, updated);
    if (typeof window !== "undefined" && updated.username) {
      try {
        localStorage.setItem("chamchi_user_vault_" + updated.username.toLowerCase(), JSON.stringify(updated));
      } catch {}
    }
    await cloudStore.updateUser(updated);
  };

  const uploadAvatarOrBannerFile = async (
    bucket: "avatars" | "banners",
    file: File
  ): Promise<string> => {
    if (bucket === "avatars") {
      return await compressImage(file, 256, 256, 0.85);
    } else {
      return await compressImage(file, 900, 300, 0.85);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser?.username) {
      return { success: false, error: "로그인된 계정 정보를 확인할 수 없습니다." };
    }
    return await cloudStore.changePassword(currentUser.username, currentPassword, newPassword);
  };

  const joinCommunity = async (communityId: string): Promise<boolean> => {
    if (!currentUser) return false;

    const targetComm = communities.find((c) => c.id === communityId);
    if (targetComm && (targetComm.kickedUserIds || []).includes(currentUser.id)) {
      alert("해당 커뮤니티에서 내보내진(강퇴된) 계정이므로 입장할 수 없습니다.");
      return false;
    }

    const joinKey = `chamchi_join_${communityId}_${currentUser.id}`;
    if (typeof window !== "undefined" && !localStorage.getItem(joinKey)) {
      localStorage.setItem(joinKey, new Date().toISOString());
    }

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

    recordCommunityRead(communityId);
    setActiveDmUser(null);
    setActiveCommunityId(communityId);
    setActiveChannelId("general");
    return true;
  };

  const isCreatingRef = useRef(false);

  const createCommunity = async (data: NewCommunityInput): Promise<Community> => {
    if (checkBanAndBlock("새 커뮤니티 개설")) {
      throw new Error("활동 정지된 계정입니다.");
    }
    if (isCreatingRef.current) {
      throw new Error("이미 커뮤니티를 생성하는 중입니다.");
    }

    const normName = data.name.trim().toLowerCase();
    const existing = communities.find((c) => c.name.trim().toLowerCase() === normName);
    if (existing) {
      setActiveDmUser(null);
      recordCommunityRead(existing.id);
      setActiveCommunityId(existing.id);
      setActiveChannelId("general");
      return existing;
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

      setCommunities((prev) => deduplicateCommunities([newComm, ...prev]));

      setJoinedCommunityIds((prev) => {
        const next = prev.includes(commId) ? prev : [...prev, commId];
        saveLocal(STORAGE_KEYS.JOINED, next);
        return next;
      });

      setActiveDmUser(null);
      recordCommunityRead(commId);
      setActiveCommunityId(commId);
      setActiveChannelId("general");

      const updatedList = await cloudStore.saveCommunity(newComm);
      const deduped = deduplicateCommunities(updatedList);
      setCommunities(deduped);
      saveLocal(STORAGE_KEYS.COMMUNITIES, deduped);

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

    try {
      broadcastRef.current?.postMessage({
        type: "MEMBER_KICKED",
        payload: { communityId, userId: targetUserId, targetName },
      });
    } catch {}

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
    if (checkBanAndBlock("메시지 전송")) return;
    if (!content.trim() && !attachmentUrl) return;

    const activeComm = communities.find((c) => c.id === activeCommunityId);
    const isOwner =
      !!activeComm &&
      (activeComm.createdById === currentUser.id ||
        activeComm.createdBy === currentUser.name ||
        (!!currentUser.username && activeComm.createdBy === currentUser.username));

    const newMsg: ChatMessage = {
      id: newId("msg"),
      communityId: activeCommunityId,
      channelId: activeChannelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderPronouns: currentUser.pronouns || "",
      senderAvatar: currentUser.avatarUrl || AVATAR_PRESETS[0],
      senderRole: isSuperAdmin(currentUser) ? "관리자" : isOwner ? "방장" : "멤버",
      content: filterProfanity(content.trim()),
      timestamp: formatKoreanTime(),
      createdAt: new Date().toISOString(),
      readUserIds: [currentUser.id],
      unreadCount: 0,
      reactions: [],
      isSystem: false,
      attachmentUrl,
    };

    setMessages((prev) => [...prev, newMsg]);
    cloudStore.recordLastRead(activeCommunityId, currentUser.id);
    recordCommunityRead(activeCommunityId);

    await cloudStore.saveMessage(activeCommunityId, newMsg);

    try {
      broadcastRef.current?.postMessage({ type: "NEW_MESSAGE", payload: newMsg });
    } catch {}
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser || !activeCommunityId) return;

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

    await cloudStore.toggleReaction(activeCommunityId, messageId, emoji, currentUser.id);
  };

  // KakaoTalk Unread & Message Deletion & Admin Claim
  const markCommunityMessagesRead = useCallback(async (communityId: string, messageIds: string[]) => {
    if (!currentUserRef.current || !messageIds || messageIds.length === 0) return;
    const uid = currentUserRef.current.id;
    setMessages((prev) =>
      prev.map((m) => {
        if (!messageIds.includes(m.id)) return m;
        const readUsers = m.readUserIds || [m.senderId];
        if (!readUsers.includes(uid)) {
          return { ...m, readUserIds: [...readUsers, uid] };
        }
        return m;
      })
    );
    cloudStore.recordLastRead(communityId, uid);
    await cloudStore.markMessagesAsRead(communityId, messageIds, uid);
  }, []);

  const deleteChatMessage = async (communityId: string, messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    await cloudStore.deleteMessage(communityId, messageId);
    try {
      broadcastRef.current?.postMessage({
        type: "MESSAGE_DELETED",
        payload: { communityId, messageId },
      });
    } catch {}
  };

  const claimCommunityOwnership = async (communityId: string): Promise<boolean> => {
    if (!currentUser || !isSuperAdmin(currentUser)) return false;
    const updated = await cloudStore.claimCommunityOwnership(communityId, currentUser.id, currentUser.name);
    if (!updated) return false;
    setCommunities((prev) => deduplicateCommunities(prev.map((c) => (c.id === communityId ? updated : c))));
    try {
      broadcastRef.current?.postMessage({ type: "COMMUNITY_CLAIMED", payload: updated });
    } catch {}
    return true;
  };

  // User Profile Inspection & Follow
  const inspectUser = async (userIdOrProfile: string | Partial<UserProfile>) => {
    if (typeof userIdOrProfile === "object" && userIdOrProfile !== null && "id" in userIdOrProfile) {
      const p = userIdOrProfile as UserProfile;
      setInspectedUser(p);
      return;
    }
    const uid = String(userIdOrProfile);

    // 1. Try to fetch from cloudStore user vault
    try {
      const full = await cloudStore.loadSingleUser(uid);
      if (full) {
        setInspectedUser(full);
        return;
      }
      const dir = await cloudStore.loadUsersDirectory();
      for (const u of Object.values(dir)) {
        if (u.id === uid || u.username.toLowerCase() === uid.toLowerCase()) {
          setInspectedUser(u);
          return;
        }
      }
    } catch {}

    for (const comm of communities) {
      const found = (comm.members || []).find((m) => m.userId === uid || m.username === uid);
      if (found) {
        setInspectedUser({
          id: found.userId,
          username: found.username || found.name,
          name: found.name,
          pronouns: found.pronouns,
          avatarUrl: found.avatarUrl,
          bannerUrl: "",
          bannerColor: "from-indigo-600 to-purple-600",
          bio: "",
          statusMessage: "",
          status: "online",
          createdAt: found.joinedAt,
          authProvider: "site",
        });
        return;
      }
    }
    // Fallback
    setInspectedUser({
      id: uid,
      username: uid,
      name: uid,
      pronouns: "",
      avatarUrl: AVATAR_PRESETS[0],
      bannerUrl: "",
      bannerColor: "from-indigo-600 to-purple-600",
      bio: "",
      statusMessage: "",
      status: "online",
      createdAt: new Date().toISOString(),
      authProvider: "site",
    });
  };

  const toggleFollowUser = async (targetUserId: string): Promise<boolean> => {
    if (!currentUser || currentUser.id === targetUserId) return false;
    if (checkBanAndBlock("팔로우")) return false;
    const res = await cloudStore.toggleFollow(currentUser.id, targetUserId);
    const isNowFollowing = res.isFollowing;
    setFollowingIds((prev) => {
      const next = isNowFollowing
        ? Array.from(new Set([...prev, targetUserId]))
        : prev.filter((id) => id !== targetUserId);
      saveLocal(`chamchi_following_${currentUser.id}`, next);
      return next;
    });

    const myCounts = await cloudStore.getFollowCounts(currentUser.id);
    setFollowCounts((prev) => ({
      ...prev,
      [currentUser.id]: { followers: myCounts.followers, following: myCounts.following },
      [targetUserId]: { followers: res.followersCount, following: res.followingCount },
    }));

    try {
      broadcastRef.current?.postMessage({
        type: "FOLLOW_TOGGLED",
        payload: { followerId: currentUser.id, followingId: targetUserId },
      });
    } catch {}

    return isNowFollowing;
  };

  const refreshFollowCounts = useCallback(async (userId: string) => {
    try {
      const counts = await cloudStore.getFollowCounts(userId, currentUserRef.current?.id);
      setFollowCounts((prev) => ({
        ...prev,
        [userId]: { followers: counts.followers, following: counts.following },
      }));
      return counts;
    } catch {
      return { followers: 0, following: 0, isFollowing: false };
    }
  }, []);

  const openFollowListModal = useCallback((type: "followers" | "following", targetUser?: UserProfile) => {
    const userToUse = targetUser || inspectedUser || currentUserRef.current;
    if (!userToUse) return;
    setFollowModalState({
      isOpen: true,
      type,
      targetUser: userToUse,
    });
  }, [inspectedUser]);

  const closeFollowListModal = useCallback(() => {
    setFollowModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const getFollowersList = useCallback(async (userId: string): Promise<UserProfile[]> => {
    return cloudStore.getFollowers(userId);
  }, []);

  const getFollowingList = useCallback(async (userId: string): Promise<UserProfile[]> => {
    return cloudStore.getFollowing(userId);
  }, []);

  // Posts Feed
  const loadUserPosts = async (authorId?: string): Promise<Post[]> => {
    const list = await cloudStore.loadPosts(authorId);
    setUserPosts(list);
    return list;
  };

  const createPost = async (
    content: string,
    mediaUrl?: string,
    mediaType?: "image" | "video"
  ): Promise<Post | null> => {
    if (!currentUser) return null;
    if (checkBanAndBlock("피드 게시물 작성")) return null;
    const newPost: Post = {
      id: newId("post"),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl || AVATAR_PRESETS[0],
      authorPronouns: currentUser.pronouns || "",
      content: filterProfanity(content.trim()),
      mediaUrl,
      mediaType: mediaType || (mediaUrl ? "image" : undefined),
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
    };
    setUserPosts((prev) => [newPost, ...prev]);
    const updated = await cloudStore.savePost(newPost);
    setUserPosts(updated);
    try {
      broadcastRef.current?.postMessage({ type: "NEW_POST", payload: newPost });
    } catch {}
    return newPost;
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
    await cloudStore.deletePost(postId);
    try {
      broadcastRef.current?.postMessage({ type: "POST_DELETED", payload: postId });
    } catch {}
    return true;
  };

  const toggleLikePost = async (postId: string) => {
    if (!currentUser) return;
    if (checkBanAndBlock("좋아요")) return;
    setUserPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasLiked = (p.likes || []).includes(currentUser.id);
        const nextLikes = hasLiked
          ? p.likes.filter((id) => id !== currentUser.id)
          : [...(p.likes || []), currentUser.id];
        return { ...p, likes: nextLikes };
      })
    );
    await cloudStore.toggleLikePost(postId, currentUser.id);
  };

  const addPostComment = async (postId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    if (checkBanAndBlock("댓글 작성")) return;
    const comment: PostComment = {
      id: newId("cmt"),
      postId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl || AVATAR_PRESETS[0],
      authorPronouns: currentUser.pronouns || "",
      content: filterProfanity(content.trim()),
      createdAt: new Date().toISOString(),
    };
    setUserPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p))
    );
    await cloudStore.addComment(postId, comment);
  };

  const uploadMediaFile = async (file: File): Promise<{ url: string; type: "image" | "video" }> => {
    if (file.type.startsWith("video/")) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: reader.result as string, type: "video" });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      const compressed = await compressImage(file, 1024, 1024, 0.85);
      return { url: compressed, type: "image" };
    }
  };

  // 1:1 Direct Messages (DM)
  const openDmWithUser = (user: UserProfile) => {
    setActiveDmUser(user);
    setActiveCommunityId(null);
    setIsDrawerOpen(false);
    setIsDmDrawerOpen(false);
  };

  const closeDm = () => {
    setActiveDmUser(null);
  };

  const sendDmMessage = async (content: string, attachmentUrl?: string) => {
    if (!currentUser || !activeDmUser) return;
    if (checkBanAndBlock("1:1 DM 전송")) return;
    if (!content.trim() && !attachmentUrl) return;

    const convId = cloudStore.getDmConversationId(currentUser.id, activeDmUser.id);
    const newDm: DmMessage = {
      id: newId("dm"),
      conversationId: convId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl || AVATAR_PRESETS[0],
      senderPronouns: currentUser.pronouns || "",
      recipientId: activeDmUser.id,
      recipientName: activeDmUser.name,
      recipientAvatar: activeDmUser.avatarUrl || AVATAR_PRESETS[0],
      content: filterProfanity(content.trim()),
      attachmentUrl,
      readUserIds: [currentUser.id],
      timestamp: formatKoreanTime(),
      createdAt: new Date().toISOString(),
    };

    setDmMessages((prev) => [...prev, newDm]);
    await cloudStore.saveDmMessage(newDm);

    try {
      broadcastRef.current?.postMessage({ type: "NEW_DM", payload: newDm });
    } catch {}
  };

  const markDmMessagesRead = async (otherUserId: string) => {
    if (!currentUser) return;
    setDmMessages((prev) =>
      prev.map((m) => {
        if (m.recipientId === currentUser.id && !m.readUserIds.includes(currentUser.id)) {
          return { ...m, readUserIds: [...m.readUserIds, currentUser.id] };
        }
        return m;
      })
    );
    await cloudStore.markDmMessagesAsRead(currentUser.id, otherUserId);
  };

  const deleteCommunity = async (communityId: string): Promise<boolean> => {
    setCommunities((prev) => {
      const next = prev.filter((c) => c.id !== communityId);
      saveLocal(STORAGE_KEYS.COMMUNITIES, next);
      return next;
    });
    setJoinedCommunityIds((prev) => {
      const next = prev.filter((id) => id !== communityId);
      saveLocal(STORAGE_KEYS.JOINED, next);
      return next;
    });

    if (activeCommunityIdRef.current === communityId) {
      setActiveCommunityId(null);
    }

    try {
      broadcastRef.current?.postMessage({ type: "COMMUNITY_DELETED", payload: communityId });
    } catch {}

    await cloudStore.deleteCommunity(communityId);
    return true;
  };

  const updateSupabaseCloudKeys = async (url: string, key: string) => {
    saveSupabaseConfig(url, key);
    setIsCloudConnected(true);
    const comms = await cloudStore.loadCommunities();
    if (Array.isArray(comms) && comms.length > 0) {
      setCommunities(comms);
      saveLocal(STORAGE_KEYS.COMMUNITIES, comms);
    }
    return true;
  };

  const disconnectSupabaseCloud = () => {
    clearSupabaseConfig();
    setIsCloudConnected(false);
  };

  const totalDmUnreadCount = dmConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const submitSupportInquiry = async (data: {
    category: string;
    title: string;
    content: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: "로그인이 필요합니다." };
    }
    try {
      const inq: SupportInquiry = {
        id: newId("inq"),
        userId: currentUser.id,
        userName: currentUser.name,
        userUsername: currentUser.username,
        category: data.category,
        title: data.title,
        content: data.content,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      await cloudStore.submitSupportInquiry(inq);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "문의 접수 실패" };
    }
  };

  const reportMessage = async (
    message: ChatMessage,
    reason: string
  ): Promise<{ success: boolean; verdict?: any; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: "로그인이 필요합니다." };
    }
    try {
      const verdict = analyzeMessageForReport(message.content, reason);
      const reportRec: ReportRecord = {
        id: newId("rep"),
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        targetUserId: message.senderId,
        targetUserName: message.senderName,
        messageId: message.id,
        messageContent: message.content,
        communityId: message.communityId,
        reason,
        aiVerdict: verdict,
        createdAt: new Date().toISOString(),
        status: verdict.isViolation ? "auto_actioned" : "pending",
      };

      await cloudStore.submitReport(reportRec);

      if (verdict.isViolation) {
        await cloudStore.banUser(message.senderId, verdict.bannedDays, verdict.reason);
        const bannedUntil = new Date(Date.now() + verdict.bannedDays * 24 * 60 * 60 * 1000).toISOString();

        try {
          broadcastRef.current?.postMessage({
            type: "USER_BANNED",
            payload: {
              userId: message.senderId,
              bannedUntil,
              reason: verdict.reason,
            },
          });
        } catch {}

        if (inspectedUser?.id === message.senderId) {
          setInspectedUser((prev) => (prev ? { ...prev, bannedUntil, banReason: verdict.reason } : null));
        }

        if (currentUser.id === message.senderId) {
          setCurrentUser((prev) => (prev ? { ...prev, bannedUntil, banReason: verdict.reason } : null));
        }
      }

      return { success: true, verdict };
    } catch (err: any) {
      return { success: false, error: err.message || "신고 처리에 실패했습니다." };
    }
  };

  const adminBanUser = async (
    targetUserId: string,
    durationMs: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "최고 관리자 권한이 필요합니다." };
    }
    try {
      const updated = await cloudStore.adminCustomBanUser(targetUserId, durationMs, reason);
      if (inspectedUser?.id === targetUserId) {
        setInspectedUser(updated);
      }
      const bannedUntil = new Date(Date.now() + durationMs).toISOString();
      try {
        broadcastRef.current?.postMessage({
          type: "USER_BANNED",
          payload: { userId: targetUserId, bannedUntil, reason },
        });
      } catch {}
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const adminUnbanUser = async (
    targetUserId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || !isSuperAdmin(currentUser)) {
      return { success: false, error: "최고 관리자 권한이 필요합니다." };
    }
    try {
      const updated = await cloudStore.unbanUser(targetUserId);
      if (inspectedUser?.id === targetUserId) {
        setInspectedUser(updated);
      }
      try {
        broadcastRef.current?.postMessage({
          type: "USER_UNBANNED",
          payload: { userId: targetUserId },
        });
      } catch {}
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
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
        markCommunityMessagesRead,
        deleteChatMessage,
        claimCommunityOwnership,
        unreadCounts,
        recordCommunityRead,
        getCommunityUnreadCount,
        totalCommunityUnreadCount,
        inspectedUser,
        setInspectedUser,
        inspectUser,
        followingIds,
        followCounts,
        toggleFollowUser,
        refreshFollowCounts,
        followModalState,
        openFollowListModal,
        closeFollowListModal,
        getFollowersList,
        getFollowingList,
        userPosts,
        loadUserPosts,
        createPost,
        deletePost,
        toggleLikePost,
        addPostComment,
        uploadMediaFile,
        activeDmUser,
        setActiveDmUser,
        openDmWithUser,
        closeDm,
        dmMessages,
        sendDmMessage,
        markDmMessagesRead,
        isDmDrawerOpen,
        setIsDmDrawerOpen,
        dmConversations,
        totalDmUnreadCount,
        isSupportModalOpen,
        setIsSupportModalOpen,
        submitSupportInquiry,
        reportingMessage,
        setReportingMessage,
        reportMessage,
        adminBanningUser,
        setAdminBanningUser,
        adminBanUser,
        adminUnbanUser,
        communityActivePresences,
        getCommunityActiveCount,
        communityMessageCounts,
        topRankedCommunities,
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
