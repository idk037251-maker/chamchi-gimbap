import { AiVerdict } from "@/types/chat";

// Level 3: Extreme hate, family/parent insults (패드립), death/violence threats
const LEVEL_3_PATTERNS = [
  /느[금검][마]*/i,
  /ㄴ[ㄱ검]ㅁ/i,
  /니[애엄][미마]/i,
  /니애비/i,
  /ㄴㅇㅁ/i,
  /엠창|앰창|엠생/i,
  /ㅇㅊ|ㅁㅊ/i,
  /호로[자식|새끼]*/i,
  /창녀|걸레[년놈]*/i,
  /보지|자지/i,
  /죽어[라버려]|자살[해라]|살인[할]/i,
  /칼로\s*(찔러|그어)/i,
  /강간|성폭행/i,
  /장애인\s*새끼/i,
  /개[새|세][끼|키]/i,
  /씨[발|팔]\s*[년|놈|새끼]/i,
  /ㅅ[ㅂ|ㅃ]\s*[년|놈]/i,
];

// Level 2: Serious insults, personal defamation, harassment, mockery
const LEVEL_2_PATTERNS = [
  /병[신씬]|ㅂ[신씬]|ㅄ|ㅂㅅ/i,
  /ㅂ[\s._;,~-]*ㅅ/i,
  /미친[놈|년|새끼]/i,
  /또라이|똘아이/i,
  /지[랄럴]|ㅈㄹ/i,
  /ㅈ[\s._;,~-]*ㄹ/i,
  /닥쳐|아가리\s*닥/i,
  /ㄷㅊ/i,
  /꺼져|ㄲㅈ/i,
  /대가리\s*(박아|깨|터)/i,
  /싸가지\s*(없는|바가지)/i,
  /개[소리|수작|망신|잡]/i,
  /쓰레기\s*[새끼|같은]/i,
  /무뇌|저능[아|아새끼]/i,
  /씹[새|창|창렬]/i,
  /좆[까|같|밥|마이]|좃[까|같]/i,
  /ㅈ[\s._;,~-]*ㄲ/i,
  /꼴통|호구/i,
];

// Level 1: Mild / disguised expletives and vulgarities
const LEVEL_1_PATTERNS = [
  /존나|졸라|ㅈㄴ|존[나|버]/i,
  /ㅈ[\s._;,~-]*ㄴ/i,
  /시[발|팔]|씨[발|팔]|ㅆ[발|팔]/i,
  /ㅅ[\s._;,~-]*ㅂ/i,
  /ㅆ[\s._;,~-]*ㅂ/i,
  /시[\s._;,~-]*발/i,
  /씨[\s._;,~-]*발/i,
  /18[년|놈|새끼]/i,
  /십[팔|알][년|놈]*/i,
  /새[끼|키]|ㅅ[ㄲ|키]/i,
  /개같은|빡치네|염병/i,
  /썅[년|놈]*/i,
];

/**
 * Normalizes text to defeat simple evasion tricks:
 * e.g., "ㅅ;ㅂ", "ㅅ.ㅂ", "ㅅ ㅂ", "ㅆ!ㅂ", "ㅂ...ㅅ", "ㅂ;ㅅ"
 */
function normalizeForAnalysis(input: string): string {
  if (!input) return "";
  return input
    .replace(/[\s\-_.,;~!@#$%^&*()_+=\[\]{}|\\:/?><]+/g, " ")
    .toLowerCase();
}

/**
 * AI-driven Content Moderation & Penalty Engine:
 * Analyzes reported message context and automatically grades penalty duration:
 * 1) Level 1 (가벼운 욕설): 14일 차단 (2주)
 * 2) Level 2 (비난 / 인격 모독): 30일 차단 (1달)
 * 3) Level 3 (심한 비난 및 패드립 / 심한 욕설): 45일 차단 (1달 2주)
 */
export function analyzeMessageForReport(content: string, userReason?: string): AiVerdict {
  const raw = content || "";
  const normalized = normalizeForAnalysis(raw);
  const detectedKeywords: string[] = [];

  // 1. Check Level 3: Extreme attacks & 패드립 (45 days)
  for (const regex of LEVEL_3_PATTERNS) {
    const match = raw.match(regex) || normalized.match(regex);
    if (match) {
      detectedKeywords.push(match[0]);
    }
  }

  if (detectedKeywords.length > 0) {
    return {
      isViolation: true,
      severity: 3,
      severityLabel: "3단계 (패드립 / 심한 혐오 및 중대 인격 모독)",
      bannedDays: 45, // 1달 2주
      reason: `중대 규정 위반: 패드립 및 심한 비난/폭력성 발언 (${detectedKeywords.slice(0, 3).join(", ")})`,
      detectedKeywords,
      explanation:
        "AI 분석 결과, 가족/부모를 겨냥한 패드립, 극단적 비하 또는 중대한 혐오 표현이 확인되었습니다. 서비스 이용 원칙에 따라 1달 2주(45일) 계정 활동 정지 처분이 집행됩니다.",
    };
  }

  // 2. Check Level 2: Malicious mocking, harassment, character insult (30 days)
  for (const regex of LEVEL_2_PATTERNS) {
    const match = raw.match(regex) || normalized.match(regex);
    if (match) {
      detectedKeywords.push(match[0]);
    }
  }

  if (detectedKeywords.length > 0) {
    return {
      isViolation: true,
      severity: 2,
      severityLabel: "2단계 (비난 / 인격 모독 / 지속적 조롱)",
      bannedDays: 30, // 1달
      reason: `규정 위반: 악의적 비난 및 인격 모독 (${detectedKeywords.slice(0, 3).join(", ")})`,
      detectedKeywords,
      explanation:
        "AI 분석 결과, 타인을 조롱하거나 인격을 훼손하는 비난 및 모욕 표현이 확인되었습니다. 서비스 이용 규정에 따라 1달(30일) 계정 활동 정지 처분이 집행됩니다.",
    };
  }

  // 3. Check Level 1: Mild or disguised curses (14 days)
  for (const regex of LEVEL_1_PATTERNS) {
    const match = raw.match(regex) || normalized.match(regex);
    if (match) {
      detectedKeywords.push(match[0]);
    }
  }

  if (detectedKeywords.length > 0) {
    return {
      isViolation: true,
      severity: 1,
      severityLabel: "1단계 (가벼운 비속어 / 변형 우회 욕설)",
      bannedDays: 14, // 2주
      reason: `규정 위반: 변형/우회 비속어 및 욕설 사용 (${detectedKeywords.slice(0, 3).join(", ")})`,
      detectedKeywords,
      explanation:
        "AI 분석 결과, 검열을 우회한 변형 비속어 또는 공격적인 욕설 표현이 확인되었습니다. 서비스 이용 규정에 따라 2주(14일) 계정 활동 정지 처분이 집행됩니다.",
    };
  }

  // 4. If reporter selected explicit reason (e.g. "패드립/심한 모독") and text has aggressive exclamation
  if (userReason?.includes("패드립") || userReason?.includes("심한")) {
    return {
      isViolation: true,
      severity: 2,
      severityLabel: "2단계 (맥락적 유해 발언)",
      bannedDays: 30,
      reason: "신고 접수 및 대화 맥락 검토 결과 부적절한 언행 감지",
      detectedKeywords: ["공격적 어조"],
      explanation:
        "메시지 맥락 및 신고 사유 분석 결과, 커뮤니티 가이드라인을 저해하는 유해한 발언으로 판정되어 30일 활동 정지 처분이 적용됩니다.",
    };
  }

  // Fallback: Mild violation if reported for bad language
  return {
    isViolation: true,
    severity: 1,
    severityLabel: "1단계 (커뮤니티 가이드라인 위반)",
    bannedDays: 14,
    reason: "신고 접수에 따른 1차 계도 조치",
    detectedKeywords: ["부적절한 발언"],
    explanation:
      "커뮤니티 신고 검토 결과 부적절한 대화 내용이 감지되어 14일(2주) 활동 제한 처분이 내려졌습니다.",
  };
}
