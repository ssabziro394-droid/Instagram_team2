"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Phone,
  Video,
  Info,
  Smile,
  Mic,
  Image as ImageIcon,
  SendHorizontal,
  X,
  StopCircle,
  Trash2,
  ChevronLeft,
  ChevronDown,
  Play,
  Music,
} from "lucide-react";
import Link from "next/link";
import {
  useGetChatByIdQuery,
  useSendMessageMutation,
  useGetChatsQuery,
  useGetMyProfileQuery,
  useDeleteMessageMutation,
} from "@/store/api/chatApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { jwtDecode } from "jwt-decode";

interface ChatAreaProps {
  chatId: number | null;
  onNewMessageTrigger: () => void;
  onBack?: () => void;
}

const chatSchema = z.object({
  messageText: z.string().max(100, "Message is too long").optional(),
  file: z.instanceof(File).optional(),
});

type ChatFormValues = z.infer<typeof chatSchema>;

const getUserIdFromToken = (token: string | null) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode<any>(token);
    return decoded.sid;
  } catch (e) {
    return null;
  }
};

const DefaultAvatar = ({ className = "w-11 h-11" }: { className?: string }) => (
  <div
    className={clsx(
      className,
      "rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 overflow-hidden shrink-0 border border-zinc-700/50",
    )}
  >
    <svg
      className="w-2/3 h-2/3 text-zinc-500"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  </div>
);

const resolveFileUrl = (url: string | null | undefined) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url.slice(1) : url;
  return `https://instagram-api.softclub.tj/images/${cleanUrl}`;
};

const isAudioFile = (url: string) => {
  const cleanUrl = url.toLowerCase().split("?")[0];
  return (
    cleanUrl.endsWith(".mp3") ||
    cleanUrl.endsWith(".wav") ||
    cleanUrl.endsWith(".ogg") ||
    cleanUrl.endsWith(".m4a") ||
    cleanUrl.endsWith(".webm") ||
    url.includes("voice.mp3") ||
    url.includes("audio/") ||
    url.includes("voice-message")
  );
};

const isVideoFile = (url: string) => {
  const cleanUrl = url.toLowerCase().split("?")[0];
  return (
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".mov") ||
    cleanUrl.endsWith(".avi") ||
    cleanUrl.endsWith(".mkv") ||
    url.includes("video/")
  );
};

const renderAvatar = (
  src: string | null | undefined,
  className = "w-11 h-11",
  alt = "User",
) => {
  if (
    !src ||
    src.trim() === "" ||
    src.includes("placeholder") ||
    src.includes("pravatar.cc")
  ) {
    return <DefaultAvatar className={className} />;
  }
  const resolved = resolveFileUrl(src);
  return (
    <img
      src={resolved}
      alt={alt}
      className={clsx(className, "rounded-full object-cover shrink-0")}
    />
  );
};

const AudioPlayer = ({ src, isOwn }: { src: string; isOwn: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      const allAudios = document.querySelectorAll("audio");
      allAudios.forEach((audio) => {
        if (audio !== audioRef.current) {
          audio.pause();
        }
      });
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    let newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(newRate);
    audioRef.current.playbackRate = newRate;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const duration = audioRef.current.duration;
    if (duration) {
      audioRef.current.currentTime = (clickX / width) * duration;
    }
  };

  return (
    <div className="flex items-center gap-3 py-1 min-w-[220px] max-w-full select-none">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        className={clsx(
          "w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer",
          isOwn
            ? "bg-white text-[#3797F0] hover:bg-zinc-100"
            : "bg-[#3797F0] text-white hover:bg-[#1877f2]",
        )}
      >
        {isPlaying ? (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <rect x="5" y="4" width="3" height="16" rx="1" />
            <rect x="16" y="4" width="3" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div
          onClick={handleProgressClick}
          className={clsx(
            "h-1.5 rounded-full overflow-hidden relative cursor-pointer",
            isOwn
              ? "bg-white/30 hover:bg-white/40"
              : "bg-zinc-700 hover:bg-zinc-600",
          )}
        >
          <div
            className={clsx(
              "absolute top-0 left-0 h-full rounded-full",
              isOwn ? "bg-white" : "bg-[#3797F0]",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px]">
          <span className={clsx(isOwn ? "text-blue-100" : "text-zinc-400")}>
            {isPlaying ? "Playing" : "Voice message"}
          </span>
          <span className={clsx(isOwn ? "text-blue-100/80" : "text-zinc-400")}>
            {audioRef.current && audioRef.current.duration
              ? `${Math.floor(audioRef.current.currentTime / 60)}:${(
                  Math.floor(audioRef.current.currentTime) % 60
                )
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )} / ${Math.floor(audioRef.current.duration / 60)}:${(
                  Math.floor(audioRef.current.duration) % 60
                )
                  .toString()
                  .padStart(2, "0")}`
              : "0:00"}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSpeed();
            }}
            className={clsx(
              "ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer border",
              isOwn
                ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                : "bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 border-zinc-600/50",
            )}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};

const VideoPlayerPreview = ({
  src,
  onClick,
  className,
}: {
  src: string;
  onClick: () => void;
  className?: string;
}) => {
  return (
    <div
      className={clsx(
        "relative group/vid max-w-full overflow-hidden cursor-pointer bg-black flex items-center justify-center",
        className,
      )}
      onClick={onClick}
    >
      <video
        src={src}
        className="max-w-full w-full h-auto object-cover max-h-[300px] opacity-90 group-hover/vid:opacity-100 transition-opacity duration-200"
        preload="metadata"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/90 group-hover/vid:scale-110 transition-transform shadow-lg border border-white/20">
          <Play className="w-5 h-5 ml-1" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

const ModalVideoPlayer = ({
  src,
  onClose,
}: {
  src: string;
  onClose: () => void;
}) => {
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    let newRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(newRate);
    videoRef.current.playbackRate = newRate;
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors p-2 z-50"
      >
        <X className="w-8 h-8" />
      </button>

      <div
        className="relative max-w-full max-h-[90vh] flex flex-col items-center group"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={src}
          controls
          autoPlay
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-fade-in"
        />
        <div className="absolute top-4 left-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            onClick={toggleSpeed}
            className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-black/80 transition-colors border border-white/10"
          >
            {playbackRate}x Speed
          </button>
        </div>
      </div>
    </div>
  );
};

const EMOJI_LIST = [
  { char: "😊", name: "smile happy" },
  { char: "😂", name: "laugh cry tears joy" },
  { char: "🥰", name: "love hearts" },
  { char: "😍", name: "heart eyes" },
  { char: "😘", name: "kiss" },
  { char: "😜", name: "wink tongue" },
  { char: "😎", name: "cool glasses" },
  { char: "🥳", name: "party celebrate" },
  { char: "😭", name: "cry sad tears" },
  { char: "😡", name: "angry mad red" },
  { char: "😱", name: "scream scared" },
  { char: "🤔", name: "think hmm" },
  { char: "👍", name: "thumbs up yes like" },
  { char: "👎", name: "thumbs down no dislike" },
  { char: "❤️", name: "heart love red" },
  { char: "🔥", name: "fire hot lit" },
  { char: "✨", name: "sparkles stars" },
  { char: "🎉", name: "party popper celebrate" },
  { char: "🙌", name: "raise hands praise" },
  { char: "🙏", name: "pray please thanks" },
  { char: "👏", name: "clap applause" },
  { char: "👀", name: "eyes look" },
  { char: "👋", name: "wave hello bye" },
  { char: "💡", name: "light bulb idea" },
  { char: "💯", name: "100 hundred perfect" },
  { char: "🚀", name: "rocket ship launch" },
  { char: "🌟", name: "star glowing" },
  { char: "💬", name: "speech bubble chat" },
  { char: "🎵", name: "music note song" },
  { char: "📷", name: "camera photo" },
  { char: "🍔", name: "hamburger burger food" },
  { char: "🍕", name: "pizza food" },
  { char: "☕", name: "coffee cup tea" },
  { char: "🍷", name: "wine glass drink" },
  { char: "🐶", name: "dog puppy animal" },
  { char: "🐱", name: "cat kitten animal" },
  { char: "🌈", name: "rainbow colors" },
  { char: "☀️", name: "sun sunny weather" },
  { char: "🌙", name: "moon night" },
  { char: "🌍", name: "earth world globe" },
];

const formatMessageText = (text: string, isOwn: boolean) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.toLowerCase().startsWith("www.")
        ? `https://${part}`
        : part;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            "underline font-semibold transition-colors duration-150 break-all",
            isOwn
              ? "text-blue-100 hover:text-white"
              : "text-sky-400 hover:text-sky-300",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export function ChatArea({
  chatId,
  onNewMessageTrigger,
  onBack,
}: ChatAreaProps) {
  const token = useSelector((state: RootState) => state.auth.token);
  const currentUserId = getUserIdFromToken(token);

  const { data: chatData, isLoading } = useGetChatByIdQuery(
    { chatId: chatId! },
    { skip: !chatId, pollingInterval: 5000 },
  );

  const { data: chatsResponse } = useGetChatsQuery(undefined, {
    skip: !chatId,
  });
  const chats = chatsResponse?.data || [];
  const currentChat = chats.find((c: any) => c.chatId === chatId);

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [deleteMessage, { isLoading: isDeletingMessage }] = useDeleteMessageMutation();

  const checkIsOwnMessage = (msg: any) => {
    if (!msg || !msg.userId || !currentUserId) return false;
    return (
      String(msg.userId).toLowerCase() === String(currentUserId).toLowerCase()
    );
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<ChatFormValues>({
      resolver: zodResolver(chatSchema),
      defaultValues: { messageText: "" },
    });

  const selectedFile = watch("file");
  const messageText = watch("messageText");
  const [filePreview, setFilePreview] = useState<{
    url: string;
    type: "image" | "video" | "audio";
  } | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      const isVideo = selectedFile.type.startsWith("video/");
      const isAudio =
        selectedFile.type.startsWith("audio/") ||
        selectedFile.name.endsWith(".mp3") ||
        selectedFile.name.endsWith(".wav") ||
        selectedFile.name.endsWith(".ogg") ||
        selectedFile.name.endsWith(".m4a") ||
        selectedFile.name.endsWith(".webm");
      setFilePreview({
        url,
        type: isVideo ? "video" : isAudio ? "audio" : "image",
      });
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreview(null);
    }
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Close emoji box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target as Node)
      ) {
        setIsEmojiOpen(false);
        setEmojiSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNotAtBottom = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(isNotAtBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const messages = Array.isArray(chatData?.data) ? chatData.data : [];

  const isFirstLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    isFirstLoadRef.current = true;
    prevMessagesLengthRef.current = 0;
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0) {
      if (isFirstLoadRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        isFirstLoadRef.current = false;
      } else if (messages.length > prevMessagesLengthRef.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  const { ref: formInputRef, ...messageTextProps } = register("messageText");

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/mp3",
        });
        const file = new File([audioBlob], "voice.mp3", { type: "audio/mp3" });
        setValue("file", file, { shouldValidate: true });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const onSubmit = async (data: ChatFormValues) => {
    if (!chatId) return;
    if (!data.messageText?.trim() && !data.file) return;
    try {
      await sendMessage({
        chatId,
        messageText: data.messageText?.trim() ? data.messageText : undefined,
        file: data.file,
      }).unwrap();

      reset();
      // reset({ messageText: "", file: undefined });
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    setDeleteMessageId(messageId);
  };

  const handleConfirmDeleteMessage = async () => {
    if (!chatId || deleteMessageId === null) return;
    try {
      await deleteMessage({ messageId: deleteMessageId, chatId }).unwrap();
    } catch (error) {
      console.error("Failed to delete message", error);
    } finally {
      setDeleteMessageId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValue("file", e.target.files[0], { shouldValidate: true });
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      const currentText = watch("messageText") || "";
      setValue("messageText", currentText + emoji, { shouldValidate: true });
      return;
    }

    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const text = watch("messageText") || "";
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + emoji + after;

    setValue("messageText", newText, { shouldValidate: true });

    // Move focus back and set cursor position right after the inserted emoji
    setTimeout(() => {
      input.focus();
      const cursorPosition = start + emoji.length;
      input.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  if (!chatId) {
    return (
      <div className="hidden md:flex flex-1 bg-zinc-950 flex-col items-center justify-center p-8">
        <div className="w-24 h-24 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-4 bg-gradient-to-tr from-purple-600 to-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.3)]">
          <SendHorizontal className="w-10 h-10 text-white -ml-1 mt-1 transform -rotate-45" />
        </div>
        <h2 className="text-xl font-normal text-zinc-50 mb-2">Your messages</h2>
        <p className="text-sm text-zinc-400 mb-6 text-center max-w-xs">
          Send private photos and messages to a friend or group.
        </p>
        <button
          onClick={onNewMessageTrigger}
          className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold py-1.5 px-4 rounded-lg text-sm transition-colors cursor-pointer"
        >
          Send message
        </button>
      </div>
    );
  }

  // Determine partner details dynamically from currentChat info
  const isCurrentUserSender =
    currentChat && currentUserId
      ? String(currentChat.sendUserId).toLowerCase() ===
        String(currentUserId).toLowerCase()
      : false;

  const partnerUsername = currentChat
    ? isCurrentUserSender
      ? currentChat.receiveUserName
      : currentChat.sendUserName
    : "User";

  const partnerImage = currentChat
    ? isCurrentUserSender
      ? currentChat.receiveUserImage
      : currentChat.sendUserImage
    : "";

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 h-full overflow-hidden w-full">
      {/* Header */}
      <div className="h-[76px] flex items-center justify-between px-4 md:px-6 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 text-zinc-400 hover:text-zinc-100 transition-colors mr-1 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <Link
            href={`/${partnerUsername}`}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            {renderAvatar(partnerImage, "w-9 h-9 md:w-11 md:h-11")}
            <div className="flex flex-col">
              <span className="text-zinc-50 font-semibold text-sm md:text-base">
                {partnerUsername}
              </span>
              <span className="text-zinc-400 text-[10px] md:text-xs">
                Active now
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-6 text-zinc-50">
          <button className="hover:text-zinc-300 transition-colors">
            <Phone className="w-6 h-6" />
          </button>
          <button className="hover:text-zinc-300 transition-colors">
            <Video className="w-6 h-6" />
          </button>
          <button className="hover:text-zinc-300 transition-colors">
            <Info className="w-6 h-6" />
          </button>
        </div>
      </div>
      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3"
        onScroll={handleScroll}
      >
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Link
              href={`/${partnerUsername}`}
              className="hover:opacity-90 transition-opacity"
            >
              {renderAvatar(partnerImage, "w-24 h-24 mb-4")}
            </Link>
            <p className="text-zinc-50 font-semibold text-lg">
              {partnerUsername}
            </p>
            <p className="text-sm mb-4">Instagram</p>
            <Link
              href={`/${partnerUsername}`}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              View profile
            </Link>
          </div>
        ) : (
          <>
            {/* Example date boundary */}
            <div className="flex justify-center my-4">
              <span className="text-xs text-zinc-500 font-medium">
                29.02.2024, 23:12
              </span>
            </div>
            {(() => {
              const chronoMessages = messages.toReversed();
              return chronoMessages.map((msg: any, index: number) => {
                const isOwn = checkIsOwnMessage(msg);
                const fileUrl = msg.file;
                const hasText = !!msg.messageText;
                const isAudio = fileUrl && isAudioFile(fileUrl);
                const isVideo = fileUrl && isVideoFile(fileUrl);
                const isImage = fileUrl && !isAudio && !isVideo;

                // Dynamic border logic based on sequence of messages from the same sender
                let borderClass = "";
                if (isOwn) {
                  const isPrevOwn =
                    index > 0 && checkIsOwnMessage(chronoMessages[index - 1]);
                  const isNextOwn =
                    index < chronoMessages.length - 1 &&
                    checkIsOwnMessage(chronoMessages[index + 1]);

                  if (isPrevOwn && isNextOwn) {
                    borderClass = "rounded-2xl rounded-tr-sm rounded-br-sm";
                  } else if (isPrevOwn) {
                    borderClass = "rounded-2xl rounded-tr-sm";
                  } else if (isNextOwn) {
                    borderClass = "rounded-2xl rounded-br-sm";
                  } else {
                    borderClass = "rounded-2xl rounded-br-sm";
                  }
                } else {
                  const isPrevOther =
                    index > 0 && !checkIsOwnMessage(chronoMessages[index - 1]);
                  const isNextOther =
                    index < chronoMessages.length - 1 &&
                    !checkIsOwnMessage(chronoMessages[index + 1]);

                  if (isPrevOther && isNextOther) {
                    borderClass = "rounded-2xl rounded-tl-sm rounded-bl-sm";
                  } else if (isPrevOther) {
                    borderClass = "rounded-2xl rounded-tl-sm";
                  } else if (isNextOther) {
                    borderClass = "rounded-2xl rounded-bl-sm";
                  } else {
                    borderClass = "rounded-2xl rounded-bl-sm";
                  }
                }

                return (
                  <div
                    key={msg.messageId}
                    className={clsx(
                      "flex max-w-[75%] my-[2px] items-end group relative animate-fade-in",
                      isOwn
                        ? "self-end flex-row-reverse"
                        : "self-start flex-row",
                    )}
                  >
                    {/* Sender Avatar for incoming */}
                    {!isOwn && (
                      <Link
                        href={`/${msg.userName || partnerUsername}`}
                        className="hover:opacity-90 transition-opacity shrink-0 mr-2"
                      >
                        {(() => {
                          const isNextOther =
                            index < chronoMessages.length - 1 &&
                            !checkIsOwnMessage(chronoMessages[index + 1]);
                          if (isNextOther) {
                            return <div className="w-8 h-8" />;
                          }
                          return renderAvatar(
                            msg?.userImage || partnerImage,
                            "w-8 h-8 rounded-full mb-1",
                          );
                        })()}
                      </Link>
                    )}
                    <div
                      className={clsx(
                        "text-sm whitespace-pre-wrap break-words flex flex-col relative",
                        (isImage || isVideo) && !hasText
                          ? "p-0 bg-transparent border-none shadow-none"
                          : clsx(
                              "shadow-sm border overflow-hidden",
                              borderClass,
                              isOwn
                                ? "bg-[#3797F0] text-white border-transparent"
                                : "bg-zinc-800/85 text-zinc-50 border-zinc-700/20",
                            ),
                      )}
                    >
                      {fileUrl && isAudio && (
                        <div
                          className={clsx(
                            "px-4",
                            hasText ? "pt-2.5 pb-1" : "py-2.5",
                          )}
                        >
                          <AudioPlayer
                            src={resolveFileUrl(fileUrl)}
                            isOwn={isOwn}
                          />
                        </div>
                      )}
                      {fileUrl && (isImage || isVideo) && (
                        <div
                          className={clsx(
                            "relative group/media w-full overflow-hidden bg-black flex items-center justify-center",
                            !hasText
                              ? "rounded-2xl border border-zinc-800/50 shadow-md"
                              : "",
                          )}
                        >
                          {isVideo ? (
                            <VideoPlayerPreview
                              src={resolveFileUrl(fileUrl)}
                              onClick={() =>
                                setPreviewMedia({
                                  url: resolveFileUrl(fileUrl),
                                  type: "video",
                                })
                              }
                              className="w-full"
                            />
                          ) : (
                            <img
                              src={resolveFileUrl(fileUrl)}
                              alt="attachment"
                              className="w-full h-auto object-cover max-h-[300px] cursor-pointer hover:opacity-90 transition-opacity duration-200"
                              onClick={() =>
                                setPreviewMedia({
                                  url: resolveFileUrl(fileUrl),
                                  type: "image",
                                })
                              }
                            />
                          )}
                          {!hasText && (
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[9px] text-zinc-300 font-medium select-none shadow-sm pointer-events-none z-10">
                              {msg.sendMassageDate
                                ? msg.sendMassageDate.slice(11, 16)
                                : ""}
                            </div>
                          )}
                        </div>
                      )}

                      {msg.messageText && (
                        <div
                          className={clsx(
                            "text-[15px] leading-relaxed",
                            isImage || isVideo
                              ? "px-3 pt-2 pb-1"
                              : isAudio
                                ? "px-4 pb-1"
                                : "px-4 pt-2.5 pb-1",
                          )}
                        >
                          {formatMessageText(msg.messageText, isOwn)}
                        </div>
                      )}

                      {/* Timestamp for bubbles with text or audio */}
                      {(isAudio || hasText) && (
                        <div
                          className={clsx(
                            "flex justify-end",
                            isImage || isVideo ? "px-3 pb-2" : "px-4 pb-2",
                          )}
                        >
                          <span
                            className={clsx(
                              "text-[9px] font-medium select-none",
                              isOwn ? "text-blue-100/70" : "text-zinc-500",
                            )}
                          >
                            {msg.sendMassageDate
                              ? msg.sendMassageDate.slice(11, 16)
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Minimalistic Delete Button */}
                    <button
                      onClick={() => handleDeleteMessage(msg.messageId)}
                      className="block hidden lg:group-hover:block p-1.5 hover:bg-zinc-800/60 rounded-lg text-zinc-500 hover:text-red-500 transition-all self-center shrink-0 cursor-pointer"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              });
            })()}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-[88px] right-6 z-40 bg-zinc-800 hover:bg-zinc-700 text-zinc-50 p-2.5 rounded-full shadow-lg border border-zinc-700/50 transition-all cursor-pointer"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* Input Area */}
      <div className="p-4 pt-2 shrink-0 bg-zinc-950">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/60 rounded-[28px] px-1.5 py-1.5 flex flex-col focus-within:bg-zinc-900/80 focus-within:border-zinc-700 transition-all duration-200"
        >
          {/* File Preview Thumbnail */}
          {filePreview && (
            <div className="flex px-12 pt-2 pb-1">
              <div className="relative group/preview w-14 h-14 rounded-xl overflow-hidden border border-zinc-700/50 bg-black shrink-0 shadow-sm">
                {filePreview.type === "video" ? (
                  <>
                    <video
                      src={filePreview.url}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Play
                        className="w-5 h-5 text-white opacity-90"
                        fill="currentColor"
                      />
                    </div>
                  </>
                ) : filePreview.type === "audio" ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/30">
                    {selectedFile?.name?.toLowerCase().includes("voice") ||
                    selectedFile?.type?.toLowerCase().includes("voice") ? (
                      <Mic className="w-5 h-5 text-zinc-300" />
                    ) : (
                      <Music className="w-5 h-5 text-zinc-300" />
                    )}
                    <span className="text-[9px] text-zinc-400 mt-0.5 truncate max-w-[48px] px-0.5 font-medium">
                      {selectedFile?.name?.toLowerCase().includes("voice")
                        ? "Voice"
                        : "Audio"}
                    </span>
                  </div>
                ) : (
                  <img
                    src={filePreview.url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setValue("file", undefined)}
                  className="absolute top-1 right-1 w-4 h-4 bg-black/60 hover:bg-black/90 rounded-full flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}

          {/* Text Input Row */}
          <div className="flex items-end w-full gap-1">
            {/* Emoji Trigger */}
            <div className="relative shrink-0" ref={emojiRef}>
              <button
                type="button"
                onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                className="p-2.5 text-zinc-50 hover:text-zinc-300 transition-colors"
              >
                <Smile className="w-6 h-6" />
              </button>
              {isEmojiOpen && (
                <div className="absolute bottom-12 left-0 z-50 w-[300px] h-72 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-2xl flex flex-col">
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400 text-sm font-semibold">
                      Emojis
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search emojis..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-50 focus:outline-none focus:border-zinc-700 mb-3"
                  />
                  <div className="flex-1 overflow-y-auto grid grid-cols-8 gap-2 scrollbar-thin content-start">
                    {EMOJI_LIST.filter((e) =>
                      e.name.includes(emojiSearch.toLowerCase()),
                    ).map((emojiObj) => (
                      <button
                        key={emojiObj.char}
                        type="button"
                        onClick={() => insertEmoji(emojiObj.char)}
                        className="text-xl p-1 hover:bg-zinc-800 rounded transition-colors flex items-center justify-center cursor-pointer"
                      >
                        {emojiObj.char}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center min-h-[44px] py-1">
              {!isRecording ? (
                <input
                  {...messageTextProps}
                  ref={(e) => {
                    formInputRef(e);
                    inputRef.current = e;
                  }}
                  className="w-full bg-transparent text-zinc-50 placeholder-zinc-500 outline-none text-sm"
                  placeholder="Message..."
                  autoComplete="off"
                />
              ) : (
                <div className="flex items-center gap-2 text-red-500 text-sm font-medium animate-pulse py-1">
                  Recording... {Math.floor(recordingTime / 60)}:
                  {(recordingTime % 60).toString().padStart(2, "0")}
                </div>
              )}
            </div>

            <div className="flex items-center shrink-0 pb-1 pr-1 gap-1">
              {!messageText?.trim() && !selectedFile && !isRecording && (
                <>
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="p-1.5 text-zinc-50 hover:text-zinc-300 transition-colors"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-zinc-50 hover:text-zinc-300 transition-colors"
                  >
                    <ImageIcon className="w-6 h-6" />
                  </button>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*"
                  />
                </>
              )}

              {isRecording && (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="p-1.5 text-red-500 hover:text-red-400 transition-colors"
                >
                  <StopCircle className="w-6 h-6" />
                </button>
              )}

              {(!!messageText?.trim() || !!selectedFile) && (
                <button
                  type="submit"
                  disabled={isSending}
                  className="bg-[#3797F0] hover:bg-[#1877f2] text-white rounded-full p-2 w-9 h-9 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <SendHorizontal className="w-5 h-5 -ml-0.5 mt-0.5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {previewMedia && previewMedia.type === "image" && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewMedia(null)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors p-2 z-50"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={previewMedia.url}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-fade-in"
          />
        </div>
      )}
      {previewMedia && previewMedia.type === "video" && (
        <ModalVideoPlayer
          src={previewMedia.url}
          onClose={() => setPreviewMedia(null)}
        />
      )}
      {deleteMessageId !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
          <div className="bg-[#262626] w-[260px] md:w-[400px] rounded-xl overflow-hidden flex flex-col text-center shadow-2xl border border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 flex flex-col gap-2">
              <h3 className="text-zinc-50 text-lg font-semibold leading-snug">
                Unsend message?
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed px-2">
                Unsending will remove the message for everyone. People may have already seen it.
              </p>
            </div>
            
            <div className="flex flex-col border-t border-zinc-800">
              <button
                onClick={handleConfirmDeleteMessage}
                disabled={isDeletingMessage}
                className="py-3 text-red-500 font-bold text-sm hover:bg-white/5 active:bg-white/10 transition-colors border-b border-zinc-800 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingMessage ? "Unsending..." : "Unsend"}
              </button>
              <button
                onClick={() => setDeleteMessageId(null)}
                className="py-3 text-zinc-50 font-normal text-sm hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
