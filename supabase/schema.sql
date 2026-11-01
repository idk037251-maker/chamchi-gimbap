-- ==============================================================================
-- 참치김밥(Chamchi Gimbap) 프로덕션 라이브 Supabase 스키마
-- ==============================================================================

-- 1. 유저 프로필 테이블 (ID 중복 방지 UNIQUE 제약 조건 포함)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,             -- 사이트 전용 고유 아이디 (UNIQUE 제약조건)
  password_hash TEXT NOT NULL,               -- 계정 비밀번호 (보안 저장)
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pronouns TEXT NOT NULL,                    -- 유저가 직접 입력한 대명사
  avatar_url TEXT DEFAULT '',               -- 스토리지 아바타 공개 URL
  banner_url TEXT DEFAULT '',               -- 스토리지 배너 공개 URL
  banner_color TEXT DEFAULT 'linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)',
  bio TEXT DEFAULT '',
  status_message TEXT DEFAULT '',
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 실제 유저가 개설한 커뮤니티 테이블 (멤버 및 강퇴 목록 지원)
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rules JSONB DEFAULT '[]'::jsonb,
  category TEXT DEFAULT '자유 / 소통',
  icon_emoji TEXT DEFAULT '💬',
  banner_gradient TEXT DEFAULT 'linear-gradient(135deg, #5865F2 0%, #10b981 100%)',
  member_count INT DEFAULT 1,
  online_count INT DEFAULT 1,
  created_by TEXT NOT NULL,
  created_by_id TEXT,
  members JSONB DEFAULT '[]'::jsonb,         -- 참여 멤버 목록
  kicked_user_ids JSONB DEFAULT '[]'::jsonb, -- 방장에 의해 강퇴된 유저 ID 목록 (재입장 차단)
  tags JSONB DEFAULT '["#오픈채팅"]'::jsonb,
  channels JSONB DEFAULT '[{"id":"general","name":"자유-수다방","type":"text","description":"메인 대화 채널"}]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 실제 유저 간 실시간 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL DEFAULT 'general',
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_pronouns TEXT NOT NULL,
  sender_avatar TEXT DEFAULT '',
  sender_role TEXT DEFAULT '멤버',
  content TEXT NOT NULL,
  unread_count INT DEFAULT 0,
  reactions JSONB DEFAULT '[]'::jsonb,
  attachment_url TEXT DEFAULT '',            -- 첨부 이미지 URL
  read_user_ids JSONB DEFAULT '[]'::jsonb,   -- 읽은 유저 목록 (카카오톡 스타일 읽음 카운트용)
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 messages 테이블에 read_user_ids 컬럼이 없을 경우 안전하게 추가 (무중단 마이그레이션)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_user_ids JSONB DEFAULT '[]'::jsonb;

-- 4. 유저 피드 게시물(포스트) 테이블 (사진/동영상 업로드, 좋아요, 댓글 지원)
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT DEFAULT '',
  author_pronouns TEXT DEFAULT '',
  content TEXT NOT NULL,
  media_url TEXT DEFAULT '',
  media_type TEXT DEFAULT 'image',           -- 'image' 또는 'video'
  likes JSONB DEFAULT '[]'::jsonb,           -- 좋아요 누른 유저 ID 목록
  comments JSONB DEFAULT '[]'::jsonb,        -- 댓글 목록 [{id, authorId, authorName, authorAvatar, content, createdAt}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 팔로우/팔로워 관계 테이블
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 6. 1:1 개인 메시지(DM) 테이블
CREATE TABLE IF NOT EXISTS public.dm_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT DEFAULT '',
  sender_pronouns TEXT DEFAULT '',
  recipient_id TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_avatar TEXT DEFAULT '',
  content TEXT NOT NULL,
  attachment_url TEXT DEFAULT '',
  read_user_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Supabase Realtime WebSocket 복제 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dm_messages;

-- 8. Row Level Security (RLS) 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Profiles Select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Profiles Insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Profiles Update" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Communities Select" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Public Communities Insert" ON public.communities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Communities Update" ON public.communities FOR UPDATE USING (true);
CREATE POLICY "Public Communities Delete" ON public.communities FOR DELETE USING (true);

CREATE POLICY "Public Messages Select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public Messages Insert" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Messages Update" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Public Messages Delete" ON public.messages FOR DELETE USING (true);

CREATE POLICY "Public Posts Select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public Posts Insert" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Posts Update" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Public Posts Delete" ON public.posts FOR DELETE USING (true);

CREATE POLICY "Public Follows Select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Public Follows Insert" ON public.follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Follows Delete" ON public.follows FOR DELETE USING (true);

CREATE POLICY "Public Dm Select" ON public.dm_messages FOR SELECT USING (true);
CREATE POLICY "Public Dm Insert" ON public.dm_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Dm Update" ON public.dm_messages FOR UPDATE USING (true);

-- 9. 스토리지 버킷 (아바타/배너/게시물 미디어 파일 영구 저장)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Upload Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Public Read Banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Public Upload Banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');
CREATE POLICY "Public Read Media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Public Upload Media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');

-- 10. 커뮤니티별 마지막 접속 시간 (안 읽은 새 메시지 알림 배지 카운트용)
CREATE TABLE IF NOT EXISTS public.community_reads (
  user_id TEXT NOT NULL,
  community_id TEXT NOT NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, community_id)
);
ALTER TABLE public.community_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Reads Select" ON public.community_reads FOR SELECT USING (true);
CREATE POLICY "Public Reads Insert" ON public.community_reads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Reads Update" ON public.community_reads FOR UPDATE USING (true);

-- 11. 사용자 제재 컬럼 추가 (무중단 마이그레이션 - 기존 데이터 100% 보존)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_until TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 12. 비공개 문의 및 신고 테이블
CREATE TABLE IF NOT EXISTS public.support_inquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_username TEXT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Inquiries Insert" ON public.support_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Inquiries Select" ON public.support_inquiries FOR SELECT USING (true);

-- 13. AI 유저 신고 및 제재 이력 테이블
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  reporter_name TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  target_user_name TEXT NOT NULL,
  message_id TEXT,
  message_content TEXT,
  community_id TEXT,
  community_name TEXT,
  reason TEXT NOT NULL,
  ai_verdict JSONB,
  status TEXT DEFAULT 'auto_actioned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Reports Insert" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Reports Select" ON public.reports FOR SELECT USING (true);
