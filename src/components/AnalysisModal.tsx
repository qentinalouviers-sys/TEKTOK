import React, { useState } from "react";
import {
  X,
  Sparkles,
  Flame,
  Copy,
  Check,
  Clock,
  Scissors,
  ExternalLink,
  Film,
  Zap,
  ShieldAlert,
  Sliders,
  Bookmark,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { VideoAnalysis, ViralClip, VideoItem } from "../types";
import { TikTokPreview } from "./TikTokPreview";
import { RetentionGraph } from "./RetentionGraph";
import { RemotionStudioModal } from "../remotion/RemotionStudioModal";

interface AnalysisModalProps {
  analysis: VideoAnalysis;
  onClose: () => void;
  creatorAvatar?: string;
  creatorHandle?: string;
  onSaveClip?: (clip: ViralClip) => void;
  savedClipIds?: string[];
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
  analysis,
  onClose,
  creatorAvatar,
  creatorHandle,
  onSaveClip,
  savedClipIds = [],
}) => {
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedTimecode, setCopiedTimecode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isRemotionStudioOpen, setIsRemotionStudioOpen] = useState(false);

  const selectedClip = analysis.clips[selectedClipIndex] || analysis.clips[0];

  const videoItem: VideoItem = {
    id: analysis.videoId,
    title: analysis.videoTitle,
    thumbnail: `https://img.youtube.com/vi/${analysis.videoId}/hqdefault.jpg`,
    publishedAt: "Récemment",
    views: "Fort potentiel viral",
    duration: selectedClip?.endTime || "10:00",
    description: analysis.viralSummary,
    channelName: analysis.channelName,
    channelAvatar: creatorAvatar,
  };

  const handleCopyCaption = () => {
    if (!selectedClip) return;
    navigator.clipboard.writeText(selectedClip.tiktokCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyTimecode = () => {
    if (!selectedClip) return;
    const text = `Extrait: "${selectedClip.clipTitle}"\nTimecode: ${selectedClip.startTime} - ${selectedClip.endTime} (${selectedClip.durationSeconds}s)\nLien: https://www.youtube.com/watch?v=${analysis.videoId}&t=${selectedClip.startSeconds}s`;
    navigator.clipboard.writeText(text);
    setCopiedTimecode(true);
    setTimeout(() => setCopiedTimecode(false), 2000);
  };

  const handleCopyEditingScript = () => {
    if (!selectedClip) return;
    const guide = `Fiche de Montage TikTok (CapCut / Premiere Pro) :
Titre : ${selectedClip.clipTitle}
Durée : ${selectedClip.durationSeconds}s (${selectedClip.startTime} - ${selectedClip.endTime})
Score de Rétention : ${selectedClip.viralityScore}/100

1. HOOK (0-3s) :
${selectedClip.hookExplanation}

2. OVERLAY TEXTE 9:16 :
"${selectedClip.suggestedTextOverlay}"

3. CONSEILS DE MONTAGE :
${selectedClip.editingTips.map((tip, i) => `- ${tip}`).join("\n")}

4. PRÉVENTION DU DÉCROCHAGE :
${selectedClip.dropoffPrevention}

5. LÉGENDE TIKTOK :
${selectedClip.tiktokCaption}
`;
    navigator.clipboard.writeText(guide);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const isCurrentSaved = selectedClip && savedClipIds.includes(selectedClip.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#050507] border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 font-mono">
                  <Flame className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                  Score Rétention : {analysis.overallViralScore}/100
                </span>
                {analysis.modelUsed && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                    ⚡ {analysis.modelUsed}
                  </span>
                )}
                <span className="text-xs text-white/50 font-medium">
                  {analysis.channelName} • {analysis.clips.length} extraits à forte rétention
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1 line-clamp-1">
                {analysis.videoTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {analysis.videoId && !analysis.videoId.startsWith("b_") && (
              <a
                href={`https://www.youtube.com/watch?v=${analysis.videoId}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>YouTube</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Strategy banner */}
        <div className="px-6 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs text-white/50 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-violet-400 font-semibold">💡 Stratégie :</span>
            <span className="text-white/80 italic">{analysis.viralSummary}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium font-mono text-white/60">
            <span className="flex items-center gap-1 text-cyan-300">
              <Clock className="w-3 h-3 text-cyan-400" /> {analysis.bestPostingTimes}
            </span>
            <span className="flex items-center gap-1 text-violet-300">
              <Volume2 className="w-3 h-3 text-violet-400" /> {analysis.targetVibe}
            </span>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center Column: Clip Selector & Deep Insights */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Clip Selector Tabs */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                Extraits Découpés par Gemini (Meilleure Rétention)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {analysis.clips.map((clip, idx) => {
                  const isActive = idx === selectedClipIndex;
                  return (
                    <button
                      key={clip.id}
                      onClick={() => setSelectedClipIndex(idx)}
                      className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer ${
                        isActive
                          ? "bg-violet-500/15 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)] ring-1 ring-violet-500/30"
                          : "bg-white/[0.03] hover:bg-white/[0.06] border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white"
                              : "bg-white/10 text-white/70"
                          }`}
                        >
                          {clip.clipType}
                        </span>
                        <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                          {clip.viralityScore}%
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white line-clamp-1 mb-1">
                        {clip.clipTitle}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                        <span>⏱️ {clip.startTime} ➔ {clip.endTime}</span>
                        <span>•</span>
                        <span>{clip.durationSeconds}s</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedClip && (
              <div className="flex flex-col gap-4">
                {/* Hook (0-3s) Breakdown */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-purple-950/30 to-cyan-950/20 border border-violet-500/30 shadow-lg">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1.5 font-mono">
                    <Zap className="w-4 h-4 fill-cyan-400" />
                    Le Hook Rétention (0 - 3 secondes)
                  </div>
                  <p className="text-sm text-violet-100 font-medium leading-relaxed">
                    {selectedClip.hookExplanation}
                  </p>
                </div>

                {/* Remotion Quick Callout */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Génération Vidéo Remotion Prête</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">9:16</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Sous-titres dynamiques, hook animé et export direct MP4 (universel TikTok / Reels), WebM ou GIF
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsRemotionStudioOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
                  >
                    <span>Lancer Studio</span>
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>

                {/* Retention Psychology & Anti-Dropoff */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      Pourquoi l'algorithme adore ce passage :
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {selectedClip.retentionAnalysis}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-violet-300 font-semibold text-xs">
                      <ShieldAlert className="w-4 h-4 text-violet-400" />
                      Piège de décrochage & Correction :
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      {selectedClip.dropoffPrevention}
                    </p>
                  </div>
                </div>

                {/* Editing Tips */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      Conseils de Montage TikTok (CapCut / Premiere)
                    </span>
                    <span className="text-[11px] text-white/40 font-mono">Rythme & Dynamisme</span>
                  </div>
                  <ul className="grid grid-cols-1 gap-1.5 text-xs text-white/70">
                    {selectedClip.editingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Predictive Retention Graph */}
                <RetentionGraph
                  data={selectedClip.retentionCurve}
                  durationSeconds={selectedClip.durationSeconds}
                />

                {/* TikTok Caption with Copy button */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Légende TikTok Optimisée
                    </span>
                    <button
                      onClick={handleCopyCaption}
                      className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                    >
                      {copiedCaption ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier la légende</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white/80 break-words">
                    {selectedClip.tiktokCaption}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: 9:16 TikTok Smartphone Simulator & Fast Export */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4 bg-white/[0.02] p-4 sm:p-6 rounded-3xl border border-white/10">
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-violet-400" />
                Aperçu 9:16 TikTok Direct
              </span>

              {onSaveClip && selectedClip && (
                <button
                  onClick={() => onSaveClip(selectedClip)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                    isCurrentSaved
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                      : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isCurrentSaved ? "fill-cyan-400 text-cyan-400" : ""}`}
                  />
                  <span>{isCurrentSaved ? "Extrait Sauvegardé" : "Sauvegarder"}</span>
                </button>
              )}
            </div>

            {selectedClip && (
              <TikTokPreview
                clip={selectedClip}
                videoId={analysis.videoId}
                creatorHandle={creatorHandle}
                creatorAvatar={creatorAvatar}
              />
            )}

            {/* Remotion Studio Core Action Button */}
            <div className="w-full mt-1">
              <button
                onClick={() => setIsRemotionStudioOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-95 border border-cyan-400/40 group"
              >
                <Film className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
                <span>🎬 Studio Remotion : Découper & Exporter 9:16</span>
              </button>
            </div>

            {/* Quick Export Actions */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleCopyEditingScript}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] transition cursor-pointer active:scale-95"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Fiche de Montage Copiée !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier la Fiche Complète de Montage</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyTimecode}
                className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedTimecode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-cyan-400">Timecode copié !</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span>Copier les Timecodes ({selectedClip?.startTime} - {selectedClip?.endTime})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Remotion Studio Modal */}
      {isRemotionStudioOpen && selectedClip && (
        <RemotionStudioModal
          isOpen={isRemotionStudioOpen}
          onClose={() => setIsRemotionStudioOpen(false)}
          clip={selectedClip}
          video={videoItem}
          channelName={analysis.channelName || creatorHandle || "Créateur"}
        />
      )}
    </div>
  );
};
