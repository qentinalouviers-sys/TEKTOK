import React, { useState } from "react";
import { X, Search, Sparkles, UserPlus, Loader2, Youtube, AlertCircle } from "lucide-react";
import { Creator } from "../types";

interface AddCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCreator: (creator: Creator) => void;
  existingCreatorIds: string[];
}

const SUGGESTIONS = [
  { label: "Amixem", query: "@Amixem" },
  { label: "Mastu", query: "@Mastu" },
  { label: "Joyca", query: "@Joyca" },
  { label: "HugoDécrypte", query: "@HugoDecrypte" },
  { label: "Veritasium", query: "@Veritasium" },
  { label: "Kurzgesagt", query: "@kurzgesagt" },
  { label: "Michou", query: "@Michou" },
];

export const AddCreatorModal: React.FC<AddCreatorModalProps> = ({
  isOpen,
  onClose,
  onAddCreator,
  existingCreatorIds,
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<Creator | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const res = await fetch("/api/creators/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Échec de la recherche du vidéaste.");
      }

      const data = await res.json();
      if (data.creator) {
        setSearchResult(data.creator);
      } else {
        setError("Aucun créateur trouvé pour cette recherche.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!searchResult) return;
    onAddCreator(searchResult);
    onClose();
    setQuery("");
    setSearchResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#050507] border border-white/10 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ajouter un YouTubeur</h3>
              <p className="text-xs text-white/40">
                Par nom, @handle ou lien de chaîne YouTube
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col gap-3"
        >
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex: @Amixem, HugoDécrypte, ou lien YouTube..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition pr-28"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Chercher</span>
            </button>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-white/40 mr-1 font-mono">Suggestions :</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setQuery(s.query);
                  handleSearch(s.query);
                }}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Result card */}
        {searchResult && (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-3.5">
              <img
                src={searchResult.avatar}
                alt={searchResult.name}
                className="w-14 h-14 rounded-2xl object-cover border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{searchResult.name}</h4>
                <p className="text-xs text-violet-400 font-mono">{searchResult.handle}</p>
                <p className="text-xs text-white/50 mt-0.5">
                  {searchResult.subscribers} • {searchResult.category}
                </p>
              </div>
            </div>

            <div className="text-xs text-white/60">
              <span className="text-white font-medium">
                {searchResult.videos.length} vidéos trouvées
              </span>{" "}
              prêtes à être analysées pour générer des clips TikTok.
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Ajouter à ma plateforme</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
