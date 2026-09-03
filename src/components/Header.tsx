import React from "react";
import { Sparkles, UserPlus, Link2, Bookmark, Flame, Video } from "lucide-react";

interface HeaderProps {
  onOpenAddCreator: () => void;
  onOpenDirectUrl: () => void;
  savedClipsCount: number;
  onOpenSavedClips: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddCreator,
  onOpenDirectUrl,
  savedClipsCount,
  onOpenSavedClips,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#050507]/80 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Brand */}
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)] text-white shrink-0">
          <Flame className="w-5 h-5 fill-white" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70 flex items-center gap-1.5">
              V-CLIP <span className="text-violet-400">GEMINI</span>
            </h1>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-green-400">
                Gemini 3.8 Flash Active
              </span>
            </div>
          </div>
          <p className="text-[11px] text-white/40 hidden sm:block">
            Détecteur d'extraits TikTok à rétention maximale pour vos vidéastes
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenDirectUrl}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer"
          title="Analyser n'importe quelle vidéo par son lien"
        >
          <Link2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Lien direct</span>
        </button>

        <button
          onClick={onOpenAddCreator}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] transition cursor-pointer active:scale-95"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Vidéaste</span>
        </button>

        {savedClipsCount > 0 && (
          <button
            onClick={onOpenSavedClips}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            title="Voir mes clips sauvegardés"
          >
            <Bookmark className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
            <span className="font-mono">{savedClipsCount}</span>
          </button>
        )}
      </div>
    </header>
  );
};
