-- ==============================================================================
-- KakaoCord (카카오톡 × 디스코드 하이브리드 커뮤니티) Supabase 통합 스키마
-- Supabase 대시보드 -> SQL Editor 에서 아래 전체 코드를 복사 후 'Run'을 누르세요.
-- ==============================================================================

-- 1. 유저 프로필 테이블 (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,                       -- Supabase Auth user ID 또는 고유 클라이언트 ID
  email TEXT NOT NULL,
  name TEXT NOT NULL,                        -- [필수] 유저 표시 이름
  pronouns TEXT NOT NULL,                    -- [필수] 대명사 (그/그녀/they 등)
  avatar_url TEXT DEFAULT '',               -- 프로필 사진 URL
  banner_url TEXT DEFAULT '',               -- 커스텀 배경 사진 URL
  banner_color TEXT DEFAULT 'linear-gradient(135deg, #5865F2 0%, #1e1f22 100%)',
  bio TEXT DEFAULT '',                       -- 소개글 (BIO)
  status_message TEXT DEFAULT '',           -- 카카오톡 스타일 상태 메시지
  status TEXT DEFAULT 'online',              -- online, idle, dnd, offline
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 커뮤니티 테이블 (communities)
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rules JSONB DEFAULT '[]'::jsonb,           -- 규칙 배열
  category TEXT DEFAULT '자유 / 소통',
  icon_emoji TEXT DEFAULT '💬',
  banner_gradient TEXT DEFAULT 'linear-gradient(135deg, #5865F2 0%, #10b981 100%)',
  member_count INT DEFAULT 1,
  online_count INT DEFAULT 1,
  created_by TEXT NOT NULL,
  tags JSONB DEFAULT '["#신규오픈"]'::jsonb,
  channels JSONB DEFAULT '[{"id":"general","name":"자유-수다방","type":"text","description":"메인 대화 채널"}]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 실시간 채팅 메시지 테이블 (messages)
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

-- 4. Supabase Realtime 복제 활성화 (실시간 채팅 웹소켓 전송)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;

-- 5. RLS (Row Level Security) 설정 - 누구나 조회 및 작성 가능하도록 오픈
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles can be inserted by everyone" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles can be updated by everyone" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Communities can be inserted by everyone" ON public.communities FOR INSERT WITH CHECK (true);

CREATE POLICY "Messages are viewable by everyone" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Messages can be inserted by everyone" ON public.messages FOR INSERT WITH CHECK (true);

-- 6. 스토리지 버킷 생성 (avatars, banners)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 스토리지 접근 정책 설정 (누구나 다운로드/보기 가능, 누구나 업로드 가능)
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public Upload Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public Read Banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Public Upload Banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');

-- 7. 초기 공개 커뮤니티 시드 데이터 등록
INSERT INTO public.communities (id, name, description, rules, category, icon_emoji, banner_gradient, member_count, online_count, created_by, tags, channels)
VALUES 
(
  'comm-frontend-kr',
  'FE 프론트엔드 개발자 라운지',
  'React, Next.js, Tailwind CSS, TypeScript 및 최신 웹 기술을 함께 토론하고 코드 리뷰를 나누는 오픈 커뮤니티입니다.',
  '["1. 서로를 존중하는 말투를 사용해 주세요.", "2. 에러 로그나 재현 가능한 코드를 함께 올려주세요.", "3. 타인의 개인정보를 유출하지 마세요."]'::jsonb,
  'IT / 개발',
  '⚛️',
  'linear-gradient(135deg, #5865F2 0%, #06b6d4 100%)',
  1420,
  318,
  '김리액트',
  '["#React", "#NextJS", "#프론트엔드", "#코딩질문"]'::jsonb,
  '[{"id":"general","name":"자유-수다방","type":"text","description":"개발 일상과 가벼운 수다"}, {"id":"notice","name":"공지사항-규칙","type":"announcement","description":"주요 공지"}, {"id":"qna","name":"기술-질문답변","type":"qna","description":"버그 해결 Q&A"}]'::jsonb
),
(
  'comm-game-party',
  '발로란트 & 롤 듀오/내전 구함 🎮',
  '디스코드의 채널 편의성과 카카오톡 오픈채팅의 빠른 파티 모집을 합친 종합 게이밍 라운지!',
  '["1. 게임 중 비난 및 욕설 절대 금지", "2. 파티 모집 시 티어와 포지션을 명시해 주세요."]'::jsonb,
  '게임 / e스포츠',
  '🎮',
  'linear-gradient(135deg, #f43f5e 0%, #7c3aed 100%)',
  2890,
  642,
  '페이커팬',
  '["#발로란트", "#롤내전", "#스팀게임", "#파티모집"]'::jsonb,
  '[{"id":"general","name":"실시간-파티모집","type":"text","description":"파티원 구인 메인방"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
