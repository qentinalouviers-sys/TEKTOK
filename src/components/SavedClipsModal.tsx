import React, { useState } from "react";
import { X, Bookmark, Copy, Check, Scissors, Flame, Clock, Trash2 } from "lucide-react";
import { ViralClip } from "../types";

interface SavedClipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedClips: ViralClip[];
  onRemoveClip: (clipId: string) => void;
  onClearAll: () => void;
}

export const SavedClipsModal: React.FC<SavedClipsModalProps> = ({
  isOpen,
  onClose,
  savedClips,
  onRemoveClip,
  onClearAll,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyCaption = (clip: ViralClip) => {
    navigator.clipboard.writeText(clip.tiktokCaption);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#050507] border border-white/10 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Bookmark className="w-5 h-5 fill-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Mes Extraits TikTok Sauvegardés ({savedClips.length})
              </h3>
              <p className="text-xs text-white/40">Prêts pour le montage et la publication</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedClips.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-white/40 hover:text-rose-400 transition cursor-pointer px-2 py-1"
              >
                Tout effacer
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
          {savedClips.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40">
              Aucun extrait sauvegardé pour l'instant. Cliquez sur "Sauvegarder" dans l'analyseur
              pour retrouver vos clips favoris ici.
            </div>
          ) : (
            savedClips.map((clip) => (
              <div
                key={clip.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {clip.clipType}
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                      {clip.viralityScore}%
                    </span>
                    <span className="text-xs font-mono text-white/40">
                      ⏱️ {clip.startTime} - {clip.endTime} ({clip.durationSeconds}s)
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveClip(clip.id)}
                    className="text-white/40 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white">{clip.clipTitle}</h4>

                <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white/80">
                  {clip.tiktokCaption}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-cyan-300 italic font-mono">
                    Hook : "{clip.suggestedTextOverlay}"
                  </span>
                  <button
                    onClick={() => handleCopyCaption(clip)}
                    className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
                  >
                    {copiedId === clip.id ? (
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
