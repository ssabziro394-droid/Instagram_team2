"use client";

import { CheckCircle2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import CreatePostModal from "./CreatePostModal";

type CreatePostModalGateProps = {
  onPostCreated?: () => void;
};

export default function CreatePostModalGate({
  onPostCreated,
}: CreatePostModalGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<string | null>(null);

  const isOpen = searchParams.get("create") === "true";

  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleCreated = () => {
    setToast("Пост успешно опубликован");
    closeModal();
    onPostCreated?.();
    router.refresh();
  };

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  return (
    <>
      {isOpen ? (
        <CreatePostModal onClose={closeModal} onCreated={handleCreated} />
      ) : null}

      {toast ? (
        <div className="fixed right-4 top-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-emerald-500/30 bg-zinc-950 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{toast}</span>
        </div>
      ) : null}
    </>
  );
}
