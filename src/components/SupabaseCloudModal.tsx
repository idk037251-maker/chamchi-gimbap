"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { getSupabaseConfig } from "@/lib/supabaseClient";
import {
  X,
  Database,
  Cloud,
  CheckCircle2,
  ExternalLink,
  Key,
  Globe,
  Radio,
  FileCode2,
  AlertTriangle,
} from "lucide-react";

export default function SupabaseCloudModal() {
  const {
    isCloudConfigModalOpen,
    setIsCloudConfigModalOpen,
    isCloudConnected,
    updateSupabaseCloudKeys,
    disconnectSupabaseCloud,
  } = useApp();

  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (isCloudConfigModalOpen) {
      const cfg = getSupabaseConfig();
      if (cfg) {
        setSupabaseUrl(cfg.url);
        setSupabaseKey(cfg.anonKey);
      }
    }
  }, [isCloudConfigModalOpen]);

  if (!isCloudConfigModalOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) return;

    setIsSaving(true);
    await updateSupabaseCloudKeys(supabaseUrl.trim(), supabaseKey.trim());
    setIsSaving(false);
    setSuccessToast(true);

    setTimeout(() => {
      setSuccessToast(false);
      setIsCloudConfigModalOpen(false);
    }, 1200);
  };

  const handleDisconnect = () => {
    disconnectSupabaseCloud();
    setSupabaseUrl("");
    setSupabaseKey("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#1e1f22]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base">
                  Supabase 클라우드 DB & 실시간 연동
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    isCloudConnected
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  {isCloudConnected ? "클라우드 라이브 연결됨" : "로컬 영구 모드 (키 미설정)"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL 데이터베이스, 스토리지 파일 업로드, 실시간 웹소켓을 영구 유지합니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCloudConfigModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status info box */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-[#1e1f22] border border-indigo-200/60 dark:border-white/5 space-y-2 text-xs leading-relaxed">
            <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-[#5865F2]" />
                영구 데이터 보관 안내
              </span>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#5865F2] hover:underline flex items-center gap-1"
              >
                Supabase 무료 가입 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Supabase 프로젝트를 무료로 생성한 뒤, 아래에 <strong>Project URL</strong>과{" "}
              <strong>Anon Public API Key</strong>를 입력하면 모든 사용자의 대화, 커뮤니티,
              프로필 사진이 클라우드에 영구 저장되고 실시간 동기화됩니다.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#5865F2]" />
              Project URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              Anon Public API Key <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJh..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2] font-mono resize-none"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-amber-500" />
              DB 테이블 및 스토리지 버킷 자동 생성 팁
            </div>
            <p className="leading-relaxed">
              프로젝트 내 <code>supabase/schema.sql</code> 파일의 내용을 복사하여 Supabase의{" "}
              <strong>SQL Editor</strong>에 붙여넣고 Run을 실행하면 테이블 및 Storage 버킷이
              즉시 자동 생성됩니다.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
            {isCloudConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition"
              >
                클라우드 연결 해제 (로컬 모드로 전환)
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {successToast && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  클라우드 연결 성공!
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsCloudConfigModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#35373c] transition"
              >
                닫기
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? "연결 중..." : "설정 저장 및 실시간 동기화"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
