"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { isUserBanned, formatBanExpiry } from "@/types/chat";
import AuthOnboarding from "@/components/AuthOnboarding";
import TopNavigationBar from "@/components/TopNavigationBar";
import HamburgerDrawer from "@/components/HamburgerDrawer";
import CommunityLobby from "@/components/CommunityLobby";
import CommunityChatRoom from "@/components/CommunityChatRoom";
import DmChatRoom from "@/components/DmChatRoom";
import DmListDrawer from "@/components/DmListDrawer";
import UserProfileDetailModal from "@/components/UserProfileDetailModal";
import CreateCommunityModal from "@/components/CreateCommunityModal";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import SupabaseCloudModal from "@/components/SupabaseCloudModal";
import SupportInquiryModal from "@/components/SupportInquiryModal";
import ReportMessageModal from "@/components/ReportMessageModal";
import AdminBanModal from "@/components/AdminBanModal";
import { ShieldAlert } from "lucide-react";

export default function HomePage() {
  const { isHydrated, currentUser, activeCommunityId, activeDmUser } = useApp();

  // Avoid flashing the login screen before the saved session is restored
  if (!isHydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1f22] text-slate-400 text-sm">
        참치김밥 불러오는 중...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthOnboarding />
        <SupabaseCloudModal />
      </>
    );
  }

  const isBanned = isUserBanned(currentUser);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-[#1e1f22]">
      {/* Account Suspension Banner */}
      {isBanned && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between z-30 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#FEE500] shrink-0" />
            <span>
              ⚠️ 이용 규정 위반으로 계정 활동이 일시 제한되었습니다. (해제 일시: {formatBanExpiry(currentUser.bannedUntil)} / 사유: {currentUser.banReason || "운영 원칙 위반"})
            </span>
          </div>
          <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded-full hidden md:inline">
            대화, 게시물 작성 및 팔로우 제한
          </span>
        </div>
      )}

      <TopNavigationBar />
      <HamburgerDrawer />

      <main className="flex-1 flex overflow-hidden">
        {activeDmUser !== null ? (
          <DmChatRoom />
        ) : activeCommunityId === null ? (
          <CommunityLobby />
        ) : (
          <CommunityChatRoom />
        )}
      </main>

      <CreateCommunityModal />
      <ProfileSettingsModal />
      <SupabaseCloudModal />
      <UserProfileDetailModal />
      <DmListDrawer />
      <SupportInquiryModal />
      <ReportMessageModal />
      <AdminBanModal />
    </div>
  );
}