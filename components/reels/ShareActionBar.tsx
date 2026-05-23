"use client";

import React from "react";
import { Link2, CirclePlus, Share2, Download, MessageSquare } from "lucide-react";

interface ShareActionBarProps {
  onCopyLink: () => void;
  onAddToStory: () => void;
  onShare: () => void;
  onWhatsApp: () => void;
  onDownload: () => void;
  onThreads: () => void;
  onSMS: () => void;
}

// Custom authentic SVG Threads logo
const ThreadsLogo = () => (
  <svg viewBox="0 0 24 24" className="w-[19px] h-[19px] fill-white">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.36 15.3c-.31.08-.6-.11-.68-.42l-.52-1.95c-.93.58-1.98.87-3.03.87-1.46 0-2.73-.55-3.6-1.55C6.73 13.3 6.3 11.97 6.3 10.5c0-1.47.43-2.8 1.23-3.75.87-1 2.14-1.55 3.6-1.55.8 0 1.55.17 2.22.51.52.26.73.9.47 1.42s-.9.73-1.42.47c-.4-.2-.84-.3-1.27-.3-.98 0-1.8.38-2.33 1-.53.63-.82 1.51-.82 2.5 0 1 .29 1.88.82 2.5.53.62 1.35 1 2.33 1 .8 0 1.57-.27 2.17-.77L12 9c0-.44-.06-.88-.18-1.3-.12-.42-.31-.8-.56-1.12-.29-.38-.68-.58-1.16-.58-.5 0-.91.22-1.2.62-.29.41-.44.97-.44 1.63v.36c0 .66.15 1.22.44 1.62.29.4.7.62 1.2.62.48 0 .87-.2 1.16-.58.12-.16.22-.34.3-.53l1.83.6c-.32.6-.82 1.09-1.44 1.43-.62.34-1.32.51-2.07.51-1.15 0-2.08-.43-2.67-1.23S8.4 9.87 8.4 8.76V8.4c0-1.1.28-2.01.83-2.72s1.42-1.07 2.57-1.07c.8 0 1.5.21 2.05.62.55.41.93.97 1.12 1.62.19.65.26 1.34.21 2.01l-1.82 5.46z" />
  </svg>
);

// Custom authentic SVG WhatsApp logo
const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" className="w-[21px] h-[21px] fill-white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function ShareActionBar({
  onCopyLink,
  onAddToStory,
  onShare,
  onWhatsApp,
  onDownload,
  onThreads,
  onSMS,
}: ShareActionBarProps) {
  const actions = [
    {
      name: "Копировать",
      icon: <Link2 className="w-[20px] h-[20px] text-white" />,
      action: onCopyLink,
      bg: "bg-[#262626] hover:bg-[#323232]",
    },
    {
      name: "Добавить в...",
      icon: <CirclePlus className="w-[20px] h-[20px] text-white" />,
      action: onAddToStory,
      bg: "bg-[#262626] hover:bg-[#323232]",
    },
    {
      name: "Поделиться",
      icon: <Share2 className="w-[20px] h-[20px] text-white" />,
      action: onShare,
      bg: "bg-[#262626] hover:bg-[#323232]",
    },
    {
      name: "WhatsApp",
      icon: <WhatsAppLogo />,
      action: onWhatsApp,
      bg: "bg-[#25d366] hover:bg-[#20ba56]",
    },
    {
      name: "Скачать",
      icon: <Download className="w-[20px] h-[20px] text-white" />,
      action: onDownload,
      bg: "bg-[#262626] hover:bg-[#323232]",
    },
    {
      name: "Threads",
      icon: <ThreadsLogo />,
      action: onThreads,
      bg: "bg-[#000000] border border-zinc-800 hover:bg-[#121212]",
    },
    {
      name: "SMS",
      icon: <MessageSquare className="w-[19px] h-[19px] text-white" />,
      action: onSMS,
      bg: "bg-[#007aff] hover:bg-[#006ee6]",
    },
  ];

  return (
    <div className="border-t border-[#2c2c2e] bg-[#1c1c1e] px-4 py-4 sticky bottom-0 z-20">
      {/* Horizontal scroll actions container */}
      <div className="flex items-start gap-[22px] overflow-x-auto scrollbar-none pb-1.5 pt-0.5 px-1.5 select-none">
        {actions.map((act, i) => (
          <button
            key={i}
            onClick={act.action}
            className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none flex-shrink-0"
          >
            {/* Round bubble button with active-touch popup */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-100 group-active:scale-[0.88] group-hover:scale-105 shadow-md ${act.bg}`}
            >
              {act.icon}
            </div>
            {/* Label below */}
            <span className="text-[10px] font-semibold text-zinc-400 group-hover:text-white transition-colors text-center w-[68px] truncate leading-tight select-none">
              {act.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
