"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter();
  const pathName = usePathname();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!token) {
      router.replace("/login");
    }

    if ((pathName === "/login" || pathName === "/register") && token) {
      router.push("/");
    }
  }, [token, router]);

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return <>{children}</>;
}
