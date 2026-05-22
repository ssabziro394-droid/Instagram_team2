"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Sparkles, 
  Music, 
  Clock, 
  Smile, 
  Zap, 
  ZapOff,
  Video, 
  RefreshCw,
  Camera,
  Play,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type CameraMode = "POST" | "STORY" | "REEL" | "LIVE";
type SpeedOption = "0.3x" | "0.5x" | "1x" | "2x" | "3x";
type DurationOption = "15s" | "30s" | "60s" | "90s";
type FilterOption = "Normal" | "Retro VHS" | "Cyberpunk Neon" | "Cinematic Noir" | "Lomo Light";

export default function CreateReelPage() {
  const router = useRouter();

  // Mode Slider
  const modes: CameraMode[] = ["POST", "STORY", "REEL", "LIVE"];
  const [activeMode, setActiveMode] = useState<CameraMode>("REEL");

  // Camera Settings
  const [flashOn, setFlashOn] = useState(false);
  const [duration, setDuration] = useState<DurationOption>("30s");
  const [speed, setSpeed] = useState<SpeedOption>("1x");
  const [retouchOn, setRetouchOn] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("Normal");
  const [timerOn, setTimerOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);

  // Video stream variables
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"pending" | "granted" | "denied">("pending");

  // Load live camera
  useEffect(() => {
    async function startCamera() {
      try {
        setCameraPermission("pending");
        const constraints = {
          video: { facingMode: "user", width: 1280, height: 720 },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraPermission("granted");
      } catch (err) {
        console.warn("Camera permission denied or not available:", err);
        setCameraPermission("denied");
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle Recording Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordedTime((prev) => {
          const maxSec = parseInt(duration);
          if (prev >= maxSec) {
            setIsRecording(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, duration]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const getFilterClass = () => {
    switch (activeFilter) {
      case "Retro VHS":
        return "sepia hue-rotate-15 contrast-125 saturate-150 filter blur-[0.4px]";
      case "Cyberpunk Neon":
        return "saturate-200 contrast-125 hue-rotate-[240deg] filter drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]";
      case "Cinematic Noir":
        return "grayscale contrast-150 brightness-95";
      case "Lomo Light":
        return "contrast-115 saturate-125 brightness-105 filter drop-shadow-[0_0_12px_rgba(244,63,94,0.15)]";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-screen bg-black text-white flex justify-center items-center overflow-hidden relative select-none">
      {/* 9:16 Frame boundary */}
      <div className="relative w-full max-w-[420px] h-full flex flex-col justify-between bg-zinc-950 overflow-hidden shadow-2xl md:rounded-xl border border-zinc-900">
        
        {/* Camera Live Stream or fallback */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
          {cameraPermission === "granted" ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all duration-350 ${getFilterClass()}`}
            />
          ) : (
            /* Elegant animated mock backdrop if permission denied */
            <div className="w-full h-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-sky-950/20 flex flex-col justify-center items-center p-6 text-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-700 animate-spin flex items-center justify-center" />
                <Camera className="w-8 h-8 text-zinc-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-300">Camera preview placeholder</p>
                <p className="text-xs text-zinc-500 max-w-[220px] mt-1.5 leading-relaxed">
                  Connect your webcam to unlock HTML5 camera streaming.
                </p>
              </div>
            </div>
          )}

          {/* Flash / Filter Screen Overlays */}
          {flashOn && (
            <div className="absolute inset-0 bg-white/20 pointer-events-none mix-blend-overlay" />
          )}

          {/* Vignette dark edges */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_rgba(0,0,0,0.85)_100%)] pointer-events-none" />
        </div>

        {/* Top Navbar Actions */}
        <header className="z-10 px-5 pt-5 flex items-center justify-between pointer-events-none">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-full bg-black/45 hover:bg-black/60 backdrop-blur-sm pointer-events-auto transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Recording time indicator */}
          {isRecording && (
            <div className="px-3.5 py-1.5 rounded-full bg-red-600/90 border border-red-500 flex items-center gap-1.5 text-xs font-bold animate-pulse pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>00:{recordedTime < 10 ? `0${recordedTime}` : recordedTime} / {duration}</span>
            </div>
          )}

          <button
            onClick={() => setFlashOn(!flashOn)}
            className="p-2.5 rounded-full bg-black/45 hover:bg-black/60 backdrop-blur-sm pointer-events-auto transition-all active:scale-95 cursor-pointer"
          >
            {flashOn ? <Zap className="w-5 h-5 text-yellow-400" /> : <ZapOff className="w-5 h-5 text-white" />}
          </button>
        </header>

        {/* Sidebar settings tray */}
        <div className="absolute left-4 top-1/4 z-10 flex flex-col gap-4.5 items-center pointer-events-auto">
          {/* Audio selection */}
          <button 
            onClick={() => alert("Music selection sheet opened!")}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 border border-zinc-800/40 backdrop-blur-sm flex items-center justify-center transition-all group-active:scale-90">
              <Music className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-[9px] font-bold text-zinc-300 drop-shadow-md">Audio</span>
          </button>

          {/* Duration Selector */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                const map: Record<DurationOption, DurationOption> = { "15s": "30s", "30s": "60s", "60s": "90s", "90s": "15s" };
                setDuration(map[duration]);
              }}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 border border-zinc-800/40 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer font-bold text-xs"
            >
              {duration}
            </button>
            <span className="text-[9px] font-bold text-zinc-300 drop-shadow-md">Duration</span>
          </div>

          {/* Speed Selector */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                const map: Record<SpeedOption, SpeedOption> = { "0.3x": "0.5x", "0.5x": "1x", "1x": "2x", "2x": "3x", "3x": "0.3x" };
                setSpeed(map[speed]);
              }}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 border border-zinc-800/40 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer font-bold text-xs text-sky-400"
            >
              {speed}
            </button>
            <span className="text-[9px] font-bold text-zinc-300 drop-shadow-md">Speed</span>
          </div>

          {/* Retouch toggle */}
          <button
            onClick={() => setRetouchOn(!retouchOn)}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-full border border-zinc-800/40 backdrop-blur-sm flex items-center justify-center transition-all group-active:scale-90 ${
              retouchOn ? "bg-sky-500/30 text-sky-400 border-sky-500" : "bg-black/40 hover:bg-black/65 text-white"
            }`}>
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="text-[9px] font-bold text-zinc-300 drop-shadow-md">Retouch</span>
          </button>

          {/* Active Filter select */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => {
                const list: FilterOption[] = ["Normal", "Retro VHS", "Cyberpunk Neon", "Cinematic Noir", "Lomo Light"];
                const currIdx = list.indexOf(activeFilter);
                const nextIdx = (currIdx + 1) % list.length;
                setActiveFilter(list[nextIdx]);
              }}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 border border-zinc-800/40 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer text-zinc-200"
            >
              <Smile className="w-4.5 h-4.5" />
            </button>
            <span className="text-[9px] font-bold text-zinc-300 drop-shadow-md truncate max-w-[48px]">{activeFilter}</span>
          </div>
        </div>

        {/* Bottom controls panel */}
        <div className="z-10 flex flex-col items-center gap-5 w-full bg-gradient-to-t from-black via-black/40 to-transparent pb-6 pt-16">
          
          {/* Giant Record Button */}
          <div className="flex justify-center items-center">
            <button
              onClick={toggleRecording}
              className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer select-none focus:outline-none"
            >
              {/* Outer glowing frame */}
              <div className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${
                isRecording ? "border-red-500 scale-110" : "border-white"
              }`} />

              {/* Inner red dot */}
              <motion.div
                animate={isRecording ? { scale: [1, 0.85, 1], borderRadius: "6px" } : { scale: 1, borderRadius: "50%" }}
                transition={isRecording ? { repeat: Infinity, duration: 1.2 } : { duration: 0.2 }}
                className={`w-14 h-14 bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.7)]`}
              />
            </button>
          </div>

          {/* Horizontal Slider Camera Mode (POST, STORY, REEL, LIVE) */}
          <div className="w-full overflow-hidden flex justify-center items-center relative py-1 border-t border-zinc-900/35">
            <div className="flex gap-6 text-[10px] font-extrabold tracking-widest text-zinc-400">
              {modes.map((m) => (
                <button
                  key={m}
                  onClick={() => setActiveMode(m)}
                  className={`transition-colors py-1 relative ${
                    activeMode === m ? "text-white scale-110" : "hover:text-zinc-200"
                  }`}
                >
                  {m}
                  {activeMode === m && (
                    <motion.div
                      layoutId="activeModeBar"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
