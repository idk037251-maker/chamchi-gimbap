-- ==============================================================================
-- KakaoCord 프로덕션 라이브 Supabase 스키마 (가짜 더미 데이터 없는 순수 100% 라이브)
-- ==============================================================================

-- 1. 유저 프로필 테이블 (실제 가입 유저의 이름, 직접 입력한 대명사, 아바타, 배너, 소개글 영구 보관)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pronouns TEXT NOT NULL,                    -- 유저가 직접 입력/선택한 대명사
  avatar_url TEXT DEFAULT '',               -- 스토리지 아바타 공개 URL
  banner_url TEXT DEFAULT '',               -- 스토리지 배너 공개 URL
  banner_color TEXT DEFAULT 'linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)',
  bio TEXT DEFAULT '',
  status_message TEXT DEFAULT '',
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 실제 유저가 개설한 커뮤니티 테이블
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
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Supabase Realtime WebSocket 복제 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;

-- 5. Row Level Security (RLS) 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Profiles Select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Profiles Insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Profiles Update" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public Communities Select" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Public Communities Insert" ON public.communities FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Messages Select" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public Messages Insert" ON public.messages FOR INSERT WITH CHECK (true);

-- 6. 스토리지 버킷 (아바타/배너 파일 영구 저장)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Upload Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Public Read Banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Public Upload Banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');
