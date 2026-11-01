"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { analyzeMessageForReport } from "@/lib/profanityAiEngine";
import { AiVerdict } from "@/types/chat";
import {
  ShieldAlert,
  X,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  Calendar,
  Lock,
} from "lucide-react";

const REPORT_REASONS = [
  "변형 비속어 및 우회 욕설 (ㅅ;ㅂ, ㅄ, 음란성 표현 등)",
  "타인 비난 및 인격 모독 (조롱, 멸시, 악의적 공격)",
  "심한 비난 및 패드립 / 가족 모욕 / 폭력 위협",
  "불법 스팸 / 도배 / 광고 홍보",
  "기타 커뮤니티 가이드라인 위반",
];

export default function ReportMessageModal() {
  const { reportingMessage, setReportingMessage, reportMessage, currentUser } = useApp();

  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [verdict, setVerdict] = useState<AiVerdict | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!reportingMessage || !currentUser) return null;

  const handleClose = () => {
    setReportingMessage(null);
    setTimeout(() => {
      setVerdict(null);
      setIsCompleted(false);
      setSelectedReason(REPORT_REASONS[0]);
    }, 200);
  };

  const handleRunAiAnalysisAndReport = async () => {
    setIsProcessing(true);
    try {
      // 1. Run client AI analysis
      const aiResult = analyzeMessageForReport(reportingMessage.content, selectedReason);
      setVerdict(aiResult);

      // 2. Submit report & enact ban
      await reportMessage(reportingMessage, selectedReason);
      setIsCompleted(true);
    } catch {
      alert("신고 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-50/80 to-amber-50/40 dark:from-[#1e1f22] dark:to-[#2b2d31]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>메시지 신고 및 AI 자동 제재</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                인공지능 규정 엔진이 대화 맥락과 우회 비속어를 정밀 분석합니다.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Target Message Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              신고 대상 메시지
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <img
                  src={reportingMessage.senderAvatar}
                  alt={reportingMessage.senderName}
                  className="w-6 h-6 rounded-lg object-cover bg-slate-700"
                />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {reportingMessage.senderName}
                </span>
                <span className="text-[10px] text-slate-400">
                  {reportingMessage.timestamp}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-words pl-8">
                {reportingMessage.content || "(첨부 이미지 또는 내용 없음)"}
              </p>
            </div>
          </div>

          {!isCompleted ? (
            <>
              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  신고 사유 선택
                </label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                        selectedReason === r
                          ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-bold"
                          : "bg-slate-50 dark:bg-[#1e1f22] border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={selectedReason === r}
                        onChange={() => setSelectedReason(r)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* AI Auto-Penalty Explanation */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>AI 자동 이용 제한 원칙</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[10px] opacity-90 pl-1">
                  <li><strong>1단계 (우회 비속어/가벼운 욕설)</strong>: 14일(2주) 활동 제한</li>
                  <li><strong>2단계 (비난/인격 모독/조롱)</strong>: 30일(1달) 활동 제한</li>
                  <li><strong>3단계 (심한 비난 및 패드립/모욕)</strong>: 45일(1달 2주) 활동 제한</li>
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleRunAiAnalysisAndReport}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <span>AI 규정 심사 및 즉시 제재 적용</span>
              </button>
            </>
          ) : (
            /* Analysis Result & Ban Confirmation */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>AI 심사 완료: {verdict?.severityLabel}</span>
                </div>

                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>
                    <strong>제재 조치:</strong>{" "}
                    <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                      계정 활동 정지 {verdict?.bannedDays}일 처분
                    </span>
                  </p>
                  <p>
                    <strong>사유:</strong> {verdict?.reason}
                  </p>
                  {(verdict?.detectedKeywords || []).length > 0 && (
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <strong>감지된 키워드:</strong>
                      {verdict?.detectedKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-mono text-[10px] font-bold"
                        >
                          {kw}
                        </span>
                      ))}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    {verdict?.explanation}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  피신고자의 모든 대화, 피드 작성, DM 발송 권한이 즉시 차단되었습니다.
                </span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs shadow-md transition"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}