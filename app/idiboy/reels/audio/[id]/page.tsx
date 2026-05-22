"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, Music, Video, Grid, Award } from "lucide-react";
import { INITIAL_REELS } from "../../mockData";
import { Reel } from "../../types";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const audioId = decodeURIComponent((params.id as string) || "Original Audio");

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  const audioRef = useRef<HTMLAudioElement>(null);

  // Filter reels that might match this audio, or just use initial reels as related reels
  const relatedReels = INITIAL_REELS.filter(
    (reel) => reel.audioName.toLowerCase().includes(audioId.toLowerCase())
  );
  const displayReels = relatedReels.length > 0 ? relatedReels : INITIAL_REELS;

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log(err));
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-zinc-100 flex justify-center pb-24">
      {/* Background radial gradient to give custom premium aesthetic */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/60 via-black to-black pointer-events-none" />

      {/* Main Column */}
      <div className="w-full max-w-[480px] px-4 pt-6 z-10 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <span className="font-bold text-lg tracking-tight">Audio Details</span>
        </header>

        {/* Audio Card */}
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-2xl p-5 mb-8 backdrop-blur-md flex items-center gap-5">
          {/* Rotating Vinyl Graphic */}
          <div 
            onClick={togglePlayback}
            className="relative w-20 h-20 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center cursor-pointer group shadow-xl shadow-black/35"
          >
            {/* Spinning inner disc */}
            <motion.div
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={isPlaying ? { repeat: Infinity, duration: 6, ease: "linear" } : {}}
              className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-800 relative"
            >
              <Music className="w-7 h-7 text-sky-400 opacity-80" />
              {/* Center hole */}
              <div className="absolute w-3.5 h-3.5 bg-zinc-950 border border-zinc-900 rounded-full inset-0 m-auto" />
            </motion.div>

            {/* Hover Indicator */}
            <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </div>
          </div>

          {/* Info Details */}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base text-zinc-100 truncate pr-2">{audioId}</h1>
            <p className="text-xs text-zinc-400 mt-1 font-medium flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-zinc-500" />
              Trending Audio
            </p>
            <span className="text-xs text-zinc-500 font-medium block mt-1.5">
              {displayReels.length * 127 + 34}K reels using this track
            </span>
          </div>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />

        {/* Header grid section */}
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
          <Grid className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-bold text-zinc-300">Popular Reels</span>
        </div>

        {/* Reels Responsive Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {displayReels.map((reel) => (
            <Link
              key={reel.id}
              href={`/idiboy/reels?id=${reel.id}`}
              className="relative aspect-[9/16] bg-zinc-900 rounded-lg overflow-hidden group cursor-pointer border border-zinc-900 shadow-md transition-all hover:scale-[1.02]"
            >
              {/* Thumbnail Video Element */}
              <video
                src={reel.videoUrl}
                muted
                playsInline
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
              />

              {/* Gradient Bottom Shadow */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />

              {/* View/Like Counter Overlay */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-bold text-white">
                <Play className="w-3 h-3 text-white fill-white" />
                <span>{(reel.likesCount * 3.4).toFixed(0)}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Floating primary "Use Audio" CTA pill button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[340px] px-4">
          <Link
            href="/idiboy/reels/create"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-bold py-3.5 rounded-full shadow-lg shadow-sky-500/25 active:scale-95 transition-all text-sm tracking-wide"
          >
            <Video className="w-4.5 h-4.5 text-white" />
            Use Audio
          </Link>
        </div>
      </div>
    </div>
  );
}
