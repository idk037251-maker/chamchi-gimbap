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
  followersCount?: number;
  followingCount?: number;
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "announcement" | "qna";
  description: string;
}

export interface CommunityMember {
  userId: string;
  username?: string;
  name: string;
  pronouns: string;
  avatarUrl: string;
  role: "방장" | "부방장" | "멤버";
  joinedAt: string;
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
  members?: CommunityMember[];
  kickedUserIds?: string[];
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
  senderRole?: "방장" | "부방장" | "멤버" | "BOT" | "관리자";
  content: string;
  timestamp: string;
  createdAt?: string; // ISO 8601 string for join-time filter
  unreadCount?: number; // KakaoTalk '1' unread indicator style
  readUserIds?: string[]; // IDs of users who have read this message
  reactions: Reaction[];
  isSystem?: boolean;
  attachmentUrl?: string;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorPronouns?: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorPronouns?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  likes: string[]; // userIds who liked
  comments: PostComment[];
  createdAt: string;
}

export interface FollowRecord {
  followerId: string;
  followingId: string;
  createdAt?: string;
}

export interface DmMessage {
  id: string;
  conversationId: string; // e.g. sort(user1, user2).join('_')
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderPronouns?: string;
  recipientId: string;
  recipientName: string;
  recipientAvatar: string;
  content: string;
  attachmentUrl?: string;
  readUserIds: string[];
  timestamp: string;
  createdAt: string;
}

export interface DmConversation {
  conversationId: string;
  otherUser: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string;
    pronouns: string;
    statusMessage?: string;
  };
  lastMessage?: DmMessage;
  unreadCount: number;
}

export type ChatStyleMode = "hybrid" | "discord" | "kakao";

/**
 * Super Admin identifier:
 * 아이디나 이름이 '참치김밥'인 계정에 자동으로 최고 관리자 권한 부여
 */
export function isSuperAdmin(user?: UserProfile | null): boolean {
  if (!user) return false;
  const uname = (user.username || "").trim().toLowerCase();
  const name = (user.name || "").trim().toLowerCase();
  return uname === "참치김밥" || name === "참치김밥";
}
