"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  Compass, 
  Film, 
  MessageSquare, 
  Heart, 
  PlusSquare, 
  User
} from "lucide-react";
import { useGetMyProfileQuery } from "@/store/api/profileApi";
import { getUsernameFromToken } from "@/lib/utils";

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
  const { data: myProfile } = useGetMyProfileQuery();

  const dynamicUsername =
    myProfile?.username ??
    myProfile?.userName ??
    getUsernameFromToken() ??
    "username";

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Search", href: "/explore", icon: Search },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Reels", href: "/reels", icon: Film },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Notifications", href: "#", icon: Heart },
    { label: "Create", href: "/?create=true", icon: PlusSquare },
    { label: "Profile", href: `/${dynamicUsername}`, icon: User },
  ];


  return (
    <div className="flex flex-col h-full p-6 justify-between">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 px-2 py-4">
          <InstagramIcon className="h-7 w-7 text-white block lg:hidden" />
          <span className="font-bold text-xl hidden lg:block font-serif tracking-wider">Instagram</span>
        </Link>

        {/* Navigation items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-900 transition-colors duration-200 ${
                  isActive ? "font-bold text-white bg-zinc-900/50" : "text-zinc-300"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="hidden lg:block text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* More Options / Profile Settings */}
      <div className="px-4 py-3 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors duration-200">
        <span className="hidden lg:block text-zinc-300">More options</span>
      </div>
    </div>
  );
}
