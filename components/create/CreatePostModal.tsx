"use client";

/* eslint-disable @next/next/no-img-element */

import axios from "axios";
import {
  ArrowLeft,
  ChevronDown,
  Crop,
  ImagePlus,
  Loader2,
  MapPin,
  SlidersHorizontal,
  Smile,
  UserPlus,
  X,
  ZoomIn,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGetMyProfileQuery } from "@/store/api/profileApi";
import type { UserProfile } from "@/types/profile";

type CreatePostModalProps = {
  onClose: () => void;
  onCreated?: () => void;
};

type Step = "upload" | "crop" | "edit" | "share";
type MediaKind = "image" | "video";
type AspectRatio = "original" | "square" | "portrait" | "landscape";
type EditTab = "filters" | "settings";
type AccordionKey = "accessibility" | "advanced";

const MAX_CONTENT_LENGTH = 200;
const EMOJIS = ["😀", "😍", "🔥", "✨", "❤️", "👏", "📍", "🌙", "💫", "🎉"];

const FILTERS = [
  { name: "Original", css: "none" },
  {
    name: "Aden",
    css: "sepia(0.18) brightness(1.12) saturate(1.35) hue-rotate(-18deg)",
  },
  {
    name: "Clarendon",
    css: "contrast(1.24) saturate(1.35) brightness(1.04)",
  },
  {
    name: "Crema",
    css: "sepia(0.16) contrast(0.92) brightness(1.08) saturate(0.86)",
  },
  {
    name: "Gingham",
    css: "brightness(1.07) hue-rotate(-10deg) contrast(0.9) saturate(0.88)",
  },
  {
    name: "Juno",
    css: "contrast(1.12) saturate(1.45) hue-rotate(-8deg)",
  },
  {
    name: "Lark",
    css: "brightness(1.08) contrast(0.96) saturate(1.28)",
  },
  {
    name: "Ludwig",
    css: "sepia(0.12) contrast(1.08) brightness(1.05) saturate(1.1)",
  },
  {
    name: "Moon",
    css: "grayscale(1) contrast(1.12) brightness(1.08)",
  },
];

const ASPECT_RATIOS: Array<{
  id: AspectRatio;
  label: string;
  value?: string;
}> = [
  { id: "original", label: "Original" },
  { id: "square", label: "1:1", value: "1 / 1" },
  { id: "portrait", label: "4:5", value: "4 / 5" },
  { id: "landscape", label: "16:9", value: "16 / 9" },
];

function getUsername(profile?: UserProfile) {
  return profile?.username ?? profile?.userName ?? "username";
}

function getAvatarUrl(profile?: UserProfile) {
  return (
    profile?.avatar ??
    profile?.image ??
    profile?.avatarUrl ??
    profile?.imageUrl ??
    ""
  );
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}

function generateVideoThumbnails(file: File, count: number): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    
    video.onloadedmetadata = async () => {
      const thumbnails: string[] = [];
      const duration = video.duration;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      canvas.width = 160;
      canvas.height = 120;
      
      for (let i = 0; i < count; i++) {
        const time = (duration / Math.max(1, count - 1)) * i;
        await seekVideo(video, time);
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnails.push(canvas.toDataURL("image/jpeg", 0.7));
        }
      }
      resolve(thumbnails);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      resolve([]);
    };
  });
}

function trimVideo(file: File, startTime: number, endTime: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      video.currentTime = startTime;
      
      const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();
      if (!stream) {
        resolve(file);
        return;
      }

      const chunks: BlobPart[] = [];
      let recorder: MediaRecorder;
      const options = { 
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 1200000 // 1.2 Mbps
      };
      
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        try {
          recorder = new MediaRecorder(stream, { 
            mimeType: "video/webm",
            videoBitsPerSecond: 1200000
          });
        } catch (e2) {
          try {
            recorder = new MediaRecorder(stream, { videoBitsPerSecond: 1200000 });
          } catch (e3) {
            resolve(file);
            return;
          }
        }
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        const trimmedFile = new File([blob], file.name, { type: "video/mp4" });
        resolve(trimmedFile);
      };

      video.onseeked = () => {
        video.onseeked = null;
        recorder.start();
        video.play();
        
        const durationMs = (endTime - startTime) * 1000;
        setTimeout(() => {
          recorder.stop();
          video.pause();
          URL.revokeObjectURL(video.src);
        }, durationMs);
      };
    };

    video.onerror = () => {
      reject(new Error("Error loading video"));
    };
  });
}

function isSupportedMedia(file: File) {
  if (!file.name) return false;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isImageExt = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext);
  const isVideoExt = ["mp4", "mov", "webm", "avi", "mkv", "3gp", "mpeg", "ogv"].includes(ext);

  return (
    file.type.startsWith("image/") ||
    file.type.startsWith("video/") ||
    isImageExt ||
    isVideoExt
  );
}

function getMediaKind(file: File | null): MediaKind {
  if (!file) return "image";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isVideoExt = ["mp4", "mov", "webm", "avi", "mkv", "3gp", "mpeg", "ogv"].includes(ext);
  return file.type.startsWith("video/") || isVideoExt ? "video" : "image";
}

function Header({
  title,
  canGoBack,
  nextLabel,
  onBack,
  onNext,
  onClose,
}: {
  title: string;
  canGoBack?: boolean;
  nextLabel?: string;
  onBack?: () => void;
  onNext?: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="grid h-11 grid-cols-[48px_1fr_96px] items-center border-b border-zinc-800 px-1 sm:px-2">
      <div className="flex items-center">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-white transition hover:bg-zinc-900"
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <h2 className="truncate text-center text-base font-semibold text-white">
        {title}
      </h2>
      <div className="flex justify-end">
        {nextLabel && onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-sky-400 transition hover:text-sky-300"
          >
            {nextLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MediaPreview({
  previewUrl,
  mediaKind,
  filter,
  zoom = 1,
  aspectRatio = "original",
  showControls = true,
}: {
  previewUrl: string;
  mediaKind: MediaKind;
  filter: string;
  zoom?: number;
  aspectRatio?: AspectRatio;
  showControls?: boolean;
}) {
  const aspect = ASPECT_RATIOS.find((item) => item.id === aspectRatio)?.value;
  const mediaStyle = {
    filter,
    transform: `scale(${zoom})`,
  };

  return (
    <div className="relative flex h-full min-h-[320px] w-full items-center justify-center overflow-hidden bg-black sm:min-h-[540px]">
      <div
        className="flex h-full max-h-full w-full max-w-full items-center justify-center overflow-hidden bg-black"
        style={aspect ? { aspectRatio: aspect } : undefined}
      >
        {mediaKind === "video" ? (
          <video
            src={previewUrl}
            controls={showControls}
            className="h-full max-h-full w-full max-w-full object-contain transition duration-200"
            style={mediaStyle}
          />
        ) : (
          <img
            src={previewUrl}
            alt="Selected post media"
            className="h-full max-h-full w-full max-w-full object-contain transition duration-200"
            style={mediaStyle}
          />
        )}
      </div>
    </div>
  );
}

function UploadStep({
  isDragging,
  error,
  inputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onPickFile,
  onChooseClick,
  onClose,
}: {
  isDragging: boolean;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onPickFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onChooseClick: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <Header title="Создание публикации" onClose={onClose} />
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex min-h-[520px] flex-col items-center justify-center gap-5 px-6 text-center transition ${
          isDragging ? "bg-zinc-900/70" : "bg-black"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={onPickFile}
        />
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950 text-zinc-200">
          <ImagePlus className="h-11 w-11" />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-light text-white">
            Перетащите сюда фото или видео
          </p>
          <p className="text-sm text-zinc-500">
            Поддерживается выбор одного файла для публикации.
          </p>
        </div>
        <button
          type="button"
          onClick={onChooseClick}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Выбрать на компьютере
        </button>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </>
  );
}

function CropStep({
  previewUrl,
  mediaKind,
  zoom,
  aspectRatio,
  onZoomChange,
  onAspectRatioChange,
  onBack,
  onNext,
}: {
  previewUrl: string;
  mediaKind: MediaKind;
  zoom: number;
  aspectRatio: AspectRatio;
  onZoomChange: (value: number) => void;
  onAspectRatioChange: (value: AspectRatio) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <Header
        title="Обрезать"
        canGoBack
        nextLabel="Далее"
        onBack={onBack}
        onNext={onNext}
      />
      <div className="flex min-h-[560px] flex-col bg-black md:flex-row">
        <div className="min-h-[360px] flex-1">
          <MediaPreview
            previewUrl={previewUrl}
            mediaKind={mediaKind}
            filter="none"
            zoom={zoom}
            aspectRatio={aspectRatio}
          />
        </div>
        <aside className="w-full border-t border-zinc-800 p-4 md:w-72 md:border-l md:border-t-0">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Crop className="h-4 w-4" />
              Crop
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Aspect ratio
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => onAspectRatioChange(ratio.id)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      aspectRatio === ratio.id
                        ? "border-white bg-white text-black"
                        : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-600"
                    }`}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-zinc-200">
                <span className="inline-flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </span>
                <span className="text-zinc-500">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={zoom}
                onChange={(event) => onZoomChange(Number(event.target.value))}
                className="w-full accent-white"
              />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:text-white"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Crop controls
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function EditStep({
  previewUrl,
  mediaKind,
  selectedFilter,
  editTab,
  filter,
  brightness,
  contrast,
  saturation,
  onFilterChange,
  onTabChange,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onBack,
  onNext,
  videoDuration,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  videoThumbnails,
  soundEnabled,
  onSoundToggle,
}: {
  previewUrl: string;
  mediaKind: MediaKind;
  selectedFilter: string;
  editTab: EditTab;
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  onFilterChange: (value: string) => void;
  onTabChange: (value: EditTab) => void;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onBack: () => void;
  onNext: () => void;
  videoDuration: number;
  startTime: number;
  endTime: number;
  onStartTimeChange: (val: number) => void;
  onEndTimeChange: (val: number) => void;
  videoThumbnails: string[];
  soundEnabled: boolean;
  onSoundToggle: () => void;
}) {
  return (
    <>
      <Header
        title="Редактировать"
        canGoBack
        nextLabel="Далее"
        onBack={onBack}
        onNext={onNext}
      />
      <div className="flex min-h-[560px] flex-col bg-black md:flex-row">
        <div className="min-h-[360px] flex-1">
          <MediaPreview
            previewUrl={previewUrl}
            mediaKind={mediaKind}
            filter={filter}
            showControls={mediaKind === "video"}
          />
        </div>
        <aside className="w-full border-t border-zinc-800 md:w-80 md:border-l md:border-t-0">
          {mediaKind === "video" ? (
            <div className="p-5 space-y-6 text-white overflow-y-auto max-h-[520px]">
              {/* Cover Photo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Фото обложки</span>
                  <button type="button" className="text-xs text-sky-500 font-semibold hover:underline">
                    Выбрать на компьютере
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1 bg-zinc-900/40 p-1.5 rounded border border-zinc-800">
                  {videoThumbnails.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      className="aspect-[4/5] rounded overflow-hidden border border-transparent hover:border-white transition"
                    >
                      <img src={src} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Trimmer */}
              <div className="space-y-3">
                <span className="text-sm font-semibold block">Обрезать</span>
                
                {/* Visual Timeline Trimmer */}
                <div className="relative h-14 w-full rounded border border-zinc-800 overflow-hidden bg-zinc-950/40">
                  <div className="absolute inset-0 flex">
                    {videoThumbnails.map((src, i) => (
                      <img key={i} src={src} className="h-full flex-1 object-cover opacity-60 pointer-events-none" />
                    ))}
                  </div>
                  
                  {/* Selected Range Highlight Overlay */}
                  {videoDuration > 0 && (
                    <div
                      className="absolute top-0 bottom-0 border-y-2 border-white bg-white/10"
                      style={{
                        left: `${(startTime / videoDuration) * 100}%`,
                        right: `${100 - (endTime / videoDuration) * 100}%`,
                      }}
                    />
                  )}
                </div>

                {/* Range Sliders Controls */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Начало: {startTime.toFixed(1)}c.</span>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={startTime}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val < endTime) {
                            onStartTimeChange(val);
                          }
                        }}
                        className="w-2/3 accent-white"
                      />
                    </label>
                    <label className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Конец: {endTime.toFixed(1)}c.</span>
                      <input
                        type="range"
                        min="0"
                        max={videoDuration}
                        step="0.1"
                        value={endTime}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > startTime && val - startTime <= 10) {
                            onEndTimeChange(val);
                          } else if (val > startTime && val - startTime > 10) {
                            onEndTimeChange(val);
                            onStartTimeChange(val - 10);
                          }
                        }}
                        className="w-2/3 accent-white"
                      />
                    </label>
                  </div>
                  
                  <p className="text-[10px] text-zinc-500">
                    Максимальная длительность видео — 10 секунд.
                  </p>
                </div>
              </div>

              {/* Sound Toggle Switch */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-sm font-semibold">Звук включен</span>
                <button
                  type="button"
                  onClick={onSoundToggle}
                  className={`relative h-6 w-11 rounded-full transition ${
                    soundEnabled ? "bg-sky-500" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      soundEnabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 border-b border-zinc-800">
                {(["filters", "settings"] as EditTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => onTabChange(tab)}
                    className={`h-12 text-sm font-semibold transition ${
                      editTab === tab
                        ? "border-b border-white text-white"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {tab === "filters" ? "Filters" : "Settings"}
                  </button>
                ))}
              </div>

              {editTab === "filters" ? (
                <div className="grid grid-cols-3 gap-3 p-4 md:grid-cols-2">
                  {FILTERS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => onFilterChange(item.name)}
                      className="group text-left"
                    >
                      <div
                        className={`aspect-square overflow-hidden rounded-sm border bg-zinc-950 transition ${
                          selectedFilter === item.name
                            ? "border-sky-400"
                            : "border-zinc-800 group-hover:border-zinc-600"
                        }`}
                      >
                          <img
                            src={previewUrl}
                            alt={`${item.name} filter preview`}
                            className="h-full w-full object-cover"
                            style={{ filter: item.css }}
                          />
                      </div>
                      <span
                        className={`mt-1 block truncate text-center text-xs ${
                          selectedFilter === item.name
                            ? "font-semibold text-sky-400"
                            : "text-zinc-400"
                        }`}
                      >
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 p-5">
                  <SettingSlider
                    label="Brightness"
                    value={brightness}
                    onChange={onBrightnessChange}
                  />
                  <SettingSlider
                    label="Contrast"
                    value={contrast}
                    onChange={onContrastChange}
                  />
                  <SettingSlider
                    label="Saturation"
                    value={saturation}
                    onChange={onSaturationChange}
                  />
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </>
  );
}

function SettingSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block space-y-3">
      <span className="flex items-center justify-between text-sm text-zinc-200">
        <span>{label}</span>
        <span className="text-zinc-500">{value}</span>
      </span>
      <input
        type="range"
        min="50"
        max="150"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-white"
      />
    </label>
  );
}

function Accordion({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left text-sm text-white"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen ? <div className="pb-4 text-sm text-zinc-400">{children}</div> : null}
    </div>
  );
}

function ShareStep({
  previewUrl,
  mediaKind,
  filter,
  content,
  location,
  username,
  avatarUrl,
  isEmojiOpen,
  isSharing,
  error,
  openAccordions,
  shareEverywhere,
  textareaRef,
  onBack,
  onContentChange,
  onLocationChange,
  onToggleEmoji,
  onAddEmoji,
  onToggleAccordion,
  onShareEverywhereChange,
  onSubmit,
}: {
  previewUrl: string;
  mediaKind: MediaKind;
  filter: string;
  content: string;
  location: string;
  username: string;
  avatarUrl: string;
  isEmojiOpen: boolean;
  isSharing: boolean;
  error: string | null;
  openAccordions: Record<AccordionKey, boolean>;
  shareEverywhere: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onBack: () => void;
  onContentChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onToggleEmoji: () => void;
  onAddEmoji: (emoji: string) => void;
  onToggleAccordion: (key: AccordionKey) => void;
  onShareEverywhereChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <Header title="Создать публикацию" canGoBack onBack={onBack} />
      <div className="flex max-h-[calc(100vh-7rem)] min-h-[560px] flex-col overflow-hidden bg-black md:flex-row">
        <div className="min-h-[300px] flex-1 border-b border-zinc-800 md:border-b-0">
          <MediaPreview
            previewUrl={previewUrl}
            mediaKind={mediaKind}
            filter={filter}
            showControls={mediaKind === "video"}
          />
        </div>

        <aside className="w-full overflow-y-auto md:w-[360px] md:border-l md:border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-4">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 bg-cover bg-center text-xs font-semibold text-zinc-400"
              style={
                avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined
              }
            >
              {!avatarUrl && username.charAt(0).toUpperCase()}
            </div>
            <span className="min-w-0 truncate text-sm font-semibold text-white">
              {username}
            </span>
          </div>

          <div className="px-4">
            <textarea
              ref={textareaRef}
              value={content}
              maxLength={MAX_CONTENT_LENGTH}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="Напишите подпись..."
              rows={7}
              className="w-full resize-none bg-black text-sm text-white outline-none placeholder:text-zinc-500"
            />
            <div className="relative flex items-center justify-between border-b border-zinc-800 pb-3 text-zinc-500">
              <button
                type="button"
                onClick={onToggleEmoji}
                className="rounded-full p-1 transition hover:bg-zinc-900 hover:text-white"
                aria-label="Добавить emoji"
              >
                <Smile className="h-5 w-5" />
              </button>
              <span className="text-xs">
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
              {isEmojiOpen ? (
                <div className="absolute left-0 top-9 z-10 grid w-56 grid-cols-5 gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onAddEmoji(emoji)}
                      className="rounded-md p-2 text-lg transition hover:bg-zinc-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-900/60 bg-red-950/20 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}
          </div>

          <div className="px-4">
            <label className="flex items-center gap-2 border-b border-zinc-800 py-4">
              <input
                value={location}
                onChange={(event) => onLocationChange(event.target.value)}
                placeholder="Добавить место"
                className="min-w-0 flex-1 bg-black text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <MapPin className="h-5 w-5 text-zinc-500" />
            </label>

            <button
              type="button"
              className="flex w-full items-center justify-between border-b border-zinc-800 py-4 text-left text-sm text-white"
            >
              <span>Добавить соавторов</span>
              <UserPlus className="h-5 w-5 text-zinc-500" />
            </button>

            <div className="flex items-center justify-between border-b border-zinc-800 py-4">
              <span className="text-sm text-white">Где поделиться</span>
              <button
                type="button"
                onClick={() => onShareEverywhereChange(!shareEverywhere)}
                className={`relative h-6 w-11 rounded-full transition ${
                  shareEverywhere ? "bg-sky-500" : "bg-zinc-700"
                }`}
                aria-pressed={shareEverywhere}
                aria-label="Где поделиться"
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    shareEverywhere ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <Accordion
              title="Специальные возможности"
              isOpen={openAccordions.accessibility}
              onToggle={() => onToggleAccordion("accessibility")}
            >
              <label className="block space-y-2">
                <span className="text-xs text-zinc-500">
                  Альтернативный текст
                </span>
                <input
                  placeholder="Описание изображения"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-zinc-600"
                />
              </label>
            </Accordion>

            <Accordion
              title="Расширенные настройки"
              isOpen={openAccordions.advanced}
              onToggle={() => onToggleAccordion("advanced")}
            >
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3">
                  <span>Скрыть число отметок Нравится</span>
                  <input type="checkbox" className="accent-white" />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Выключить комментарии</span>
                  <input type="checkbox" className="accent-white" />
                </label>
              </div>
            </Accordion>

            <div className="sticky bottom-0 bg-black py-4">
              <button
                type="submit"
                disabled={isSharing}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Публикация...
                  </>
                ) : (
                  "Поделиться"
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

export default function CreatePostModal({
  onClose,
  onCreated,
}: CreatePostModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewUrlRef = useRef("");
  const { data: profile } = useGetMyProfileQuery();

  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("original");
  const [selectedFilter, setSelectedFilter] = useState("Original");
  const [editTab, setEditTab] = useState<EditTab>("filters");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [shareEverywhere, setShareEverywhere] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<
    Record<AccordionKey, boolean>
  >({
    accessibility: false,
    advanced: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [videoThumbnails, setVideoThumbnails] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const mediaKind = getMediaKind(selectedFile);
  const username = getUsername(profile);
  const avatarUrl = getAvatarUrl(profile);

  const selectedFilterCss = useMemo(
    () => FILTERS.find((filter) => filter.name === selectedFilter)?.css ?? "none",
    [selectedFilter],
  );

  const computedFilter = useMemo(() => {
    const settingsFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    return selectedFilterCss === "none"
      ? settingsFilter
      : `${selectedFilterCss} ${settingsFilter}`;
  }, [brightness, contrast, saturation, selectedFilterCss]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSharing) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSharing, onClose]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setPreviewUrl("");
  };

  const resetForm = () => {
    setStep("upload");
    setSelectedFile(null);
    clearPreviewUrl();
    setZoom(1);
    setAspectRatio("original");
    setSelectedFilter("Original");
    setEditTab("filters");
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setContent("");
    setLocation("");
    setIsEmojiOpen(false);
    setShareEverywhere(false);
    setOpenAccordions({ accessibility: false, advanced: false });
    setError(null);
    setVideoDuration(0);
    setStartTime(0);
    setEndTime(0);
    setVideoThumbnails([]);
    setSoundEnabled(true);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFile = (file?: File) => {
    setError(null);

    if (!file) {
      setError("Выберите фото");
      return;
    }

    if (!isSupportedMedia(file)) {
      setError("Выберите фото или видео");
      return;
    }

    resetForm();
    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setStep("crop");

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isVideo = file.type.startsWith("video/") || ["mp4", "mov", "webm", "avi", "mkv", "3gp", "mpeg", "ogv"].includes(ext);

    if (isVideo) {
      const tempVideo = document.createElement("video");
      tempVideo.src = nextPreviewUrl;
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.onloadedmetadata = () => {
        setVideoDuration(tempVideo.duration);
        setEndTime(Math.min(10, tempVideo.duration));
        
        generateVideoThumbnails(file, 5).then((urls) => {
          setVideoThumbnails(urls);
        });
      };
    }
  };

  const handlePickFile = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleAddEmoji = (emoji: string) => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? content.length;
    const end = element?.selectionEnd ?? content.length;
    const nextContent = `${content.slice(0, start)}${emoji}${content.slice(end)}`.slice(
      0,
      MAX_CONTENT_LENGTH,
    );

    setContent(nextContent);
    requestAnimationFrame(() => {
      const nextPosition = Math.min(start + emoji.length, MAX_CONTENT_LENGTH);
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextPosition, nextPosition);
    });
  };

  const handleToggleAccordion = (key: AccordionKey) => {
    setOpenAccordions((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleShare = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Выберите фото");
      setStep("upload");
      return;
    }

    if (!content.trim()) {
      setError("Добавьте описание публикации");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Вы не авторизованы, войдите в аккаунт");
      return;
    }

    const title = content.trim().slice(0, 80);
    const formData = new FormData();
    formData.append("Title", title);
    formData.append("Content", content.trim());

    let fileToUpload = selectedFile;
    const isLargeFile = selectedFile.size > 5 * 1024 * 1024; // > 5MB
    if (mediaKind === "video" && (startTime > 0 || endTime < videoDuration || isLargeFile)) {
      try {
        setIsSharing(true);
        setError("Сжатие и обрезка видео для обхода лимита размера... Пожалуйста, подождите (до 10 секунд).");
        fileToUpload = await trimVideo(selectedFile, startTime, endTime);
      } catch (trimErr) {
        console.error("Trimming/Compression failed, sending original:", trimErr);
      }
    }
    formData.append("Images", fileToUpload);

    try {
      setIsSharing(true);
      await axios.post(
        "https://instagram-api.softclub.tj/Post/add-post",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      resetForm();
      setIsSharing(false);
      onCreated?.();
    } catch (requestError) {
      if (
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 401
      ) {
        setError("Вы не авторизованы, войдите в аккаунт");
      } else {
        let msg = "Не удалось опубликовать пост. Попробуйте еще раз";
        if (axios.isAxiosError(requestError) && requestError.response?.data) {
          const data = requestError.response.data;
          if (Array.isArray(data.errors) && data.errors.length > 0) {
            msg = data.errors[0];
          } else if (data.message) {
            msg = data.message;
          } else if (typeof data === "string") {
            msg = data;
          }
        }
        setError(msg);
      }
      setIsSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-0 py-0 sm:px-5 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Create post"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSharing) {
          onClose();
        }
      }}
    >
      <div className="h-full w-full overflow-hidden bg-black text-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-xl sm:border sm:border-zinc-800">
        {step === "upload" ? (
          <UploadStep
            isDragging={isDragging}
            error={error}
            inputRef={inputRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPickFile={handlePickFile}
            onChooseClick={() => inputRef.current?.click()}
            onClose={onClose}
          />
        ) : null}

        {step === "crop" && previewUrl ? (
          <CropStep
            previewUrl={previewUrl}
            mediaKind={mediaKind}
            zoom={zoom}
            aspectRatio={aspectRatio}
            onZoomChange={setZoom}
            onAspectRatioChange={setAspectRatio}
            onBack={() => {
              resetForm();
              setStep("upload");
            }}
            onNext={() => setStep("edit")}
          />
        ) : null}

        {step === "edit" && previewUrl ? (
          <EditStep
            previewUrl={previewUrl}
            mediaKind={mediaKind}
            selectedFilter={selectedFilter}
            editTab={editTab}
            filter={computedFilter}
            brightness={brightness}
            contrast={contrast}
            saturation={saturation}
            onFilterChange={setSelectedFilter}
            onTabChange={setEditTab}
            onBrightnessChange={setBrightness}
            onContrastChange={setContrast}
            onSaturationChange={setSaturation}
            onBack={() => setStep("crop")}
            onNext={() => setStep("share")}
            videoDuration={videoDuration}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            videoThumbnails={videoThumbnails}
            soundEnabled={soundEnabled}
            onSoundToggle={() => setSoundEnabled(!soundEnabled)}
          />
        ) : null}

        {step === "share" && previewUrl ? (
          <ShareStep
            previewUrl={previewUrl}
            mediaKind={mediaKind}
            filter={computedFilter}
            content={content}
            location={location}
            username={username}
            avatarUrl={avatarUrl}
            isEmojiOpen={isEmojiOpen}
            isSharing={isSharing}
            error={error}
            openAccordions={openAccordions}
            shareEverywhere={shareEverywhere}
            textareaRef={textareaRef}
            onBack={() => setStep("edit")}
            onContentChange={(value) =>
              setContent(value.slice(0, MAX_CONTENT_LENGTH))
            }
            onLocationChange={setLocation}
            onToggleEmoji={() => setIsEmojiOpen((current) => !current)}
            onAddEmoji={handleAddEmoji}
            onToggleAccordion={handleToggleAccordion}
            onShareEverywhereChange={setShareEverywhere}
            onSubmit={handleShare}
          />
        ) : null}
      </div>
    </div>
  );
}
