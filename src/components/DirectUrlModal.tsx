import React, { useState } from "react";
import { X, Youtube, Sparkles, Loader2, Link2, AlertCircle } from "lucide-react";
import { VideoItem } from "../types";

interface DirectUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeVideo: (video: VideoItem) => void;
}

export const DirectUrlModal: React.FC<DirectUrlModalProps> = ({
  isOpen,
  onClose,
  onAnalyzeVideo,
}) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    // Check youtube url
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = cleanUrl.match(regExp);
    const videoId = match ? match[1] : (/^[\w-]{11}$/.test(cleanUrl) ? cleanUrl : null);

    if (!videoId) {
      setError("Veuillez saisir un lien YouTube valide (ex: https://www.youtube.com/watch?v=...)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try to fetch oembed title
      let title = "Vidéo YouTube";
      let channel = "Chaîne YouTube";
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (oembedRes.ok) {
          const oembed = await oembedRes.json();
          title = oembed.title || title;
          channel = oembed.author_name || channel;
        }
      } catch {
        // fallback
      }

      const videoItem: VideoItem = {
        id: videoId,
        title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: "Récemment",
        views: "Nouvelle analyse",
        duration: "20:00",
        description: `Vidéo de ${channel}`,
        channelName: channel,
        channelAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(channel)}&background=ff0033&color=fff`,
      };

      onClose();
      setUrl("");
      onAnalyzeVideo(videoItem);
    } catch (err: any) {
      setError(err.message || "Erreur lors du traitement de la vidéo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-[#050507] border border-white/10 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Analyser un lien direct</h3>
              <p className="text-xs text-white/40">Collez n'importe quelle vidéo YouTube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
          />

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.35)] disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
            <span>Lancer l'analyse des clips TikTok</span>
          </button>
        </form>
      </div>
    </div>
  );
};
