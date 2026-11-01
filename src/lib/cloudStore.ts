import { Community, ChatMessage, UserProfile } from "@/types/chat";

const CLOUD_BASE = "https://kvdb.io/UJi5qrxjVL5oMcMYSXCvLC";

export interface StoredUser extends UserProfile {
  password: string;
}

export const cloudStore = {
  async loadUsers(): Promise<Record<string, StoredUser>> {
    try {
      const res = await fetch(`${CLOUD_BASE}/chamchi_users?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return {};
      return await res.json();
    } catch {
      return {};
    }
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
      const users = await this.loadUsers();
      const uname = userData.username.trim().toLowerCase();
      if (!uname) return { success: false, error: "아이디를 입력해 주세요." };
      if (users[uname]) return { success: false, error: "이미 존재하는 아이디입니다." };

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

      users[uname] = newUser;

      await fetch(`${CLOUD_BASE}/chamchi_users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users),
      });

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
      const users = await this.loadUsers();
      const uname = username.trim().toLowerCase();
      const found = users[uname];
      if (!found) {
        return { success: false, error: "존재하지 않는 아이디입니다." };
      }
      if (found.password !== password) {
        return { success: false, error: "비밀번호가 일치하지 않습니다." };
      }
      const { password: _, ...safeUser } = found;
      return { success: true, user: safeUser };
    } catch (err: any) {
      return { success: false, error: "로그인 처리 실패: " + err.message };
    }
  },

  async updateUser(user: UserProfile): Promise<boolean> {
    try {
      const users = await this.loadUsers();
      const uname = (user.username || "").toLowerCase();
      if (!uname || !users[uname]) return false;
      users[uname] = { ...users[uname], ...user };
      await fetch(`${CLOUD_BASE}/chamchi_users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users),
      });
      return true;
    } catch {
      return false;
    }
  },

  async loadCommunities(): Promise<Community[]> {
    try {
      const res = await fetch(`${CLOUD_BASE}/chamchi_communities?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      // Strict deduplication by ID and normalized Name + Creator
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      return data.filter((c) => {
        if (!c || !c.id) return false;
        if (seenIds.has(c.id)) return false;
        const normKey = `${(c.name || "").trim().toLowerCase()}___${(c.createdBy || "").trim().toLowerCase()}`;
        if (seenNames.has(normKey)) return false;
        seenIds.add(c.id);
        seenNames.add(normKey);
        return true;
      });
    } catch {
      return [];
    }
  },

  async saveCommunity(newComm: Community): Promise<Community[]> {
    try {
      const current = await this.loadCommunities();

      // Check if duplicate already exists
      const isDuplicate = current.some(
        (c) =>
          c.id === newComm.id ||
          (c.name.trim().toLowerCase() === newComm.name.trim().toLowerCase() &&
            c.createdBy.trim().toLowerCase() === newComm.createdBy.trim().toLowerCase())
      );

      if (isDuplicate) {
        console.warn("Duplicate community creation prevented in cloud store:", newComm.name);
        return current;
      }

      const updated = [newComm, ...current];
      await fetch(`${CLOUD_BASE}/chamchi_communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      return updated;
    } catch {
      return [newComm];
    }
  },

  async deleteCommunity(communityId: string): Promise<Community[]> {
    try {
      const current = await this.loadCommunities();
      const updated = current.filter((c) => c.id !== communityId);

      // 1. Update communities in cloud DB
      await fetch(`${CLOUD_BASE}/chamchi_communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      // 2. Cascade delete messages for this community
      await fetch(`${CLOUD_BASE}/chamchi_messages_${communityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([]),
      });

      return updated;
    } catch (e) {
      console.error("Failed to delete community in cloud:", e);
      return [];
    }
  },

  async loadMessages(communityId: string): Promise<ChatMessage[]> {
    try {
      const res = await fetch(
        `${CLOUD_BASE}/chamchi_messages_${communityId}?_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async saveMessage(communityId: string, newMsg: ChatMessage): Promise<ChatMessage[]> {
    try {
      const current = await this.loadMessages(communityId);
      const updated = [...current, newMsg];
      await fetch(`${CLOUD_BASE}/chamchi_messages_${communityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      return updated;
    } catch {
      return [newMsg];
    }
  },

  async toggleReaction(
    communityId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<ChatMessage[]> {
    try {
      const current = await this.loadMessages(communityId);
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
        return { ...msg, reactions };
      });

      await fetch(`${CLOUD_BASE}/chamchi_messages_${communityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      return updated;
    } catch {
      return [];
    }
  },
};
