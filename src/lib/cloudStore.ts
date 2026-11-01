import { Community, ChatMessage, UserProfile } from "@/types/chat";
import { getSupabaseConfig, SupabaseConfig } from "./supabaseClient";
import { deduplicateCommunities } from "./communityUtils";

export interface StoredUser extends UserProfile {
  password: string;
}

const CLOUD_FALLBACK_BASE = "https://kvdb.io/UJi5qrxjVL5oMcMYSXCvLC";

const CACHE_KEYS = {
  COMMUNITIES: "chamchi_communities_v1",
  MESSAGES_PREFIX: "chamchi_messages_v1_",
  USER_VAULT_PREFIX: "chamchi_user_vault_",
  USERS_DIRECTORY: "chamchi_users_directory",
};

function getLocalCache<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalCache(key: string, value: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function formatKoreanTime(dateObj = new Date()) {
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "오후" : "오전";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${period} ${displayHour}:${minutes}`;
}

function mapDbCommunityToModel(row: any): Community {
  return {
    id: row.id,
    name: row.name || "",
    description: row.description || "",
    rules: Array.isArray(row.rules) ? row.rules : [],
    category: row.category || "자유 / 소통",
    iconEmoji: row.icon_emoji || row.iconEmoji || "💬",
    bannerGradient: row.banner_gradient || row.bannerGradient || "linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)",
    memberCount: typeof row.member_count === "number" ? row.member_count : (row.memberCount || 1),
    onlineCount: typeof row.online_count === "number" ? row.online_count : (row.onlineCount || 1),
    createdBy: row.created_by || row.createdBy || "방장",
    createdById: row.created_by_id || row.createdById,
    createdAt: row.created_at || row.createdAt || new Date().toISOString().slice(0, 10),
    tags: Array.isArray(row.tags) ? row.tags : [],
    channels: Array.isArray(row.channels) ? row.channels : [{ id: "general", name: "자유-대화방", type: "text", description: "메인 대화 채널" }],
    members: Array.isArray(row.members) ? row.members : [],
    kickedUserIds: Array.isArray(row.kicked_user_ids) ? row.kicked_user_ids : (Array.isArray(row.kickedUserIds) ? row.kickedUserIds : []),
  };
}

function mapModelToDbCommunity(model: Community): any {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    rules: model.rules,
    category: model.category,
    icon_emoji: model.iconEmoji,
    banner_gradient: model.bannerGradient,
    member_count: model.memberCount,
    online_count: model.onlineCount,
    created_by: model.createdBy,
    created_by_id: model.createdById,
    members: model.members || [],
    kicked_user_ids: model.kickedUserIds || [],
    tags: model.tags || [],
    channels: model.channels || [],
  };
}

function mapDbMessageToModel(row: any): ChatMessage {
  const dateObj = row.created_at ? new Date(row.created_at) : new Date();
  return {
    id: row.id,
    communityId: row.community_id || row.communityId,
    channelId: row.channel_id || row.channelId || "general",
    senderId: row.sender_id || row.senderId,
    senderName: row.sender_name || row.senderName,
    senderPronouns: row.sender_pronouns || row.senderPronouns || "",
    senderAvatar: row.sender_avatar || row.senderAvatar || "",
    senderRole: row.sender_role || row.senderRole || "멤버",
    content: row.content || "",
    timestamp: row.timestamp || formatKoreanTime(dateObj),
    createdAt: row.created_at || row.createdAt || dateObj.toISOString(),
    unreadCount: row.unread_count || row.unreadCount || 0,
    reactions: Array.isArray(row.reactions) ? row.reactions : [],
    isSystem: !!row.is_system || !!row.isSystem,
    attachmentUrl: row.attachment_url || row.attachmentUrl || undefined,
  };
}

function mapModelToDbMessage(msg: ChatMessage): any {
  return {
    id: msg.id,
    community_id: msg.communityId,
    channel_id: msg.channelId || "general",
    sender_id: msg.senderId,
    sender_name: msg.senderName,
    sender_pronouns: msg.senderPronouns || "",
    sender_avatar: msg.senderAvatar || "",
    sender_role: msg.senderRole || "멤버",
    content: msg.content || "",
    unread_count: msg.unreadCount || 0,
    reactions: msg.reactions || [],
    attachment_url: msg.attachmentUrl || "",
    is_system: !!msg.isSystem,
    created_at: msg.createdAt || new Date().toISOString(),
  };
}

function supabaseHeaders(cfg: SupabaseConfig, extra: Record<string, string> = {}) {
  const h: Record<string, string> = {
    apikey: cfg.anonKey,
    ...extra,
  };
  if (cfg.anonKey.startsWith("eyJ")) {
    h.Authorization = `Bearer ${cfg.anonKey}`;
  }
  return h;
}

export const cloudStore = {
  // ------------------------------------------------------------- User Accounts
  async loadUsers(): Promise<Record<string, StoredUser>> {
    const cachedUsers = getLocalCache<Record<string, StoredUser>>(CACHE_KEYS.USERS_DIRECTORY, {});
    const cfg = getSupabaseConfig();

    if (cfg) {
      try {
        const res = await fetch(`${cfg.url}/rest/v1/profiles?select=*`, {
          headers: supabaseHeaders(cfg),
        });
        if (res.ok) {
          const rows = await res.json();
          const userMap: Record<string, StoredUser> = { ...cachedUsers };
          rows.forEach((r: any) => {
            if (r.username) {
              userMap[r.username.toLowerCase()] = {
                id: r.id,
                username: r.username.toLowerCase(),
                email: r.email || `${r.username}@chamchi-gimbap.local`,
                password: r.password_hash || "",
                name: r.name || r.username,
                pronouns: r.pronouns || "지정 안 됨",
                avatarUrl: r.avatar_url || "",
                bannerUrl: r.banner_url || "",
                bannerColor: r.banner_color || "linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)",
                bio: r.bio || "",
                statusMessage: r.status_message || "",
                status: (r.status as any) || "online",
                createdAt: r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
                authProvider: "site",
              };
            }
          });
          setLocalCache(CACHE_KEYS.USERS_DIRECTORY, userMap);
          return userMap;
        }
      } catch (e) {
        console.warn("Supabase loadUsers error, falling back to cache", e);
      }
      return cachedUsers;
    }

    // Cloud fallback with cache protection
    try {
      const res = await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_users?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        const merged = { ...cachedUsers, ...data };
        setLocalCache(CACHE_KEYS.USERS_DIRECTORY, merged);
        return merged;
      }
    } catch {}

    return cachedUsers;
  },

  async loadSingleUser(uname: string): Promise<StoredUser | null> {
    const key = uname.trim().toLowerCase();
    const localVault = getLocalCache<StoredUser | null>(CACHE_KEYS.USER_VAULT_PREFIX + key, null);

    const cfg = getSupabaseConfig();
    if (cfg) {
      try {
        const res = await fetch(
          `${cfg.url}/rest/v1/profiles?username=eq.${encodeURIComponent(key)}&select=*&limit=1`,
          { headers: supabaseHeaders(cfg) }
        );
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows[0]) {
            const r = rows[0];
            const user: StoredUser = {
              id: r.id,
              username: key,
              email: r.email,
              password: r.password_hash || "",
              name: r.name || key,
              pronouns: r.pronouns || "지정 안 됨",
              avatarUrl: r.avatar_url || "",
              bannerUrl: r.banner_url || "",
              bannerColor: r.banner_color || "linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)",
              bio: r.bio || "",
              statusMessage: r.status_message || "",
              status: (r.status as any) || "online",
              createdAt: r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
              authProvider: "site",
            };
            setLocalCache(CACHE_KEYS.USER_VAULT_PREFIX + key, user);
            return user;
          }
        }
      } catch (e) {
        console.warn("Supabase loadSingleUser error", e);
      }
      return localVault;
    }

    // Fallback cloud
    try {
      const res = await fetch(
        `${CLOUD_FALLBACK_BASE}/chamchi_user_${encodeURIComponent(key)}?_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const user = await res.json();
        setLocalCache(CACHE_KEYS.USER_VAULT_PREFIX + key, user);
        return user;
      }
    } catch {}

    return localVault;
  },

  async saveSingleUser(uname: string, user: StoredUser): Promise<void> {
    const key = uname.trim().toLowerCase();
    setLocalCache(CACHE_KEYS.USER_VAULT_PREFIX + key, user);

    const cfg = getSupabaseConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.url}/rest/v1/profiles`, {
          method: "POST",
          headers: supabaseHeaders(cfg, {
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          }),
          body: JSON.stringify({
            id: user.id,
            username: key,
            password_hash: user.password,
            email: user.email || `${key}@chamchi-gimbap.local`,
            name: user.name,
            pronouns: user.pronouns,
            avatar_url: user.avatarUrl,
            banner_url: user.bannerUrl,
            banner_color: user.bannerColor,
            bio: user.bio,
            status_message: user.statusMessage,
            status: user.status,
            updated_at: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.warn("Failed to save profile to Supabase", e);
      }
      return;
    }

    try {
      await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_user_${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
    } catch {}
  },

  async registerUser(userData: {
    username: string;
    password: string;
    name: string;
    pronouns: string;
    avatarUrl: string;
    bannerUrl: string;
    bannerColor: string;
    bio: string;
    statusMessage: string;
  }): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    try {
      const uname = userData.username.trim().toLowerCase();
      if (!uname) return { success: false, error: "아이디를 입력해 주세요." };

      const existingSingle = await this.loadSingleUser(uname);
      if (existingSingle) {
        return { success: false, error: "이미 사용 중인 아이디입니다." };
      }

      const users = await this.loadUsers();
      if (users[uname]) {
        return { success: false, error: "이미 사용 중인 아이디입니다." };
      }

      const newUser: StoredUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        username: uname,
        email: `${uname}@chamchi-gimbap.local`,
        password: userData.password,
        name: userData.name.trim() || uname,
        pronouns: userData.pronouns.trim() || "지정 안 됨",
        avatarUrl: userData.avatarUrl,
        bannerUrl: userData.bannerUrl,
        bannerColor: userData.bannerColor,
        bio: userData.bio.trim() || "반갑습니다! 참치김밥 커뮤니티입니다 🍙",
        statusMessage: userData.statusMessage.trim() || "온라인",
        status: "online",
        createdAt: new Date().toISOString().slice(0, 10),
        authProvider: "site",
      };

      await this.saveSingleUser(uname, newUser);

      users[uname] = newUser;
      setLocalCache(CACHE_KEYS.USERS_DIRECTORY, users);

      try {
        await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(users),
        });
      } catch {}

      const { password, ...safeUser } = newUser;
      return { success: true, user: safeUser };
    } catch (err: any) {
      return { success: false, error: "회원가입 처리 실패: " + err.message };
    }
  },

  async loginUser(
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    try {
      const uname = username.trim().toLowerCase();
      if (!uname) return { success: false, error: "아이디를 입력해 주세요." };

      let found = await this.loadSingleUser(uname);
      if (!found) {
        const users = await this.loadUsers();
        found = users[uname];
      }

      if (!found) {
        return { success: false, error: "존재하지 않는 아이디입니다." };
      }
      if (found.password !== password) {
        return { success: false, error: "비밀번호가 일치하지 않습니다." };
      }

      const activeUser: StoredUser = { ...found };
      const { password: _, ...safeUser } = activeUser;
      return { success: true, user: safeUser };
    } catch (err: any) {
      return { success: false, error: "로그인 처리 실패: " + err.message };
    }
  },

  async updateUser(user: UserProfile): Promise<boolean> {
    try {
      const uname = (user.username || "").trim().toLowerCase();
      if (!uname) return false;

      let currentStored = await this.loadSingleUser(uname);
      const mergedUser: StoredUser = {
        ...(currentStored || { password: "" }),
        ...user,
        username: uname,
      };

      await this.saveSingleUser(uname, mergedUser);
      return true;
    } catch (err) {
      console.error("Failed to update user profile:", err);
      return false;
    }
  },

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const uname = username.trim().toLowerCase();
      const user = await this.loadSingleUser(uname);
      if (!user) {
        return { success: false, error: "존재하지 않는 사용자 계정입니다." };
      }
      if (user.password !== currentPassword) {
        return { success: false, error: "현재 비밀번호가 일치하지 않습니다." };
      }
      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: "새 비밀번호는 4자 이상이어야 합니다." };
      }

      const updatedUser: StoredUser = { ...user, password: newPassword };
      await this.saveSingleUser(uname, updatedUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "비밀번호 변경 처리 실패: " + err.message };
    }
  },

  // ------------------------------------------------------------- Communities
  async loadCommunities(): Promise<Community[]> {
    const rawCached = getLocalCache<Community[]>(CACHE_KEYS.COMMUNITIES, []);
    const cached = deduplicateCommunities(rawCached);
    const cfg = getSupabaseConfig();

    if (cfg) {
      try {
        const res = await fetch(
          `${cfg.url}/rest/v1/communities?select=*&order=created_at.desc`,
          { headers: supabaseHeaders(cfg) }
        );
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            const mapped = rows.map(mapDbCommunityToModel);
            const unique = deduplicateCommunities(mapped);
            setLocalCache(CACHE_KEYS.COMMUNITIES, unique);
            return unique;
          }
        }
      } catch (e) {
        console.warn("Supabase fetch communities failed, using cache", e);
      }
      return cached;
    }

    // Cloud fallback with cache protection
    try {
      const res = await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_communities?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Strictly deduplicate by ID and Name
          const unique = deduplicateCommunities([...data, ...cached]);
          setLocalCache(CACHE_KEYS.COMMUNITIES, unique);
          return unique;
        }
      }
    } catch (e) {
      console.warn("Cloud fallback loadCommunities error", e);
    }

    return cached;
  },

  async saveCommunity(newComm: Community): Promise<Community[]> {
    // 1. Immediately persist to local cache strictly deduplicated
    const cached = deduplicateCommunities(getLocalCache<Community[]>(CACHE_KEYS.COMMUNITIES, []));
    const normName = newComm.name.trim().toLowerCase();
    const existingIdx = cached.findIndex(
      (c) => c.id === newComm.id || c.name.trim().toLowerCase() === normName
    );

    let nextCached: Community[];
    if (existingIdx >= 0) {
      nextCached = [...cached];
      nextCached[existingIdx] = { ...cached[existingIdx], ...newComm };
    } else {
      nextCached = [newComm, ...cached];
    }
    const deduped = deduplicateCommunities(nextCached);
    setLocalCache(CACHE_KEYS.COMMUNITIES, deduped);

    // 2. Persist to Supabase if configured
    const cfg = getSupabaseConfig();
    if (cfg) {
      try {
        const dbRow = mapModelToDbCommunity(newComm);
        await fetch(`${cfg.url}/rest/v1/communities`, {
          method: "POST",
          headers: supabaseHeaders(cfg, {
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          }),
          body: JSON.stringify(dbRow),
        });
      } catch (e) {
        console.error("Failed to persist community to Supabase", e);
      }
      return deduped;
    }

    // 3. Fallback cloud save
    try {
      await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deduped),
      });
    } catch {}

    return deduped;
  },

  async deleteCommunity(communityId: string): Promise<Community[]> {
    // 1. Update local cache immediately
    const cached = getLocalCache<Community[]>(CACHE_KEYS.COMMUNITIES, []);
    const updated = cached.filter((c) => c.id !== communityId);
    setLocalCache(CACHE_KEYS.COMMUNITIES, updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CACHE_KEYS.MESSAGES_PREFIX + communityId);
      } catch {}
    }

    // 2. Supabase cascade delete
    const cfg = getSupabaseConfig();
    if (cfg) {
      try {
        await fetch(`${cfg.url}/rest/v1/messages?community_id=eq.${encodeURIComponent(communityId)}`, {
          method: "DELETE",
          headers: supabaseHeaders(cfg),
        });
        await fetch(`${cfg.url}/rest/v1/communities?id=eq.${encodeURIComponent(communityId)}`, {
          method: "DELETE",
          headers: supabaseHeaders(cfg),
        });
      } catch (e) {
        console.error("Failed to delete community in Supabase", e);
      }
      return updated;
    }

    // 3. Cloud fallback delete
    try {
      await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_messages_${communityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([]),
      });
    } catch {}

    return updated;
  },

  async joinCommunity(
    communityId: string,
    member: { userId: string; username?: string; name: string; pronouns: string; avatarUrl: string }
  ): Promise<{ success: boolean; error?: string; community?: Community }> {
    try {
      const communities = await this.loadCommunities();
      const commIdx = communities.findIndex((c) => c.id === communityId);
      if (commIdx < 0) return { success: false, error: "존재하지 않는 커뮤니티입니다." };

      const comm = communities[commIdx];
      if ((comm.kickedUserIds || []).includes(member.userId)) {
        return { success: false, error: "해당 커뮤니티에서 내보내진(강퇴된) 계정이므로 입장할 수 없습니다." };
      }

      const existingMembers = comm.members || [];
      const alreadyMember = existingMembers.some((m) => m.userId === member.userId);
      let updatedMembers = existingMembers;
      if (!alreadyMember) {
        const isCreator =
          comm.createdById === member.userId ||
          comm.createdBy === member.name ||
          (!!member.username && comm.createdBy === member.username);

        updatedMembers = [
          ...existingMembers,
          {
            userId: member.userId,
            username: member.username,
            name: member.name,
            pronouns: member.pronouns,
            avatarUrl: member.avatarUrl,
            role: isCreator ? "방장" : "멤버",
            joinedAt: new Date().toISOString(),
          },
        ];
      }

      const updatedComm: Community = {
        ...comm,
        members: updatedMembers,
        memberCount: Math.max(1, updatedMembers.length),
      };

      await this.saveCommunity(updatedComm);
      return { success: true, community: updatedComm };
    } catch (err: any) {
      return { success: false, error: "커뮤니티 참여 처리 실패: " + err.message };
    }
  },

  async kickMember(
    communityId: string,
    targetUserId: string,
    targetName?: string
  ): Promise<{ success: boolean; error?: string; community?: Community }> {
    try {
      const communities = await this.loadCommunities();
      const commIdx = communities.findIndex((c) => c.id === communityId);
      if (commIdx < 0) return { success: false, error: "존재하지 않는 커뮤니티입니다." };

      const comm = communities[commIdx];
      const updatedMembers = (comm.members || []).filter((m) => m.userId !== targetUserId);
      const updatedKicked = Array.from(new Set([...(comm.kickedUserIds || []), targetUserId]));

      const updatedComm: Community = {
        ...comm,
        members: updatedMembers,
        kickedUserIds: updatedKicked,
        memberCount: Math.max(1, updatedMembers.length),
      };

      await this.saveCommunity(updatedComm);

      const sysMsg: ChatMessage = {
        id: `sys-kick-${Date.now()}`,
        communityId,
        channelId: "general",
        senderId: "system",
        senderName: "시스템",
        senderPronouns: "공지",
        senderAvatar: "",
        content: `🚫 ${targetName || "사용자"}님이 방장에 의해 커뮤니티에서 내보내졌습니다.`,
        timestamp: formatKoreanTime(),
        reactions: [],
        isSystem: true,
      };
      await this.saveMessage(communityId, sysMsg);

      return { success: true, community: updatedComm };
    } catch (err: any) {
      return { success: false, error: "멤버 강퇴 처리 실패: " + err.message };
    }
  },

  // ------------------------------------------------------------- Messages
  async loadMessages(communityId: string): Promise<ChatMessage[]> {
    const cacheKey = CACHE_KEYS.MESSAGES_PREFIX + communityId;
    const cached = getLocalCache<ChatMessage[]>(cacheKey, []);

    const cfg = getSupabaseConfig();
    if (cfg) {
      try {
        const res = await fetch(
          `${cfg.url}/rest/v1/messages?community_id=eq.${encodeURIComponent(
            communityId
          )}&order=created_at.asc&limit=300`,
          { headers: supabaseHeaders(cfg) }
        );
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            const mapped = rows.map(mapDbMessageToModel);
            setLocalCache(cacheKey, mapped);
            return mapped;
          }
        }
      } catch (e) {
        console.warn("Supabase loadMessages error, using cache", e);
      }
      return cached;
    }

    // Cloud fallback with cache protection
    try {
      const res = await fetch(
        `${CLOUD_FALLBACK_BASE}/chamchi_messages_${communityId}?_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Merge with cached messages
          const msgMap = new Map<string, ChatMessage>();
          cached.forEach((m) => msgMap.set(m.id, m));
          data.forEach((m) => msgMap.set(m.id, m));
          const merged = Array.from(msgMap.values());
          setLocalCache(cacheKey, merged);
          return merged;
        }
      }
    } catch (e) {
      console.warn("Cloud fallback loadMessages error", e);
    }

    return cached;
  },

  async saveMessage(communityId: string, newMsg: ChatMessage): Promise<ChatMessage[]> {
    const cacheKey = CACHE_KEYS.MESSAGES_PREFIX + communityId;
    const cached = getLocalCache<ChatMessage[]>(cacheKey, []);
    const msgWithTime: ChatMessage = {
      ...newMsg,
      createdAt: newMsg.createdAt || new Date().toISOString(),
    };
    const updated = [...cached.filter((m) => m.id !== newMsg.id), msgWithTime];
    setLocalCache(cacheKey, updated);

    const cfg = getSupabaseConfig();
    if (cfg) {
      try {
        const dbRow = mapModelToDbMessage(msgWithTime);
        await fetch(`${cfg.url}/rest/v1/messages`, {
          method: "POST",
          headers: supabaseHeaders(cfg, {
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          }),
          body: JSON.stringify(dbRow),
        });
      } catch (e) {
        console.error("Failed to save message to Supabase", e);
      }
      return updated;
    }

    try {
      await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_messages_${communityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {}

    return updated;
  },

  async toggleReaction(
    communityId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<ChatMessage[]> {
    const current = await this.loadMessages(communityId);
    let targetMsg: ChatMessage | null = null;
    const updated = current.map((msg) => {
      if (msg.id !== messageId) return msg;
      const reactions = [...(msg.reactions || [])];
      const existingIdx = reactions.findIndex((r) => r.emoji === emoji);
      if (existingIdx >= 0) {
        const item = reactions[existingIdx];
        const hasUser = (item.users || []).includes(userId);
        const nextUsers = hasUser
          ? item.users.filter((u) => u !== userId)
          : [...item.users, userId];
        if (nextUsers.length === 0) {
          reactions.splice(existingIdx, 1);
        } else {
          reactions[existingIdx] = { ...item, users: nextUsers };
        }
      } else {
        reactions.push({ emoji, users: [userId] });
      }
      targetMsg = { ...msg, reactions };
      return targetMsg;
    });

    const cacheKey = CACHE_KEYS.MESSAGES_PREFIX + communityId;
    setLocalCache(cacheKey, updated);

    const cfg = getSupabaseConfig();
    if (cfg && targetMsg) {
      try {
        await fetch(`${cfg.url}/rest/v1/messages?id=eq.${encodeURIComponent(messageId)}`, {
          method: "PATCH",
          headers: supabaseHeaders(cfg, { "Content-Type": "application/json" }),
          body: JSON.stringify({ reactions: (targetMsg as ChatMessage).reactions }),
        });
      } catch {}
      return updated;
    }

    try {
      await fetch(`${CLOUD_FALLBACK_BASE}/chamchi_messages_${communityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {}

    return updated;
  },
};
