# 🚀 KakaoCord 클라우드 영구 배포 & Supabase 완벽 연동 매뉴얼

본 가이드는 **KakaoCord (카카오톡 × 디스코드 하이브리드 실시간 커뮤니티 채팅)**를 **Supabase (PostgreSQL + Realtime WebSocket + Cloud Storage + Auth)** 및 **Vercel** 무료 호스팅을 통해 인터넷 상에 정식 배포하고 영구적으로 운영하는 전체 절차를 설명합니다.

---

## 📋 시스템 아키텍처 요약

- **프론트엔드 & 호스팅**: Next.js 14 (App Router) + Tailwind CSS on **Vercel (무료)**
- **데이터베이스**: PostgreSQL on **Supabase (무료 티어 500MB)**
- **실시간 통신**: Supabase Realtime WebSocket (동시접속 200명 무료)
- **파일 스토리지**: Supabase Storage 버킷 (`avatars`, `banners` 프로필 이미지 영구 보존, 1GB 무료)
- **인증(Auth)**: Google OAuth 2.0 (Gmail) & Email/Password 간편 가입

---

## 1단계: Supabase 프로젝트 생성 및 SQL 스키마 등록

1. **Supabase 가입 및 프로젝트 생성**:
   - [https://supabase.com](https://supabase.com) 접속 후 무료 가입(GitHub 연동).
   - `New Project` 클릭:
     - **Name**: `kakaocord-live`
     - **Database Password**: 안전한 비밀번호 입력 (메모)
     - **Region**: `Northeast (Seoul)` 선택 (한국 지역 가장 빠른 레이턴시)
     - `Create new project` 클릭 (약 1분 소요).

2. **SQL 스키마 일괄 실행 (테이블, RLS, 스토리지, 실시간 복제 자동 생성)**:
   - Supabase 좌측 메뉴에서 **SQL Editor** 아이콘을 클릭합니다.
   - 프로젝트 루트의 `supabase/schema.sql` 파일 내용 전체를 복사하여 에디터에 붙여넣습니다.
   - 우측 하단의 **Run (또는 Ctrl+Enter)** 버튼을 클릭합니다.
   - `Success. No rows returned` 메시지가 나오면 다음 항목들이 자동 완비됩니다:
     - `profiles`, `communities`, `messages` 테이블 생성
     - `avatars`, `banners` Public Storage 버킷 생성
     - Row Level Security (RLS) 정책 자동 부여
     - `supabase_realtime`에 실시간 메시지 복제 활성화

3. **Supabase API 키 확인**:
   - 좌측 메뉴 맨 아래 **Project Settings (톱니바퀴)** -> **API** 메뉴로 이동합니다.
   - 다음 두 가지 값을 복사해 둡니다:
     - `Project URL`: 예) `https://abcdefghijklmn.supabase.co`
     - `Project API keys`의 `anon` (public): 예) `eyJhbGciOiJIUzI1NiIsInR5cCI...`

---

## 2단계: Google OAuth 2.0 (Gmail 연동) 설정 (선택 사항)

사용자가 "Gmail 계정으로 계속하기"를 클릭했을 때 실제 구글 로그인 팝업이 뜨도록 연동하려면:

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속하여 새 프로젝트를 생성합니다.
2. **API 및 서비스** -> **OAuth 동의 화면** 설정 (외부 사용자, 앱 이름 `KakaoCord` 입력).
3. **사용자 인증 정보** -> **+ 사용자 인증 정보 만들기** -> **OAuth 클라이언트 ID**:
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI**에 다음 주소 추가:
     `https://<your-project-id>.supabase.co/auth/v1/callback`
4. 발급된 `클라이언트 ID`와 `클라이언트 보안 비밀번호`를 복사합니다.
5. Supabase 대시보드 -> **Authentication** -> **Providers** -> **Google** 활성화 후 위 두 값을 입력하고 저장합니다.

---

## 3단계: Vercel을 통한 원클릭 웹 배포

1. **GitHub 저장소에 코드 푸시**:
   ```bash
   cd C:\Users\USER\.gemini\antigravity\scratch\kakaocord-chat
   git init
   git add .
   git commit -m "feat: KakaoCord production release"
   git remote add origin https://github.com/<your-username>/kakaocord.git
   git push -u origin main
   ```

2. **Vercel 프로젝트 임포트**:
   - [https://vercel.com](https://vercel.com) 접속 후 로그인.
   - `Add New...` -> `Project` 클릭 후 방금 올린 GitHub 저장소 선택 (`Import`).

3. **환경 변수(Environment Variables) 등록**:
   - Vercel 배포 화면의 **Environment Variables** 섹션에 아래 2개 키를 등록합니다:
     - `NEXT_PUBLIC_SUPABASE_URL`: `https://<your-project-id>.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUz... (anon key)`
   - `Deploy` 버튼 클릭!

4. **배포 완료**:
   - 약 1분 후 `https://kakaocord-xxx.vercel.app` 형태의 글로벌 HTTPS 도메인이 생성되며, 즉시 전 세계 어디서나 여러 사용자가 접속하여 실시간 대화를 나눌 수 있습니다!

---

## 4단계: 무료 티어 서비스 영구 유지 팁 (중단 방지 가이드)

Supabase 무료 플랜은 **7일 동안 활동(API 호출)이 없으면 프로젝트가 일시 중지(Paused)**될 수 있습니다. 이를 방지하고 365일 24시간 영구 무중단으로 유지하는 팁:

1. **GitHub Actions를 이용한 자동 Keep-Alive 핑 (무료)**:
   - 본 프로젝트의 `.github/workflows/keepalive.yml` 파일 또는 무료 Cron 서비스([Cron-job.org](https://cron-job.org))를 이용해 매일 1회 Supabase REST API(`https://<your-id>.supabase.co/rest/v1/communities`)로 GET 요청을 전송하면 무한 영구 활성 상태가 유지됩니다.
2. **스토리지 용량 관리**:
   - 프로필 아바타와 배너 사진은 WebP/PNG 형식으로 최적화되어 업로드되므로 무료 1GB 용량으로 수만 명의 유저 프로필을 넉넉히 수용할 수 있습니다.
3. **오프라인/로컬 자동 폴백(Fallback) 내장**:
   - 만약 클라우드 키가 설정되지 않거나 네트워크가 차단된 환경에서도 브라우저 `localStorage`와 `BroadcastChannel`이 자동으로 활성화되어 데이터 유실 없이 데모 테스트가 가능합니다.
