import React from "react";
import Sidebar from "@/components/shared/Sidebar";
import BottomBar from "@/components/shared/BottomBar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-ig-bg text-ig-fg transition-colors duration-300">
        {/* Sidebar - Visible on Desktop/Tablet */}
        {/* We use a relative container of fixed narrow width to act as a spacer, so the feed remains centered and doesn't jump */}
        <div className="hidden md:block w-[76px] flex-shrink-0 h-full relative z-50">
          <div className="absolute top-0 left-0 h-full w-[76px] hover:w-[244px] border-r border-ig-border bg-ig-bg flex flex-col transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-none hover:shadow-[12px_0_36px_rgba(0,0,0,0.08)] dark:hover:shadow-[12px_0_36px_rgba(255,255,255,0.04)] group/sidebar">
            <Sidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 bg-ig-bg text-ig-fg">{children}</main>

        {/* Bottom Navigation - Visible on Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-ig-border bg-ig-bg z-50 transition-colors duration-300">
          <BottomBar />
        </div>
      </div>
    </AuthGuard>
  );
}
