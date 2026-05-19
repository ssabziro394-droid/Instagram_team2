import React from "react";
import Sidebar from "@/components/shared/Sidebar";
import BottomBar from "@/components/shared/BottomBar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      {/* Sidebar - Visible on Desktop/Tablet */}
      <div className="hidden md:flex md:w-64 border-r border-zinc-800 flex-col h-full">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation - Visible on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-800 bg-black z-50">
        <BottomBar />
      </div>
    </div>
  );
}
