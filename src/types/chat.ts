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
  statusMessage: string; // 프로필 상태 메시지
  status: UserStatus;
  createdAt: string;
  authProvider: "site" | "email" | "google";
  followersCount?: number;
  followingCount?: number;
  bannedUntil?: string; // ISO 8601 string for account activity suspension
  banReason?: string; // Reason for punishment
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
  unreadCount?: number; // 실시간 안 읽은 인원수 숫자 표시
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

export type ChatStyleMode = "default" | "compact" | "feed";

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

export function isUserBanned(user?: UserProfile | null): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return false; // Super admin cannot be banned
  if (!user.bannedUntil) return false;
  return new Date(user.bannedUntil).getTime() > Date.now();
}

export function formatBanExpiry(bannedUntil?: string): string {
  if (!bannedUntil) return "";
  const d = new Date(bannedUntil);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export interface SupportInquiry {
  id: string;
  userId: string;
  userName: string;
  userUsername?: string;
  category: string;
  title: string;
  content: string;
  createdAt: string;
  status: "pending" | "resolved";
}

export interface AiVerdict {
  isViolation: boolean;
  severity: 1 | 2 | 3;
  severityLabel: string;
  bannedDays: number;
  reason: string;
  detectedKeywords: string[];
  explanation: string;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId: string;
  targetUserName: string;
  messageId?: string;
  messageContent?: string;
  communityId?: string;
  communityName?: string;
  reason: string;
  aiVerdict?: AiVerdict;
  createdAt: string;
  status: "auto_actioned" | "pending" | "dismissed";
}

export interface PresencePing {
  communityId: string;
  userId: string;
  userName: string;
  avatarUrl: string;
  timestamp: number;
}
