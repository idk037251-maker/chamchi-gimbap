"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import AuthOnboarding from "@/components/AuthOnboarding";
import TopNavigationBar from "@/components/TopNavigationBar";
import HamburgerDrawer from "@/components/HamburgerDrawer";
import CommunityLobby from "@/components/CommunityLobby";
import CommunityChatRoom from "@/components/CommunityChatRoom";
import CreateCommunityModal from "@/components/CreateCommunityModal";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import SupabaseCloudModal from "@/components/SupabaseCloudModal";

export default function HomePage() {
  const { isHydrated, currentUser, activeCommunityId } = useApp();

  // Avoid flashing the login screen before the saved session is restored
  if (!isHydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1e1f22] text-slate-400 text-sm">
        KakaoCord 불러오는 중...
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

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-[#1e1f22]">
      <TopNavigationBar />
      <HamburgerDrawer />

      <main className="flex-1 flex overflow-hidden">
        {activeCommunityId === null ? <CommunityLobby /> : <CommunityChatRoom />}
      </main>

      <CreateCommunityModal />
      <ProfileSettingsModal />
      <SupabaseCloudModal />
    </div>
  );
}
