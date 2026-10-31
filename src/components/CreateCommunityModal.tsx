"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { BANNER_PRESETS } from "@/data/mockData";
import {
  X,
  PlusCircle,
  ShieldAlert,
  FileText,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const EMOJI_PRESETS = ["💬", "⚛️", "🎮", "🎨", "☕", "🚀", "🎵", "📚", "🔥", "⚡"];
const CATEGORY_PRESETS = [
  "IT / 개발",
  "게임 / e스포츠",
  "디자인 / 예술",
  "라이프 / 자기계발",
  "취미 / 친목",
  "음악 / 문화",
];

export default function CreateCommunityModal() {
  const { isCreateModalOpen, setIsCreateModalOpen, createCommunity } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rulesText, setRulesText] = useState(
    "1. 서로를 배려하고 존중하는 대화 매너를 지켜주세요.\n2. 주제와 무관한 도배 및 광고성 글은 제한됩니다.\n3. 모든 멤버의 대명사(Pronouns)와 정체성을 존중합니다."
  );
  const [category, setCategory] = useState(CATEGORY_PRESETS[0]);
  const [iconEmoji, setIconEmoji] = useState(EMOJI_PRESETS[0]);
  const [bannerGradient, setBannerGradient] = useState(
    BANNER_PRESETS[0].gradient
  );
  const [tagsInput, setTagsInput] = useState("#오픈채팅 #디스코드 #실시간소통");
  const [error, setError] = useState("");

  if (!isCreateModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("커뮤니티 이름을 입력해 주세요.");
      return;
    }
    if (!description.trim()) {
      setError("커뮤니티 상세 소개(Description)를 입력해 주세요.");
      return;
    }
    if (!rulesText.trim()) {
      setError("커뮤니티 규칙(Rules)을 최소 1개 이상 입력해 주세요.");
      return;
    }

    const parsedRules = rulesText
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    const parsedTags = tagsInput
      .split(/[\s,]+/)
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .filter((t) => t.length > 1);

    try {
      await createCommunity({
        name: name.trim(),
        description: description.trim(),
        rules: parsedRules,
        category,
        iconEmoji,
        bannerGradient,
        tags: parsedTags,
      });
      setName("");
      setDescription("");
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "커뮤니티 생성에 실패했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-[#2b2d31] text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#1e1f22]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shadow-md">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base">
                새 공개 커뮤니티 만들기
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                커뮤니티 이름, 상세 소개(Description), 그리고 이용 규칙(Rules)을 설정하세요.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#35373c] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Community Card Live Preview */}
          <div
            className="p-4 rounded-2xl text-white flex items-center gap-3.5 shadow-md"
            style={{ background: bannerGradient }}
          >
            <div className="w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20">
              {iconEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/35 mb-1">
                {category}
              </span>
              <h3 className="font-extrabold text-base truncate">
                {name.trim() || "커뮤니티 이름 미리보기"}
              </h3>
              <p className="text-xs text-white/85 truncate">
                {description.trim() || "커뮤니티 상세 소개글이 여기에 표시됩니다."}
              </p>
            </div>
          </div>

          {/* 1. Community Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              1. 커뮤니티 이름 <span className="text-rose-500">* 필수</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: AI & 웹 풀스택 스터디 라운지"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          {/* Icon & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                대표 아이콘 이모지
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {EMOJI_PRESETS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setIconEmoji(em)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition ${
                      iconEmoji === em
                        ? "bg-[#5865F2] text-white scale-110 shadow-sm"
                        : "bg-slate-100 dark:bg-[#1e1f22] hover:bg-slate-200 dark:hover:bg-[#35373c]"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                카테고리 및 테마 색상
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs font-semibold mb-2 focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
              >
                {CATEGORY_PRESETS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                {BANNER_PRESETS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBannerGradient(b.gradient)}
                    className={`h-5 flex-1 rounded-md transition ${
                      bannerGradient === b.gradient
                        ? "ring-2 ring-offset-1 ring-[#5865F2]"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ background: b.gradient }}
                    title={b.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 2. Community Detailed Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#5865F2]" />
              2. 커뮤니티 상세 소개 (Description){" "}
              <span className="text-rose-500">* 필수</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="어떤 주제를 다루는 커뮤니티인지, 어떤 멤버들을 환영하는지 상세히 소개해 주세요."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
            />
          </div>

          {/* 3. Community Rules */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FEE500]" />
              3. 커뮤니티 이용 규칙 (Rules - 줄바꿈으로 구분){" "}
              <span className="text-rose-500">* 필수</span>
            </label>
            <textarea
              rows={4}
              required
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder="채팅방 상단 '규칙 보기' 토글을 눌렀을 때 표시될 커뮤니티 규칙을 작성해 주세요."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#5865F2] resize-none"
            />
          </div>

          {/* Search Hashtags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              검색 해시태그 (선택)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="#개발자 #친목 #스터디"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#35373c] transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold shadow-lg flex items-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-[#FEE500]" />
              <span>커뮤니티 생성 완료 및 입장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
