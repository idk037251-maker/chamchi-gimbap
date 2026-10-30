export type UserStatus = "online" | "idle" | "dnd" | "offline";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  pronouns: string; // e.g., "그/그의 (He/Him)", "그녀/그녀의 (She/Her)", "그들/그들의 (They/Them)"
  avatarUrl: string;
  bannerUrl: string;
  bannerColor: string;
  bio: string;
  statusMessage: string; // KakaoTalk style short status message
  status: UserStatus;
  createdAt: string;
  authProvider: "email" | "google" | "kakao";
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "announcement" | "qna";
  description: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  rules: string[];
  category: string;
  iconEmoji: string;
  bannerGradient: string;
  memberCount: number;
  onlineCount: number;
  createdBy: string;
  createdAt: string;
  tags: string[];
  channels: Channel[];
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface ChatMessage {
  id: string;
  communityId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderPronouns: string;
  senderAvatar: string;
  senderRole?: "방장" | "부방장" | "멤버" | "BOT";
  content: string;
  timestamp: string;
  unreadCount?: number; // KakaoTalk '1' unread indicator style
  reactions: Reaction[];
  isSystem?: boolean;
  attachmentUrl?: string;
}

export type ChatStyleMode = "hybrid" | "discord" | "kakao";
