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

  async loadSingleUser(uname: string): Promise<StoredUser | null> {
    try {
      const res = await fetch(
        `${CLOUD_BASE}/chamchi_user_${encodeURIComponent(uname.toLowerCase())}?_t=${Date.now()}`,
        { cache: "no-store" }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async saveSingleUser(uname: string, user: StoredUser): Promise<void> {
    const key = uname.toLowerCase();
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("chamchi_user_vault_" + key, JSON.stringify(user));
      } catch {}
    }
    try {
      await fetch(`${CLOUD_BASE}/chamchi_user_${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
    } catch (e) {
      console.warn("Failed to save single user to cloud:", e);
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
      const uname = userData.username.trim().toLowerCase();
      if (!uname) return { success: false, error: "아이디를 입력해 주세요." };

      const users = await this.loadUsers();
      const existingSingle = await this.loadSingleUser(uname);
      if (users[uname] || existingSingle) {
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

      // 1. Save to dedicated single-user key
      await this.saveSingleUser(uname, newUser);

      // 2. Also register in global users directory
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
      const uname = username.trim().toLowerCase();
      if (!uname) return { success: false, error: "아이디를 입력해 주세요." };

      // 1. Check dedicated single user key first (preserves most recent avatar/bio/banner)
      let found = await this.loadSingleUser(uname);

      // 2. If not found in single key, check global user list
      if (!found) {
        const users = await this.loadUsers();
        found = users[uname];
      }

      // 3. Fallback to local storage vault
      if (!found && typeof window !== "undefined") {
        const localVault = localStorage.getItem("chamchi_user_vault_" + uname);
        if (localVault) {
          try {
            found = JSON.parse(localVault);
          } catch {}
        }
      }

      if (!found) {
        return { success: false, error: "존재하지 않는 아이디입니다." };
      }
      if (found.password !== password) {
        return { success: false, error: "비밀번호가 일치하지 않습니다." };
      }

      const activeUser: StoredUser = { ...found };

      // If local storage has any newer profile edits, merge them
      if (typeof window !== "undefined") {
        const localVault = localStorage.getItem("chamchi_user_vault_" + uname);
        if (localVault) {
          try {
            const vaultUser = JSON.parse(localVault);
            Object.assign(activeUser, vaultUser);
          } catch {}
        }
      }

      // Synchronize single-user key
      this.saveSingleUser(uname, activeUser).catch(() => {});

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

      // 1. Fetch current stored user
      let currentStored = await this.loadSingleUser(uname);
      if (!currentStored) {
        const users = await this.loadUsers();
        currentStored = users[uname];
      }

      const mergedUser: StoredUser = {
        ...(currentStored || { password: "" }),
        ...user,
        username: uname,
      };

      // 2. Save directly to dedicated single-user key
      await this.saveSingleUser(uname, mergedUser);

      // 3. Also update main user list in background
      try {
        const users = await this.loadUsers();
        users[uname] = mergedUser;
        await fetch(`${CLOUD_BASE}/chamchi_users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(users),
        });
      } catch {}

      return true;
    } catch (err) {
      console.error("Failed to update user profile in cloud:", err);
      return false;
    }
  },

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const users = await this.loadUsers();
      const uname = username.trim().toLowerCase();
      const user = users[uname];
      if (!user) {
        return { success: false, error: "존재하지 않는 사용자 계정입니다." };
      }
      if (user.password !== currentPassword) {
        return { success: false, error: "현재 비밀번호가 일치하지 않습니다." };
      }
      if (!newPassword || newPassword.length < 4) {
        return { success: false, error: "새 비밀번호는 4자 이상이어야 합니다." };
      }
      users[uname] = { ...user, password: newPassword };
      await fetch(`${CLOUD_BASE}/chamchi_users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "비밀번호 변경 처리 실패: " + err.message };
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
      return data
        .filter((c) => {
          if (!c || !c.id) return false;
          if (seenIds.has(c.id)) return false;
          const normKey = `${(c.name || "").trim().toLowerCase()}___${(c.createdBy || "").trim().toLowerCase()}`;
          if (seenNames.has(normKey)) return false;
          seenIds.add(c.id);
          seenNames.add(normKey);
          return true;
        })
        .map((c) => ({
          ...c,
          members: Array.isArray(c.members) ? c.members : [],
          kickedUserIds: Array.isArray(c.kickedUserIds) ? c.kickedUserIds : [],
        }));
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

  async joinCommunity(
    communityId: string,
    member: { userId: string; username?: string; name: string; pronouns: string; avatarUrl: string }
  ): Promise<{ success: boolean; error?: string; community?: Community }> {
    try {
      const current = await this.loadCommunities();
      const commIdx = current.findIndex((c) => c.id === communityId);
      if (commIdx < 0) return { success: false, error: "존재하지 않는 커뮤니티입니다." };

      const comm = current[commIdx];
      // Check if kicked
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

      current[commIdx] = updatedComm;

      await fetch(`${CLOUD_BASE}/chamchi_communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });

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
      const current = await this.loadCommunities();
      const commIdx = current.findIndex((c) => c.id === communityId);
      if (commIdx < 0) return { success: false, error: "존재하지 않는 커뮤니티입니다." };

      const comm = current[commIdx];
      const updatedMembers = (comm.members || []).filter((m) => m.userId !== targetUserId);
      const updatedKicked = Array.from(new Set([...(comm.kickedUserIds || []), targetUserId]));

      const updatedComm: Community = {
        ...comm,
        members: updatedMembers,
        kickedUserIds: updatedKicked,
        memberCount: Math.max(1, updatedMembers.length),
      };

      current[commIdx] = updatedComm;

      await fetch(`${CLOUD_BASE}/chamchi_communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      });

      // Post system announcement message into chat
      const sysMsg: ChatMessage = {
        id: `sys-kick-${Date.now()}`,
        communityId,
        channelId: "general",
        senderId: "system",
        senderName: "시스템",
        senderPronouns: "공지",
        senderAvatar: "",
        content: `🚫 ${targetName || "사용자"}님이 방장에 의해 커뮤니티에서 내보내졌습니다.`,
        timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }),
        reactions: [],
        isSystem: true,
      };
      await this.saveMessage(communityId, sysMsg);

      return { success: true, community: updatedComm };
    } catch (err: any) {
      return { success: false, error: "멤버 강퇴 처리 실패: " + err.message };
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
      const msgWithTime: ChatMessage = {
        ...newMsg,
        createdAt: newMsg.createdAt || new Date().toISOString(),
      };
      const current = await this.loadMessages(communityId);
      const updated = [...current, msgWithTime];
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
