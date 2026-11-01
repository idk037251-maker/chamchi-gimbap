export type UserStatus = "online" | "idle" | "dnd" | "offline";

export interface UserProfile {
  id: string;
  username: string; // 사이트 전용 고유 아이디
  email?: string;
  name: string;
  pronouns: string; // e.g., "그/그의", "그녀/그녀의", "they/them", 직접 타이핑 입력
  avatarUrl: string;
  bannerUrl: string;
  bannerColor: string;
  bio: string;
  statusMessage: string; // 카카오톡 스타일 상태 메시지
  status: UserStatus;
  createdAt: string;
  authProvider: "site" | "email" | "google" | "kakao";
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
  createdById?: string;
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
