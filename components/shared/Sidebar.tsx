"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme } from "@/store/themeSlice";
import { 
  Home, 
  Search, 
  Compass, 
  Film, 
  MessageSquare, 
  Heart, 
  PlusSquare, 
  User,
  Sun,
  Moon,
  Settings,
  LogOut
} from "lucide-react";
import { logout } from "@/store/slices/authSlice";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: Home, animateClass: "group-hover:animate-home-bounce" },
    { label: "Search", href: "/explore", icon: Search, animateClass: "group-hover:animate-search-wiggle" },
    { label: "Explore", href: "/explore", icon: Compass, animateClass: "group-hover:animate-compass-spin" },
    { label: "Reels", href: "/reels", icon: Film, animateClass: "group-hover:animate-reel-wobble" },
    { label: "Messages", href: "/messages", icon: MessageSquare, animateClass: "group-hover:animate-message-shake" },
    { label: "Notifications", href: "#", icon: Heart, animateClass: "group-hover:animate-heartbeat" },
    { label: "Create", href: "/create", icon: PlusSquare, animateClass: "group-hover:animate-create-spin" },
    { label: "Profile", href: "/username", icon: User, animateClass: "group-hover:scale-110" },
  ];

  return (
    <div className="flex flex-col h-full p-4 justify-between bg-ig-bg border-r border-ig-border transition-colors duration-300">
      <div className="flex flex-col gap-6">
        {/* Logo container with adaptive sizing & transitions */}
        <Link href="/" className="flex items-center h-14 px-3 py-4 relative">
          <div className="flex-shrink-0 transition-all duration-300 group-hover/sidebar:scale-0 group-hover/sidebar:opacity-0">
            <InstagramIcon className="h-7 w-7 text-ig-fg" />
          </div>
          <div className="absolute left-3 opacity-0 scale-50 group-hover/sidebar:opacity-100 group-hover/sidebar:scale-100 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] origin-left">
            <span className="font-instagram text-3xl tracking-wide text-ig-fg select-none">
              Instagram
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-center px-3 py-3.5 rounded-xl hover:bg-ig-sidebar-hover transition-colors duration-200 text-ig-fg group"
              >
                <div className={`relative transition-transform duration-200 group-active:scale-95 flex-shrink-0 ${item.animateClass}`}>
                  <Icon className="h-6 w-6 transition-all duration-200 text-ig-fg" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-base tracking-wide whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] opacity-0 max-w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[160px] group-hover/sidebar:ml-4 ${isActive ? 'font-bold text-ig-active' : 'font-normal text-ig-fg'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* More Options / Profile Settings with Switch Appearance Dropdown */}
      <div className="relative">
        {isMoreOpen && (
          <>
            {/* Backdrop to close click outside */}
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsMoreOpen(false)} />
            
            {/* Dropdown Menu */}
            <div className="absolute bottom-16 left-0 w-[220px] bg-ig-card-bg border border-ig-border rounded-xl shadow-xl p-2 z-50 animate-fade-in flex flex-col gap-1 transition-colors duration-300">
              <button 
                onClick={() => {
                  dispatch(toggleTheme());
                  setIsMoreOpen(false);
                }}
                className="flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg hover:bg-ig-sidebar-hover transition-colors text-ig-fg text-sm cursor-pointer"
              >
                <span className="font-medium">Switch appearance</span>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-orange-400 animate-pulse" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-500" />
                )}
              </button>
              
              <Link
                href="/settings"
                onClick={() => setIsMoreOpen(false)}
                className="flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg hover:bg-ig-sidebar-hover transition-colors text-ig-fg text-sm"
              >
                <span className="font-medium">Settings</span>
                <Settings className="h-4 w-4 text-ig-secondary" />
              </Link>
              
              <div className="h-[1px] bg-ig-border my-1" />
              
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  dispatch(logout());
                  window.location.href = "/login";
                }}
                className="flex items-center justify-between w-full text-left px-3 py-2.5 rounded-lg hover:bg-ig-sidebar-hover transition-colors text-red-500 text-sm cursor-pointer"
              >
                <span className="font-medium">Log out</span>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        <div 
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className="flex items-center px-3 py-3.5 rounded-xl hover:bg-ig-sidebar-hover cursor-pointer transition-colors duration-200 text-ig-fg group"
        >
          <div className="relative transition-transform duration-200 group-active:scale-95 flex-shrink-0 group-hover:scale-110">
            <svg aria-label="Settings" className="h-6 w-6 text-ig-fg transition-all duration-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" height="24" role="img" viewBox="0 0 24 24" width="24">
              <line x1="3" x2="21" y1="4" y2="4"></line>
              <line x1="3" x2="21" y1="12" y2="12"></line>
              <line x1="3" x2="21" y1="20" y2="20"></line>
            </svg>
          </div>
          <span className="text-base tracking-wide whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] opacity-0 max-w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[160px] group-hover/sidebar:ml-4 font-normal text-ig-fg">
            More
          </span>
        </div>
      </div>
    </div>
  );
}
