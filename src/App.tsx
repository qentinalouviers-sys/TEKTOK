/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Flame,
  Search,
  Filter,
  Plus,
  Link2,
  Video as VideoIcon,
  Zap,
  TrendingUp,
  AlertCircle,
  Loader2,
  Bookmark,
} from "lucide-react";
import { Creator, VideoItem, VideoAnalysis, ViralClip } from "./types";
import { DEFAULT_CREATORS } from "./data/defaultCreators";
import { Header } from "./components/Header";
import { CreatorBar } from "./components/CreatorBar";
import { VideoGrid } from "./components/VideoGrid";
import { AddCreatorModal } from "./components/AddCreatorModal";
import { DirectUrlModal } from "./components/DirectUrlModal";
import { AnalysisModal } from "./components/AnalysisModal";
import { SavedClipsModal } from "./components/SavedClipsModal";

const STORAGE_KEY_CREATORS = "clipviral_creators_v2";
const STORAGE_KEY_ANALYSES = "clipviral_analyses_v2";
const STORAGE_KEY_SAVED_CLIPS = "clipviral_saved_clips_v1";

export default function App() {
  // Load initial creators from localStorage or fallback
  const [creators, setCreators] = useState<Creator[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CREATORS);
      if (saved) return JSON.parse(saved);
      // Migrate any custom channels from v1
      const oldSaved = localStorage.getItem("clipviral_creators_v1");
      if (oldSaved) {
        const parsed = JSON.parse(oldSaved);
        const customAdded = parsed.filter(
          (c: Creator) => !["squeezie", "mrbeast", "inoxtag", "mkbhd"].includes(c.id)
        );
        if (customAdded.length > 0) {
          return [...DEFAULT_CREATORS, ...customAdded];
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_CREATORS;
  });

  // Selected creator filter (null = all)
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState("");

  // Cached analyses by videoId
  const [analyses, setAnalyses] = useState<Record<string, VideoAnalysis>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ANALYSES);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  // Saved clips
  const [savedClips, setSavedClips] = useState<ViralClip[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_CLIPS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Modals state
  const [isAddCreatorOpen, setIsAddCreatorOpen] = useState(false);
  const [isDirectUrlOpen, setIsDirectUrlOpen] = useState(false);
  const [isSavedClipsOpen, setIsSavedClipsOpen] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<VideoAnalysis | null>(null);

  // Analysis loading status
  const [analyzingVideoId, setAnalyzingVideoId] = useState<string | null>(null);
  const [analyzingStep, setAnalyzingStep] = useState<string>("");
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CREATORS, JSON.stringify(creators));
    } catch (e) {
      console.error(e);
    }
  }, [creators]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(analyses));
    } catch (e) {
      console.error(e);
    }
  }, [analyses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_CLIPS, JSON.stringify(savedClips));
    } catch (e) {
      console.error(e);
    }
  }, [savedClips]);

  // Handle Add Creator
  const handleAddCreator = (newCreator: Creator) => {
    setCreators((prev) => {
      const filtered = prev.filter((c) => c.id !== newCreator.id && c.handle !== newCreator.handle);
      return [newCreator, ...filtered];
    });
    setSelectedCreatorId(newCreator.id);
  };

  // Handle Remove Creator
  const handleRemoveCreator = (creatorId: string) => {
    setCreators((prev) => prev.filter((c) => c.id !== creatorId));
    if (selectedCreatorId === creatorId) {
      setSelectedCreatorId(null);
    }
  };

  // Trigger Gemini Analysis
  const handleAnalyzeVideo = async (video: VideoItem) => {
    // If already analyzed, open directly
    if (analyses[video.id]) {
      setActiveAnalysis(analyses[video.id]);
      return;
    }

    setAnalyzingVideoId(video.id);
    setAnalyzingStep("Extraction des métadonnées et courbe de tension...");
    setErrorToast(null);

    const stepTimer1 = setTimeout(() => {
      setAnalyzingStep("Gemini Flash analyse les hooks 0-3s et la courbe d'attention...");
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setAnalyzingStep("Génération des segments verticaux 9:16 et timeline Remotion...");
    }, 2500);

    try {
      const res = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          videoTitle: video.title,
          channelName: video.channelName || "Créateur YouTube",
          description: video.description,
          duration: video.duration,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de l'analyse avec Gemini.");
      }

      const data: VideoAnalysis = await res.json();

      setAnalyses((prev) => ({
        ...prev,
        [video.id]: data,
      }));

      setActiveAnalysis(data);
    } catch (err: any) {
      setErrorToast(err.message || "Échec de l'analyse IA.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setAnalyzingVideoId(null);
      setAnalyzingStep("");
    }
  };

  // Handle Save / Unsave Clip
  const handleToggleSaveClip = (clip: ViralClip) => {
    setSavedClips((prev) => {
      const exists = prev.some((c) => c.id === clip.id);
      if (exists) {
        return prev.filter((c) => c.id !== clip.id);
      } else {
        return [clip, ...prev];
      }
    });
  };

  // Filtered videos list
  const visibleVideos = useMemo(() => {
    let list: VideoItem[] = [];

    if (selectedCreatorId) {
      const creator = creators.find((c) => c.id === selectedCreatorId);
      if (creator) {
        list = creator.videos.map((v) => ({
          ...v,
          channelName: creator.name,
          channelAvatar: creator.avatar,
          channelId: creator.id,
        }));
      }
    } else {
      // All creators combined
      creators.forEach((c) => {
        c.videos.forEach((v) => {
          list.push({
            ...v,
            channelName: c.name,
            channelAvatar: c.avatar,
            channelId: c.id,
          });
        });
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.channelName?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [creators, selectedCreatorId, searchQuery]);

  // Selected creator object
  const activeCreator = creators.find((c) => c.id === selectedCreatorId);

  return (
    <div className="min-h-screen bg-[#050507] text-[#e2e2e7] flex flex-col selection:bg-violet-500 selection:text-white font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-[#050507] to-[#050507]">
      {/* Header */}
      <Header
        onOpenAddCreator={() => setIsAddCreatorOpen(true)}
        onOpenDirectUrl={() => setIsDirectUrlOpen(true)}
        savedClipsCount={savedClips.length}
        onOpenSavedClips={() => setIsSavedClipsOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Hero Section */}
        <div className="relative rounded-3xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-violet-950/20 p-6 sm:p-8 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-3">
                <Flame className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span>Rétention Algorithmique TikTok, Shorts & Reels</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                Découpez vos vidéos YouTube préférées en extraits à fort potentiel viral
              </h2>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                Suivez vos vidéastes favoris, surveillez leurs dernières sorties et laissez{" "}
                <span className="text-white font-semibold">Gemini</span> analyser le rythme,
                les hooks et les moments de tension pour générer des clips calibrés pour TikTok.
              </p>
            </div>

            {/* Quick action buttons in Hero */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAddCreatorOpen(true)}
                className="px-6 py-3 rounded-2xl bg-white hover:bg-cyan-400 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ajouter un Vidéaste</span>
              </button>

              <button
                onClick={() => setIsDirectUrlOpen(true)}
                className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border border-white/10 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Coller un lien direct</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {errorToast && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorToast}</span>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="text-white/40 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Global Loading Overlay if analyzing */}
        {analyzingVideoId && (
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-violet-500/40 flex items-center justify-between gap-4 shadow-[0_0_25px_rgba(139,92,246,0.15)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Analyse de la rétention en cours...</h4>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">{analyzingStep}</p>
              </div>
            </div>
            <span className="text-xs text-white/40 font-mono hidden sm:inline">
              Powered by Google Gemini Flash
            </span>
          </div>
        )}

        {/* Creator Switcher & Add Bar */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">
                Mes Vidéastes Favoris ({creators.length})
              </h3>
            </div>
          </div>

          <CreatorBar
            creators={creators}
            selectedCreatorId={selectedCreatorId}
            onSelectCreator={(id) => setSelectedCreatorId(id)}
            onOpenAddModal={() => setIsAddCreatorOpen(true)}
            onRemoveCreator={handleRemoveCreator}
          />
        </div>

        {/* Active Creator Banner if one is selected */}
        {activeCreator && (
          <div className="relative rounded-2xl p-4 sm:p-5 bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={activeCreator.avatar}
                alt={activeCreator.name}
                className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{activeCreator.name}</h4>
                  <span className="text-xs font-mono text-violet-400">{activeCreator.handle}</span>
                </div>
                <p className="text-xs text-white/50">
                  {activeCreator.subscribers} abonnés • {activeCreator.category} •{" "}
                  {activeCreator.videos.length} vidéos disponibles
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCreatorId(null)}
              className="text-xs text-white/60 hover:text-white px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
            >
              Afficher tout le monde
            </button>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-cyan-400" />
              <span>Dernières Vidéos Sorties</span>
              <span className="text-xs text-white/40 font-normal font-mono">
                ({visibleVideos.length} vidéos)
              </span>
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer les vidéos par titre..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition"
            />
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Video Cards Grid */}
        <VideoGrid
          videos={visibleVideos}
          analyses={analyses}
          analyzingId={analyzingVideoId}
          onAnalyze={handleAnalyzeVideo}
          onOpenAnalysis={(analysis) => setActiveAnalysis(analysis)}
        />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 px-4 sm:px-8 text-center text-xs text-white/40 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">V-CLIP GEMINI</span>
          <span>•</span>
          <span>Propulsé par Google Gemini Flash</span>
        </div>
        <div className="flex items-center gap-4 text-white/40">
          <span>Optimisé pour la rétention TikTok, Reels & Shorts</span>
        </div>
      </footer>

      {/* Modals */}
      {isAddCreatorOpen && (
        <AddCreatorModal
          isOpen={isAddCreatorOpen}
          onClose={() => setIsAddCreatorOpen(false)}
          onAddCreator={handleAddCreator}
          existingCreatorIds={creators.map((c) => c.id)}
        />
      )}

      {isDirectUrlOpen && (
        <DirectUrlModal
          isOpen={isDirectUrlOpen}
          onClose={() => setIsDirectUrlOpen(false)}
          onAnalyzeVideo={handleAnalyzeVideo}
        />
      )}

      {activeAnalysis && (
        <AnalysisModal
          analysis={activeAnalysis}
          onClose={() => setActiveAnalysis(null)}
          creatorAvatar={
            creators.find((c) => c.name === activeAnalysis.channelName)?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(activeAnalysis.channelName)}&background=ff0033&color=fff`
          }
          creatorHandle={
            creators.find((c) => c.name === activeAnalysis.channelName)?.handle ||
            `@${activeAnalysis.channelName.replace(/\s+/g, "")}`
          }
          onSaveClip={handleToggleSaveClip}
          savedClipIds={savedClips.map((c) => c.id)}
        />
      )}

      {isSavedClipsOpen && (
        <SavedClipsModal
          isOpen={isSavedClipsOpen}
          onClose={() => setIsSavedClipsOpen(false)}
          savedClips={savedClips}
          onRemoveClip={(id) => setSavedClips((prev) => prev.filter((c) => c.id !== id))}
          onClearAll={() => setSavedClips([])}
        />
      )}
    </div>
  );
}
