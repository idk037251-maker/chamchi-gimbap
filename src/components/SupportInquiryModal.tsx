"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  HelpCircle,
  X,
  Send,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  MessageSquare,
  Lock,
} from "lucide-react";

const INQUIRY_CATEGORIES = [
  "서비스 이용 문의",
  "불량 유저 / 악성 대화 신고",
  "계정 및 프로필 오류",
  "버그 제보 및 기능 제안",
  "기타 문의",
];

export default function SupportInquiryModal() {
  const { isSupportModalOpen, setIsSupportModalOpen, currentUser, submitSupportInquiry } = useApp();

  const [category, setCategory] = useState(INQUIRY_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isSupportModalOpen || !currentUser) return null;

  const handleClose = () => {
    setIsSupportModalOpen(false);
    setTimeout(() => {
      setIsSubmitted(false);
      setTitle("");
      setContent("");
      setCategory(INQUIRY_CATEGORIES[0]);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("문의 제목과 상세 내용을 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitSupportInquiry({
        category,
        title: title.trim(),
        content: content.trim(),
      });
      if (res.success) {
        setIsSubmitted(true);
      } else {
        alert(res.error || "문의 접수 중 문제가 발생했습니다.");
      }
    } catch {
      alert("문의 접수 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 to-purple-50/40 dark:from-[#1e1f22] dark:to-[#2b2d31]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#5865F2] text-white flex items-center justify-center shadow-md">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                <span>비공개 1:1 고객센터 & 문제 신고</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>문의 내용은 최고 관리자에게 비공개로 안전하게 전달됩니다.</span>
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

        {/* Body */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                문의가 성공적으로 접수되었습니다!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                접수해 주신 내용은 최고 관리자 전용 채널에 비공개로 전달되었습니다. 신속히 검토 후 조치해 드리겠습니다.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs shadow-md transition"
              >
                확인
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Sender Info (Read only) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-semibold">문의자 정보:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentUser.name} (@{currentUser.username || currentUser.id})
              </span>
            </div>

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                문의 분류
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 text-xs sm:text-sm border-0 focus:ring-2 focus:ring-[#5865F2] outline-none"
              >
                {INQUIRY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                문의 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="간단하고 명확한 제목을 입력해 주세요"
                maxLength={80}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 text-xs sm:text-sm border-0 focus:ring-2 focus:ring-[#5865F2] outline-none"
              />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                상세 내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="불편한 점, 발생 시점, 버그 상황 또는 신고 사유를 자세히 기재해 주세요."
                rows={5}
                maxLength={1000}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1e1f22] text-slate-900 dark:text-slate-100 text-xs sm:text-sm border-0 focus:ring-2 focus:ring-[#5865F2] outline-none resize-none"
              />
              <p className="text-[10px] text-slate-400 text-right">
                {content.length} / 1000자
              </p>
            </div>

            {/* Privacy Notice Banner */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-[#1e1f22] text-indigo-800 dark:text-indigo-300 border border-indigo-200/50 dark:border-white/5 text-[11px] leading-relaxed flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#5865F2]" />
              <span>
                본 문의는 제3자에게 공개되지 않으며, 관리자 계정에서만 열람 가능한 암호화된 내부 채널로 안전하게 전달됩니다.
              </span>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className={`w-full py-3 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition ${
                  isSubmitting || !title.trim() || !content.trim()
                    ? "bg-slate-200 dark:bg-[#1e1f22] text-slate-400 cursor-not-allowed"
                    : "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>문의 접수하기</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}