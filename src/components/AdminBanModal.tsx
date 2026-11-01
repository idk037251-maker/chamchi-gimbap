"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { isSuperAdmin, isUserBanned, formatBanExpiry } from "@/types/chat";
import {
  Crown,
  X,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Unlock,
} from "lucide-react";

const DURATION_PRESETS = [
  { label: "1시간", ms: 1 * 60 * 60 * 1000 },
  { label: "6시간", ms: 6 * 60 * 60 * 1000 },
  { label: "12시간", ms: 12 * 60 * 60 * 1000 },
  { label: "1일 (24시간)", ms: 24 * 60 * 60 * 1000 },
  { label: "3일", ms: 3 * 24 * 60 * 60 * 1000 },
  { label: "7일 (1주)", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "14일 (2주)", ms: 14 * 24 * 60 * 60 * 1000 },
  { label: "30일 (1달)", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "90일 (3달)", ms: 90 * 24 * 60 * 60 * 1000 },
  { label: "365일 (1년)", ms: 365 * 24 * 60 * 60 * 1000 },
  { label: "영구 정지 (10년)", ms: 3650 * 24 * 60 * 60 * 1000 },
];

export default function AdminBanModal() {
  const { adminBanningUser, setAdminBanningUser, adminBanUser, adminUnbanUser, currentUser } = useApp();

  const [selectedDurationMs, setSelectedDurationMs] = useState(DURATION_PRESETS[5].ms); // default 7 days
  const [customDays, setCustomDays] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [reason, setReason] = useState("커뮤니티 운영 원칙 위반 및 분란 조장");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!adminBanningUser || !currentUser || !isSuperAdmin(currentUser)) return null;

  const isTargetBanned = isUserBanned(adminBanningUser);

  const handleClose = () => {
    setAdminBanningUser(null);
    setIsCustom(false);
    setCustomDays("");
  };

  const handleApplyBan = async () => {
    let finalDurationMs = selectedDurationMs;
    if (isCustom) {
      const days = parseInt(customDays, 10);
      if (isNaN(days) || days <= 0) {
        alert("유효한 일수를 입력해 주세요.");
        return;
      }
      finalDurationMs = days * 24 * 60 * 60 * 1000;
    }

    if (!reason.trim()) {
      alert("제재 사유를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminBanUser(adminBanningUser.id, finalDurationMs, reason.trim());
      if (res.success) {
        alert(`👑 [${adminBanningUser.name}] 유저에게 맞춤형 계정 정지 제재가 적용되었습니다.`);
        handleClose();
      } else {
        alert(res.error || "제재 적용 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnban = async () => {
    if (!confirm(`[${adminBanningUser.name}] 유저의 활동 제한을 즉시 해제하시겠습니까?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminUnbanUser(adminBanningUser.id);
      if (res.success) {
        alert(`👑 [${adminBanningUser.name}] 유저의 차단이 즉시 해제되었습니다.`);
        handleClose();
      } else {
        alert(res.error || "차단 해제 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-950/15 flex items-center justify-center">
              <Crown className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                최고 관리자 맞춤형 유저 제재
              </h2>
              <p className="text-[11px] font-semibold opacity-85">
                '참치김밥' 최고 관리자 전용 권한
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-black/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Target Profile Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200/80 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={adminBanningUser.avatarUrl}
                alt={adminBanningUser.name}
                className="w-10 h-10 rounded-xl object-cover bg-slate-700"
              />
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {adminBanningUser.name}
                </p>
                <p className="text-xs text-slate-400">@{adminBanningUser.username || adminBanningUser.id}</p>
              </div>
            </div>

            {isTargetBanned && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                현재 활동 정지 중
              </span>
            )}
          </div>

          {/* Current Ban Info if already banned */}
          {isTargetBanned && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <p className="font-bold">
                ⚠️ 기존 정지 만료일: {formatBanExpiry(adminBanningUser.bannedUntil)}
              </p>
              <p className="text-[11px] opacity-90">
                사유: {adminBanningUser.banReason || "운영 원칙 위반"}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUnban}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>즉시 차단 해제 (Unban)</span>
                </button>
              </div>
            </div>
          )}

          {/* Duration Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>제재 기간 선택</span>
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {DURATION_PRESETS.map((p) => {
                const isSelected = !isCustom && selectedDurationMs === p.ms;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedDurationMs(p.ms);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? "bg-[#5865F2] text-white border-[#5865F2] shadow-xs"
                        : "bg-slate-50 dark:bg-[#1e1f22] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/5 hover:border-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition border ${
                  isCustom
                    ? "bg-[#5865F2] text-white border-[#5865F2] shadow-xs"
                    : "bg-slate-50 dark:bg-[#1e1f22] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/5 hover:border-slate-300"
                }`}
              >
                직접 입력
              </button>
            </div>

            {isCustom && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="정지 일수 입력 (예: 15)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] text-xs font-bold outline-none border border-slate-200 dark:border-white/10"
                />
                <span className="text-xs font-bold text-slate-500">일간 정지</span>
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>제재 사유</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="제재 사유를 입력하세요 (해당 유저에게 안내됩니다)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] text-xs sm:text-sm font-medium outline-none border border-slate-200 dark:border-white/10"
            />
          </div>

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={handleApplyBan}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crown className="w-4 h-4 text-amber-300" />
              )}
              <span>최고 관리자 권한으로 제재 확정</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}