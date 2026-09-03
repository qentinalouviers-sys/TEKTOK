import React from "react";
import { Sparkles, Clock, Eye, Flame, Play, CheckCircle2 } from "lucide-react";
import { VideoItem, VideoAnalysis } from "../types";

interface VideoGridProps {
  videos: VideoItem[];
  analyses: Record<string, VideoAnalysis>;
  analyzingId: string | null;
  onAnalyze: (video: VideoItem) => void;
  onOpenAnalysis: (analysis: VideoAnalysis) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  analyses,
  analyzingId,
  onAnalyze,
  onOpenAnalysis,
}) => {
  if (videos.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-6">
        <p className="text-sm font-semibold text-white/70 mb-1">
          Aucune vidéo disponible pour ce filtre.
        </p>
        <p className="text-xs text-white/40">
          Ajoutez un nouveau vidéaste ou sélectionnez "Toutes les vidéos".
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => {
        const isAnalyzing = analyzingId === video.id;
        const analysis = analyses[video.id];

        return (
          <div
            key={video.id}
            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-violet-500/40 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-2xl hover:shadow-violet-950/40"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-black/40">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-black/20" />

              {/* Duration badge */}
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono font-semibold text-white/90 border border-white/10">
                {video.duration}
              </div>

              {/* Already analyzed status badge */}
              {analysis && (
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center gap-1 shadow-lg shadow-cyan-950/50 backdrop-blur-md">
                  <Flame className="w-3.5 h-3.5 fill-cyan-300" />
                  <span>{analysis.clips.length} Clips ({analysis.overallViralScore}%)</span>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {video.channelAvatar && (
                    <img
                      src={video.channelAvatar}
                      alt={video.channelName || "Creator"}
                      className="w-5 h-5 rounded-lg object-cover border border-white/10"
                    />
                  )}
                  <span className="text-xs font-semibold text-violet-400">
                    {video.channelName || "YouTube"}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs text-white/40">{video.publishedAt}</span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-violet-200 transition-colors">
                  {video.title}
                </h3>

                {video.description && (
                  <p className="text-xs text-white/50 line-clamp-2 mt-1.5 leading-relaxed">
                    {video.description}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                <span className="text-[11px] text-white/40 font-mono">
                  {video.views}
                </span>

                {analysis ? (
                  <button
                    onClick={() => onOpenAnalysis(analysis)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Voir les Extraits</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onAnalyze(video)}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-cyan-400 text-black disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-95 shadow-md hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>Analyse en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Générer Clips TikTok</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
