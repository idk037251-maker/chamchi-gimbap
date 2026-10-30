import { Community, ChatMessage, UserProfile } from "@/types/chat";

export const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Nala&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Kakaocord&backgroundColor=fee500",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Ryan&backgroundColor=fada0a",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=Luna&backgroundColor=b6e3f4",
];

export const BANNER_PRESETS = [
  {
    id: "discord-blurple",
    label: "디스코드 블러플",
    gradient: "linear-gradient(135deg, #5865F2 0%, #3b429f 50%, #1e1f22 100%)",
    url: "",
  },
  {
    id: "kakao-yellow",
    label: "카카오 옐로우 팝",
    gradient: "linear-gradient(135deg, #FEE500 0%, #F59E0B 60%, #3C1E1E 100%)",
    url: "",
  },
  {
    id: "cyber-neon",
    label: "사이버 네온 시티",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
    url: "",
  },
  {
    id: "forest-mint",
    label: "오로라 민트",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 50%, #0f172a 100%)",
    url: "",
  },
  {
    id: "sunset-vibes",
    label: "선셋 라운지",
    gradient: "linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #fde047 100%)",
    url: "",
  },
  {
    id: "midnight-galaxy",
    label: "미드나잇 갤럭시",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #090d16 100%)",
    url: "",
  },
];

export const PRONOUN_OPTIONS = [
  "그/그의 (He/Him)",
  "그녀/그녀의 (She/Her)",
  "그들/그들의 (They/Them)",
  "이름으로만 지칭 (Name Only)",
  "모든 대명사 환영 (Any/All)",
  "직접 입력",
];

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: "comm-frontend-kr",
    name: "FE 프론트엔드 개발자 라운지",
    description:
      "React, Next.js, Tailwind CSS, TypeScript 및 최신 웹 기술을 함께 토론하고 코드 리뷰를 나누는 오픈 커뮤니티입니다. 주니어부터 시니어까지 모두 환영합니다!",
    rules: [
      "1. 서로를 존중하는 말투(해요체/하십시오체)를 사용해 주세요.",
      "2. 질문 시에는 에러 로그나 재현 가능한 코드 스니펫을 함께 올려주세요.",
      "3. 구인/구직 및 홍보 글은 지정된 #홍보-채용 채널에만 작성해 주세요.",
      "4. 타인의 개인정보나 비공개 사내 코드를 유출하지 마세요.",
    ],
    category: "IT / 개발",
    iconEmoji: "⚛️",
    bannerGradient: "linear-gradient(135deg, #5865F2 0%, #06b6d4 100%)",
    memberCount: 1420,
    onlineCount: 318,
    createdBy: "김리액트",
    createdAt: "2026-09-15",
    tags: ["#React", "#NextJS", "#프론트엔드", "#코딩질문"],
    channels: [
      {
        id: "general",
        name: "자유-수다방",
        type: "text",
        description: "개발 일상과 가벼운 수다를 나누는 카카오톡 오픈채팅 스타일 메인 채널",
      },
      {
        id: "notice",
        name: "공지사항-규칙",
        type: "announcement",
        description: "커뮤니티 주요 공지 및 스터디 모집 안내",
      },
      {
        id: "qna",
        name: "기술-질문답변",
        type: "qna",
        description: "버그 디버깅, 아키텍처 고민을 함께 해결하는 채널",
      },
    ],
  },
  {
    id: "comm-game-party",
    name: "발로란트 & 롤 듀오/내전 구함 🎮",
    description:
      "디스코드의 채널 편의성과 카카오톡 오픈채팅의 빠른 파티 모집을 합친 종합 게이밍 라운지! 매너 게임하실 분들 언제든 들어오세요.",
    rules: [
      "1. 게임 중 욕설, 비난, 훈수 절대 금지 (적발 시 즉시 강퇴)",
      "2. 파티 모집 시 티어와 포지션을 명확히 적어주세요.",
      "3. 노쇼(No-Show) 방지를 위해 시간 약속을 꼭 지켜주세요.",
    ],
    category: "게임 / e스포츠",
    iconEmoji: "🎮",
    bannerGradient: "linear-gradient(135deg, #f43f5e 0%, #7c3aed 100%)",
    memberCount: 2890,
    onlineCount: 642,
    createdBy: "페이커팬",
    createdAt: "2026-08-20",
    tags: ["#발로란트", "#롤내전", "#스팀게임", "#파티모집"],
    channels: [
      {
        id: "general",
        name: "실시간-파티모집",
        type: "text",
        description: "지금 바로 같이 게임할 파티원을 구하는 메인 채팅방",
      },
      {
        id: "notice",
        name: "내전-일정공지",
        type: "announcement",
        description: "주말 이벤트 내전 및 상품 안내",
      },
      {
        id: "qna",
        name: "하이라이트-자랑",
        type: "qna",
        description: "매드무비 클립과 승급 인증샷 공유",
      },
    ],
  },
  {
    id: "comm-design-uiux",
    name: "UI/UX & 프로덕트 디자이너 클럽 🎨",
    description:
      "Figma 팁, 디자인 시스템, 다크/라이트 모드 UI 레퍼런스, 포트폴리오 피드백을 주고받는 디자이너들의 따뜻한 아지트입니다.",
    rules: [
      "1. 피드백은 언제나 구체적이고 건설적으로 남겨주세요.",
      "2. 저작권이 있는 유료 에셋의 무단 공유를 금지합니다.",
      "3. 레퍼런스 공유 시 출처 링크를 함께 남겨주시면 더욱 좋습니다.",
    ],
    category: "디자인 / 예술",
    iconEmoji: "🎨",
    bannerGradient: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
    memberCount: 875,
    onlineCount: 154,
    createdBy: "피그마장인",
    createdAt: "2026-10-01",
    tags: ["#Figma", "#UIUX", "#디자인시스템", "#포트폴리오"],
    channels: [
      {
        id: "general",
        name: "디자인-라운지",
        type: "text",
        description: "디자인 트렌드와 영감을 나누는 오픈 채팅방",
      },
      {
        id: "notice",
        name: "클리닉-공지",
        type: "announcement",
        description: "월간 포트폴리오 리뷰 세션 안내",
      },
      {
        id: "qna",
        name: "피드백-요청",
        type: "qna",
        description: "작업 중인 시안에 대해 솔직한 의견을 구하는 공간",
      },
    ],
  },
  {
    id: "comm-cafe-study",
    name: "갓생러 새벽 카공 & 미라클모닝 ☕",
    description:
      "자격증, 취준, 사이드 프로젝트, 독서까지! 매일 목표를 인증하고 서로 동기부여를 주고받는 카톡 오픈채팅 감성 스터디룸입니다.",
    rules: [
      "1. 매일 아침 또는 공부 시작 전 오늘의 투두(To-Do) 리스트를 남겨주세요.",
      "2. 타인의 목표나 속도를 비교하거나 평가하지 않습니다.",
      "3. 긍정적인 이모지 리액션으로 서로를 응원해 주세요!",
    ],
    category: "라이프 / 자기계발",
    iconEmoji: "☕",
    bannerGradient: "linear-gradient(135deg, #FEE500 0%, #10b981 100%)",
    memberCount: 640,
    onlineCount: 129,
    createdBy: "새벽반총무",
    createdAt: "2026-10-10",
    tags: ["#미라클모닝", "#카공족", "#사이드프로젝트", "#갓생인증"],
    channels: [
      {
        id: "general",
        name: "출석-공부인증",
        type: "text",
        description: "출첵 및 공부 시작/종료 타임스탬프 인증방",
      },
      {
        id: "notice",
        name: "스터디-규칙",
        type: "announcement",
        description: "주간 챌린지 달성자 명단 및 공지",
      },
      {
        id: "qna",
        name: "맛집-카페추천",
        type: "qna",
        description: "콘센트 많고 조용한 전국 카공 카페 정보 공유",
      },
    ],
  },
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  // comm-frontend-kr (general)
  {
    id: "msg-1",
    communityId: "comm-frontend-kr",
    channelId: "general",
    senderId: "bot-kakaocord",
    senderName: "KakaoCord 안내봇",
    senderPronouns: "BOT",
    senderAvatar: AVATAR_PRESETS[5],
    senderRole: "BOT",
    content:
      "📢 [환영합니다] FE 프론트엔드 개발자 라운지에 오신 것을 환영합니다! 상단 헤더의 '규칙 및 정보' 버튼을 눌러 커뮤니티 가이드를 확인해 보세요.",
    timestamp: "오후 5:40",
    unreadCount: 0,
    reactions: [{ emoji: "👋", users: ["user-1", "user-2"] }],
    isSystem: false,
  },
  {
    id: "msg-2",
    communityId: "comm-frontend-kr",
    channelId: "general",
    senderId: "user-minji",
    senderName: "민지 (프론트엔드 3년차)",
    senderPronouns: "그녀/그녀의 (She/Her)",
    senderAvatar: AVATAR_PRESETS[1],
    senderRole: "방장",
    content:
      "여러분 안녕하세요! 오늘 Next.js + Tailwind CSS로 디스코드랑 카카오톡 오픈채팅 장점만 합친 UI 만들어보고 있는데 다크모드 색감 조합이 진짜 재밌네요 ㅎㅎ",
    timestamp: "오후 5:42",
    unreadCount: 0,
    reactions: [
      { emoji: "🔥", users: ["user-jun", "user-hyun"] },
      { emoji: "💛", users: ["user-jun"] },
    ],
  },
  {
    id: "msg-3",
    communityId: "comm-frontend-kr",
    channelId: "general",
    senderId: "user-jun",
    senderName: "준호_FullStack",
    senderPronouns: "그/그의 (He/Him)",
    senderAvatar: AVATAR_PRESETS[0],
    senderRole: "부방장",
    content:
      "오 맞아요! 디스코드는 채널 구조랑 다크 테마가 편하고, 카톡은 말풍선 가독성이랑 읽음 표시(1)가 직관적인데 둘이 합치니까 훨씬 깔끔하네요 👍",
    timestamp: "오후 5:45",
    unreadCount: 1,
    reactions: [{ emoji: "💯", users: ["user-minji"] }],
  },
  {
    id: "msg-4",
    communityId: "comm-frontend-kr",
    channelId: "general",
    senderId: "user-sora",
    senderName: "소라 (UI디자이너)",
    senderPronouns: "그들/그들의 (They/Them)",
    senderAvatar: AVATAR_PRESETS[2],
    senderRole: "멤버",
    content:
      "왼쪽 상단 줄 3개(햄버거 메뉴) 누르면 내 미니 프로필이랑 대명사(Pronouns), 커스텀 배너까지 한눈에 보이는 게 너무 마음에 들어요!",
    timestamp: "오후 5:48",
    unreadCount: 2,
    reactions: [{ emoji: "✨", users: ["user-minji", "user-jun"] }],
  },
  // comm-frontend-kr (notice)
  {
    id: "msg-notice-1",
    communityId: "comm-frontend-kr",
    channelId: "notice",
    senderId: "user-minji",
    senderName: "민지 (프론트엔드 3년차)",
    senderPronouns: "그녀/그녀의 (She/Her)",
    senderAvatar: AVATAR_PRESETS[1],
    senderRole: "방장",
    content:
      "📌 [정기 모각코 안내] 매주 금요일 저녁 8시에 온라인 코드 리뷰 & 모각코 세션을 진행합니다. 참여를 원하시는 분은 이 메시지에 손들기(🙋) 반응을 남겨주세요!",
    timestamp: "오후 2:00",
    unreadCount: 0,
    reactions: [{ emoji: "🙋", users: ["user-jun", "user-sora"] }],
  },
  // comm-game-party (general)
  {
    id: "msg-game-1",
    communityId: "comm-game-party",
    channelId: "general",
    senderId: "user-jett",
    senderName: "제트장인",
    senderPronouns: "그/그의 (He/Him)",
    senderAvatar: AVATAR_PRESETS[3],
    senderRole: "방장",
    content:
      "지금 발로란트 일반전 편하게 달릴 분 2명 구합니다! 티어 무관, 마이크 가능하신 분 환영해요~ 채팅 남겨주세요!",
    timestamp: "오후 6:05",
    unreadCount: 1,
    reactions: [{ emoji: "🎮", users: ["user-sora"] }],
  },
  // comm-design-uiux (general)
  {
    id: "msg-design-1",
    communityId: "comm-design-uiux",
    channelId: "general",
    senderId: "user-sora",
    senderName: "소라 (UI디자이너)",
    senderPronouns: "그들/그들의 (They/Them)",
    senderAvatar: AVATAR_PRESETS[2],
    senderRole: "방장",
    content:
      "다크 모드와 라이트 모드를 동시에 지원할 때는 배경 명도 대비를 살짝 부드럽게(#313338 계열) 잡는 게 눈의 피로도를 확 줄여주더라구요!",
    timestamp: "오후 4:20",
    unreadCount: 0,
    reactions: [{ emoji: "🎨", users: ["user-minji"] }],
  },
  // comm-cafe-study (general)
  {
    id: "msg-study-1",
    communityId: "comm-cafe-study",
    channelId: "general",
    senderId: "user-study",
    senderName: "새벽반총무",
    senderPronouns: "그녀/그녀의 (She/Her)",
    senderAvatar: AVATAR_PRESETS[4],
    senderRole: "방장",
    content:
      "☕ 오늘 저녁 카공 출석체크 시작합니다! 오늘 끝낼 목표 1가지씩 채팅창에 선언하고 집중 시작해봐요 화이팅!!",
    timestamp: "오후 6:00",
    unreadCount: 0,
    reactions: [{ emoji: "🔥", users: ["user-minji", "user-jun"] }],
  },
];

export const MOCK_ONLINE_MEMBERS: UserProfile[] = [
  {
    id: "user-minji",
    email: "minji.dev@gmail.com",
    name: "민지 (프론트엔드 3년차)",
    pronouns: "그녀/그녀의 (She/Her)",
    avatarUrl: AVATAR_PRESETS[1],
    bannerUrl: "",
    bannerColor: BANNER_PRESETS[0].gradient,
    bio: "React & Next.js 생태계를 사랑하는 웹 프론트엔드 엔지니어입니다. 오픈소스 기여와 디자인 시스템 구축에 관심이 많아요.",
    statusMessage: "Next.js 14 배포 중 🚀",
    status: "online",
    createdAt: "2026-09-01",
    authProvider: "google",
  },
  {
    id: "user-jun",
    email: "junho.fullstack@gmail.com",
    name: "준호_FullStack",
    pronouns: "그/그의 (He/Him)",
    avatarUrl: AVATAR_PRESETS[0],
    bannerUrl: "",
    bannerColor: BANNER_PRESETS[1].gradient,
    bio: "백엔드와 프론트엔드를 오가는 풀스택 개발자입니다. 커피와 기계식 키보드를 좋아합니다.",
    statusMessage: "코드 리뷰 환영합니다 ☕",
    status: "online",
    createdAt: "2026-09-10",
    authProvider: "google",
  },
  {
    id: "user-sora",
    email: "sora.design@kakao.com",
    name: "소라 (UI디자이너)",
    pronouns: "그들/그들의 (They/Them)",
    avatarUrl: AVATAR_PRESETS[2],
    bannerUrl: "",
    bannerColor: BANNER_PRESETS[2].gradient,
    bio: "사용자 중심의 인터랙션과 접근성 높은 디자인을 고민합니다. 대명사(Pronouns) 존중 문화를 응원해요!",
    statusMessage: "피그마 컴포넌트 정리 중 ✨",
    status: "idle",
    createdAt: "2026-09-18",
    authProvider: "kakao",
  },
  {
    id: "user-jett",
    email: "jett.valorant@gmail.com",
    name: "제트장인",
    pronouns: "그/그의 (He/Him)",
    avatarUrl: AVATAR_PRESETS[3],
    bannerUrl: "",
    bannerColor: BANNER_PRESETS[4].gradient,
    bio: "퇴근 후 즐겜하는 직장인 게이머입니다. 발로란트 & 롤 내전 언제나 환영!",
    statusMessage: "경쟁전 집중 모드 🎮",
    status: "dnd",
    createdAt: "2026-10-02",
    authProvider: "email",
  },
];

export const SIMULATED_REPLIES: {
  senderName: string;
  senderPronouns: string;
  senderAvatar: string;
  senderRole: "방장" | "부방장" | "멤버";
  templates: string[];
}[] = [
  {
    senderName: "민지 (프론트엔드 3년차)",
    senderPronouns: "그녀/그녀의 (She/Her)",
    senderAvatar: AVATAR_PRESETS[1],
    senderRole: "방장",
    templates: [
      "오 말씀해주신 내용 너무 공감돼요! 반갑습니다 🙌",
      "혹시 궁금하신 점 있으시면 언제든 편하게 질문 남겨주세요! 상단 규칙 토글도 한 번씩 확인 부탁드려요 😊",
      "와 오늘 채팅방 화력이 정말 좋네요 🔥 다들 환영합니다!",
    ],
  },
  {
    senderName: "준호_FullStack",
    senderPronouns: "그/그의 (He/Him)",
    senderAvatar: AVATAR_PRESETS[0],
    senderRole: "부방장",
    templates: [
      "저도 방금 그 생각 하고 있었는데 타이밍 대박이네요 ㅋㅋㅋ 👍",
      "좋은 의견 감사합니다! 같이 이야기 나누니까 훨씬 재밌네요.",
      "프로필 커스텀 기능도 한번 써보세요! 배너 바꾸는 맛이 쏠쏠합니다 ㅎㅎ",
    ],
  },
  {
    senderName: "소라 (UI디자이너)",
    senderPronouns: "그들/그들의 (They/Them)",
    senderAvatar: AVATAR_PRESETS[2],
    senderRole: "멤버",
    templates: [
      "맞아요! 카카오톡 감성이랑 디스코드 UI가 섞여서 눈이 정말 편안해요 ✨",
      "환영합니다!! 자주 소통해요 💛",
    ],
  },
];
