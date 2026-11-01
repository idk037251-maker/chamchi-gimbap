/**
 * 비속어 및 욕설 자동 치환 필터
 * 비속어 및 욕설 단어를 감지하여 '얍'으로 자동 치환합니다.
 * 예: "너 바보냐" -> "너 얍냐"
 *     "진짜 씨발 뭐하냐" -> "진짜 얍 뭐하냐"
 */

const PROFANITY_PATTERNS = [
  /바\s*보/gi,
  /멍\s*청\s*이/gi,
  /멍\s*청/gi,
  /병\s*[신씬]/gi,
  /븅\s*[신씬]/gi,
  /등\s*신/gi,
  /ㅂ\s*ㅅ/gi,
  /ㅄ/gi,
  /[시씨]\s*[발벌빨]/gi,
  /[시씨]\s*[바파]ㄹ/gi,
  /ㅅ\s*ㅂ/gi,
  /ㅆ\s*ㅂ/gi,
  /썅/gi,
  /존\s*나/gi,
  /졸\s*라/gi,
  /ㅈ\s*ㄴ/gi,
  /좆\s*[까같]/gi,
  /좆/gi,
  /지\s*랄/gi,
  /ㅈ\s*ㄹ/gi,
  /염\s*병/gi,
  /개\s*새\s*끼/gi,
  /소\s*새\s*끼/gi,
  /새\s*끼/gi,
  /미\s*친\s*[놈년]/gi,
  /미\s*친/gi,
  /닥\s*쳐/gi,
  /아\s*가\s*리/gi,
  /개\s*자\s*식/gi,
  /엠\s*창/gi,
  /니\s*애\s*미/gi,
  /느\s*금\s*마/gi,
  /느\s*금/gi,
  /fuck/gi,
  /shit/gi,
  /bitch/gi,
  /asshole/gi,
  /bastard/gi,
  /idiot/gi,
];

export function filterProfanity(text: string): string {
  if (!text) return "";
  let filtered = text;
  for (const pattern of PROFANITY_PATTERNS) {
    filtered = filtered.replace(pattern, "얍");
  }
  return filtered;
}
