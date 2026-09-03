import React, { useState } from "react";
import { Play, Pause, Heart, MessageCircle, Bookmark, Share2, Music2, RotateCcw, Volume2, Sparkles } from "lucide-react";
import { ViralClip } from "../types";

interface TikTokPreviewProps {
  clip: ViralClip;
  videoId: string;
  creatorHandle?: string;
  creatorAvatar?: string;
}

export const TikTokPreview: React.FC<TikTokPreviewProps> = ({
  clip,
  videoId,
  creatorHandle = "@creator",
  creatorAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop",
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [likesCount, setLikesCount] = useState(247);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Check if we have a real 11-char YouTube ID
  const isRealYouTubeId = videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId);

  const embedUrl = isRealYouTubeId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&start=${clip.startSeconds}&end=${clip.endSeconds}&controls=1&modestbranding=1&rel=0&loop=1`
    : null;

  const handleToggleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const handleRestart = () => {
    setReloadKey((prev) => prev + 1);
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col items-center">
      {/* 9:16 Smartphone Mockup */}
      <div className="relative w-[300px] h-[550px] bg-black rounded-[36px] p-2.5 shadow-[0_0_40px_rgba(0,0,0,0.9)] border-4 border-white/10 ring-1 ring-white/10 select-none overflow-hidden flex flex-col">
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-white/10 backdrop-blur-md rounded-full z-40 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-black/60 border border-white/10" />
        </div>

        {/* Video Canvas Container (9:16 aspect) */}
        <div className="relative w-full h-full rounded-[26px] overflow-hidden bg-black flex items-center justify-center">
          {isRealYouTubeId && embedUrl ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center">
              {/* Scaled & cropped YouTube player to fill 9:16 ratio */}
              <iframe
                key={reloadKey}
                src={embedUrl}
                title="YouTube clip player"
                className="w-[177%] h-[120%] max-w-none border-0 pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            /* Fallback animated visualizer if mock ID */
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-violet-950/30 via-black to-cyan-950/20 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center mb-4">
                <div className="w-full h-full bg-[#050507] rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-1 font-mono">
                Segment Extrait
              </span>
              <span className="text-lg font-bold text-white mb-2 leading-tight">
                {clip.startTime} ➔ {clip.endTime}
              </span>
              <span className="text-xs text-white/60 max-w-[200px] line-clamp-3 leading-relaxed">
                {clip.hookExplanation}
              </span>
            </div>
          )}

          {/* Dark gradient overlays for readable TikTok UI */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent via-50% to-black/85 z-20" />

          {/* Top Bar (Pour toi / Suivis) */}
          <div className="absolute top-5 inset-x-0 z-30 flex items-center justify-center gap-4 text-xs font-bold text-white/50">
            <span className="hover:text-white cursor-pointer transition">Abonnements</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-white border-b-2 border-white pb-0.5 cursor-pointer">Pour toi</span>
          </div>

          {/* Viral Hook Overlay Sticker (9:16 center-top) */}
          {clip.suggestedTextOverlay && (
            <div className="absolute top-16 inset-x-4 z-30 flex justify-center pointer-events-none">
              <div className="bg-white text-black px-3.5 py-1.5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.4)] font-black text-xs sm:text-sm text-center tracking-tight border border-black/10 transform -rotate-1 animate-bounce duration-1000">
                {clip.suggestedTextOverlay}
              </div>
            </div>
          )}

          {/* TikTok Right Sidebar Icons */}
          <div className="absolute right-2 bottom-16 z-30 flex flex-col items-center gap-3.5">
            {/* Avatar */}
            <div className="relative group cursor-pointer">
              <img
                src={creatorAvatar}
                alt={creatorHandle}
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md"
              />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                +
              </div>
            </div>

            {/* Like */}
            <button
              onClick={handleToggleLike}
              className="flex flex-col items-center group cursor-pointer"
              title="J'aime"
            >
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition transform active:scale-125">
                <Heart
                  className={`w-5 h-5 transition ${
                    isLiked ? "fill-rose-500 text-rose-500" : "text-white"
                  }`}
                />
              </div>
              <span className="text-[11px] font-semibold text-white mt-0.5">{likesCount}.8K</span>
            </button>

            {/* Comments */}
            <div className="flex flex-col items-center cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-white mt-0.5">1.4K</span>
            </div>

            {/* Save */}
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="flex flex-col items-center cursor-pointer"
              title="Favoris"
            >
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Bookmark
                  className={`w-5 h-5 transition ${
                    isSaved ? "fill-amber-400 text-amber-400" : "text-white"
                  }`}
                />
              </div>
              <span className="text-[11px] font-semibold text-white mt-0.5">28K</span>
            </button>

            {/* Share */}
            <div className="flex flex-col items-center cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-semibold text-white mt-0.5">12K</span>
            </div>

            {/* Spinning Disc */}
            <div className="w-8 h-8 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center animate-spin duration-3000 mt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            </div>
          </div>

          {/* TikTok Bottom Info */}
          <div className="absolute bottom-4 left-3 right-14 z-30 flex flex-col gap-1 text-left pointer-events-none">
            <span className="text-xs font-bold text-white drop-shadow-md">{creatorHandle}</span>
            <p className="text-[11px] text-neutral-200 line-clamp-2 leading-snug drop-shadow">
              {clip.tiktokCaption.split("#")[0] || clip.clipTitle}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 mt-0.5">
              <Music2 className="w-3 h-3 text-white animate-pulse" />
              <span className="truncate">Son original • {creatorHandle} (Extrait {clip.startTime})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Tools under preview */}
      <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
        <button
          onClick={handleRestart}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Rejouer le clip</span>
        </button>
        <span className="text-[11px] font-mono text-cyan-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
          ⏱️ {clip.durationSeconds}s ({clip.startTime} ➔ {clip.endTime})
        </span>
      </div>
    </div>
  );
};
