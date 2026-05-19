"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  PlusSquare, 
  Film, 
  User 
} from "lucide-react";

export default function BottomBar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home },
    { href: "/explore", icon: Search },
    { href: "/?create=true", icon: PlusSquare },
    { href: "/reels", icon: Film },
    { href: "/username", icon: User }, // Username will be dynamic later
  ];

  return (
    <nav className="flex h-full items-center justify-around px-4">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={index}
            href={item.href}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isActive ? "text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Icon className="h-6 w-6" />
          </Link>
        );
      })}
    </nav>
  );
}
