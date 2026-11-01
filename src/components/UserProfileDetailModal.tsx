"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { isSuperAdmin, isUserBanned, formatBanExpiry, Post } from "@/types/chat";
import {
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  Heart,
  MessageCircle,
  Trash2,
  Image as ImageIcon,
  Video,
  Send,
  Loader2,
  Sparkles,
  Edit3,
  ShieldAlert,
  Unlock,
} from "lucide-react";

export default function UserProfileDetailModal() {
  const {
    currentUser,
    inspectedUser,
    setInspectedUser,
    followingIds,
    followCounts,
    toggleFollowUser,
    openDmWithUser,
    setIsProfileModalOpen,
    userPosts,
    loadUserPosts,
    createPost,
    deletePost,
    toggleLikePost,
    addPostComment,
    uploadMediaFile,
    setAdminBanningUser,
    adminUnbanUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"posts" | "info">("posts");
  const [newPostContent, setNewPostContent] = useState("");
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inspectedUser) {
      loadUserPosts(inspectedUser.id);
    }
  }, [inspectedUser?.id]);

  if (!inspectedUser || !currentUser) return null;

  const isMe = inspectedUser.id === currentUser.id;
  const isFollowing = followingIds.includes(inspectedUser.id);
  const counts = followCounts[inspectedUser.id] || { followers: 0, following: 0 };
  const isAdmin = isSuperAdmin(inspectedUser);
  const iAmAdmin = isSuperAdmin(currentUser);

  // Filter posts belonging to inspectedUser
  const posts = userPosts.filter((p) => p.authorId === inspectedUser.id);

  const handleToggleFollow = async () => {
    if (isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      await toggleFollowUser(inspectedUser.id);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleStartDm = () => {
    setInspectedUser(null);
    openDmWithUser(inspectedUser);
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("파일 크기는 25MB 이하여야 합니다.");
      return;
    }

    setIsUploadingMedia(true);
    try {
      const res = await uploadMediaFile(file);
      setPendingMedia(res);
    } catch {
      alert("미디어 파일 처리에 실패했습니다.");
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() && !pendingMedia) return;
    if (isSubmittingPost) return;

    setIsSubmittingPost(true);
    try {
      await createPost(
        newPostContent,
        pendingMedia?.url,
        pendingMedia?.type
      );
      setNewPostContent("");
      setPendingMedia(null);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    await addPostComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[92vh] bg-white dark:bg-[#1e1f22] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-32 sm:h-40 w-full overflow-hidden flex-shrink-0 bg-slate-800">
          {inspectedUser.bannerUrl ? (
            <img
              src={inspectedUser.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-r ${
                inspectedUser.bannerColor || "from-indigo-600 via-purple-600 to-pink-500"
              }`}
            />
          )}

          {/* Close button */}
          <button
            onClick={() => setInspectedUser(null)}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition backdrop-blur-xs z-10"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Header Information */}
        <div className="px-5 sm:px-6 pt-0 pb-4 relative border-b border-slate-200 dark:border-white/10 flex-shrink-0">
          <div className="flex justify-between items-end -mt-12 sm:-mt-14 mb-3">
            <div className="relative">
              <img
                src={inspectedUser.avatarUrl}
                alt={inspectedUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover bg-slate-700 border-4 border-white dark:border-[#1e1f22] shadow-xl"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#23a55a] border-2 border-white dark:border-[#1e1f22]" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {isMe ? (
                <button
                  type="button"
                  onClick={() => {
                    setInspectedUser(null);
                    setIsProfileModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-[#2b2d31] hover:bg-slate-200 dark:hover:bg-[#35373c] text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#5865F2]" />
                  <span>내 프로필 수정</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                      isFollowing
                        ? "bg-slate-200 dark:bg-[#2b2d31] text-slate-800 dark:text-slate-200 hover:bg-rose-500 hover:text-white"
                        : "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                    }`}
                  >
                    {isFollowLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>팔로잉 중</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>팔로우</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleStartDm}
                    className="px-4 py-2 rounded-2xl bg-[#FEE500] hover:bg-[#fdd835] text-[#3C1E1E] text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>1:1 DM</span>
                  </button>

                  {/* Super Admin Custom Ban Button */}
                  {iAmAdmin && !isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAdminBanningUser(inspectedUser)}
                      className="px-3 py-2 rounded-2xl bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-black flex items-center gap-1.5 shadow-xs transition"
                      title="최고 관리자 전용 맞춤형 제재 설정"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      <span>👑 관리자 제재</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* User Name & Badges */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black">{inspectedUser.name}</h3>

              {/* Pronouns badge */}
              {inspectedUser.pronouns && (
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#5865F2]/15 text-[#5865F2] dark:text-indigo-300">
                  {inspectedUser.pronouns}
                </span>
              )}

              {/* Super Admin Badge */}
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs flex items-center gap-1">
                  👑 최고 관리자
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">@{inspectedUser.username || inspectedUser.id}</p>
          </div>

          {/* Ban Warning Banner if Inspected User is Banned */}
          {isUserBanned(inspectedUser) && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 mt-2">
              <div className="space-y-0.5 min-w-0">
                <p className="font-extrabold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>활동 제한된 계정 ({formatBanExpiry(inspectedUser.bannedUntil)}까지)</span>
                </p>
                <p className="text-[11px] opacity-90 truncate">
                  사유: {inspectedUser.banReason || "운영 원칙 위반"}
                </p>
              </div>
              {iAmAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`[${inspectedUser.name}] 유저의 차단을 즉시 해제하시겠습니까?`)) {
                      await adminUnbanUser(inspectedUser.id);
                      const next = { ...inspectedUser };
                      delete next.bannedUntil;
                      delete next.banReason;
                      setInspectedUser(next);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shrink-0 transition shadow-xs flex items-center gap-1"
                >
                  <Unlock className="w-3 h-3" />
                  <span>즉시 해제</span>
                </button>
              )}
            </div>
          )}

          {/* Status Message (Kakao-style) */}
          {inspectedUser.statusMessage && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2b2d31] text-xs font-medium text-slate-700 dark:text-slate-300 inline-block max-w-full truncate border border-slate-200/60 dark:border-white/5">
              💬 {inspectedUser.statusMessage}
            </div>
          )}

          {/* Bio */}
          {inspectedUser.bio && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {inspectedUser.bio}
            </p>
          )}

          {/* Follow Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              <strong className="text-slate-900 dark:text-white font-extrabold">
                {counts.followers || 0}
              </strong>{" "}
              팔로워
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white font-extrabold">
                {counts.following || 0}
              </strong>{" "}
              팔로잉
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white font-extrabold">
                {posts.length}
              </strong>{" "}
              게시글
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-white/10 px-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab("posts")}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "posts"
                ? "border-[#5865F2] text-[#5865F2] dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>피드 및 게시글 ({posts.length})</span>
          </button>
        </div>

        {/* Posts & Feed Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Post Creation Box (Visible if viewing own profile or allowed on page) */}
          {isMe && (
            <form
              onSubmit={handleCreatePost}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 space-y-3"
            >
              <div className="flex items-center gap-2">
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-8 h-8 rounded-xl object-cover bg-slate-700"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  새 소식이나 사진/동영상을 공유해 보세요!
                </span>
              </div>

              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="어떤 생각을 하고 계신가요?"
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#5865F2] resize-none"
              />

              {/* Media Preview */}
              {pendingMedia && (
                <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-56 bg-black/5 flex items-center justify-center">
                  {pendingMedia.type === "video" ? (
                    <video
                      src={pendingMedia.url}
                      controls
                      className="max-h-56 max-w-full rounded-xl"
                    />
                  ) : (
                    <img
                      src={pendingMedia.url}
                      alt="첨부 미리보기"
                      className="max-h-56 max-w-full object-contain rounded-xl"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingMedia(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingMedia}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1f22] hover:bg-slate-100 dark:hover:bg-[#35373c] text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-white/10 transition"
                  >
                    {isUploadingMedia ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-3.5 h-3.5 text-[#23a55a]" />
                        <Video className="w-3.5 h-3.5 text-[#5865F2]" />
                        <span>사진 / 동영상 첨부</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPost || (!newPostContent.trim() && !pendingMedia)}
                  className="px-4 py-1.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  {isSubmittingPost ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>게시하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Posts List */}
          {posts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-3xl">📷</span>
              <p className="text-xs font-bold">아직 등록된 게시물이 없습니다.</p>
              <p className="text-[11px]">첫 번째 사진이나 글을 공유해 보세요!</p>
            </div>
          ) : (
            posts.map((post) => {
              const hasLiked = (post.likes || []).includes(currentUser.id);
              const isPostAuthor = post.authorId === currentUser.id;
              const canDelete = isPostAuthor || iAmAdmin;
              const isCommentsOpen = openCommentPostId === post.id;

              return (
                <div
                  key={post.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#2b2d31] border border-slate-200 dark:border-white/10 space-y-3 shadow-xs"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.authorAvatar}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover bg-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{post.authorName}</span>
                          {post.authorPronouns && (
                            <span className="text-[10px] text-slate-400">
                              ({post.authorPronouns})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
                            deletePost(post.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        title={iAmAdmin && !isPostAuthor ? "최고 관리자 권한으로 삭제" : "게시글 삭제"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  {post.content && (
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                  )}

                  {/* Media Content */}
                  {post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 max-h-96 flex items-center justify-center">
                      {post.mediaType === "video" ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          className="max-h-96 max-w-full rounded-2xl"
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt="게시물 사진"
                          className="max-h-96 max-w-full object-contain rounded-2xl"
                        />
                      )}
                    </div>
                  )}

                  {/* Actions: Like & Comment Toggle */}
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300">
                    <button
                      type="button"
                      onClick={() => toggleLikePost(post.id)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-xl transition ${
                        hasLiked
                          ? "bg-rose-500/15 text-rose-500 font-bold"
                          : "hover:bg-slate-100 dark:hover:bg-[#1e1f22]"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          hasLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"
                        }`}
                      />
                      <span>{(post.likes || []).length}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenCommentPostId(isCommentsOpen ? null : post.id)
                      }
                      className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e1f22] transition"
                    >
                      <MessageCircle className="w-4 h-4 text-slate-400" />
                      <span>댓글 {(post.comments || []).length}개</span>
                    </button>
                  </div>

                  {/* Comments Thread (Expandable) */}
                  {isCommentsOpen && (
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5 animate-in fade-in duration-150">
                      {/* Comments List */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {(post.comments || []).map((cmt) => (
                          <div
                            key={cmt.id}
                            className="flex items-start gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#1e1f22] text-xs"
                          >
                            <img
                              src={cmt.authorAvatar}
                              alt=""
                              className="w-6 h-6 rounded-lg object-cover bg-slate-700 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{cmt.authorName}</span>
                                {cmt.authorPronouns && (
                                  <span className="text-[10px] text-slate-400">
                                    {cmt.authorPronouns}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 dark:text-slate-200 mt-0.5 whitespace-pre-wrap break-words">
                                {cmt.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Comment Input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="댓글을 남겨보세요..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1e1f22] border border-slate-200 dark:border-white/10 text-xs focus:outline-hidden focus:ring-1 focus:ring-[#5865F2]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#5865F2] text-white text-xs font-bold hover:bg-[#4752C4] transition"
                        >
                          등록
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
