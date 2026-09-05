import React, { useState } from "react";
import { Send, Check, AlertCircle, Loader2 } from "lucide-react";

const PLATFORMS = [
  { id: "tiktok",    label: "TikTok",    emoji: "📱", color: "from-pink-600 to-red-600" },
  { id: "instagram", label: "Instagram", emoji: "📸", color: "from-purple-600 to-pink-600" },
  { id: "youtube",   label: "YouTube",   emoji: "▶️",  color: "from-red-600 to-red-700" },
];

interface Props {
  clipId: string;
  filename: string;
  caption: string;
  serverDownloadUrl?: string | null;
}

export const PublishPanel: React.FC<Props> = ({ clipId, filename, caption, serverDownloadUrl }) => {
  const [selected, setSelected] = useState<string[]>(["tiktok"]);
  const [editedCaption, setEditedCaption] = useState(caption);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const publish = async () => {
    if (!serverDownloadUrl || selected.length === 0) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/publish-to-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId,
          filename,
          caption: editedCaption,
          platforms: selected,
          serverDownloadUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus("ok");
        setMessage("✓ En attente — AutoSocial va récupérer et publier automatiquement");
      } else {
        throw new Error(data.error || "Erreur");
      }
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Erreur");
    }
  };

  if (!serverDownloadUrl) return null;

  return (
    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-orange-500/30 flex flex-col gap-3">
      <div className="text-[11px] font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
        <Send className="w-3 h-3" />
        Publier sur les réseaux
      </div>

      <div className="flex gap-2">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition ${
              selected.includes(p.id)
                ? `bg-gradient-to-r ${p.color} text-white border-transparent`
                : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500"
            }`}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>

      <textarea
        value={editedCaption}
        onChange={e => setEditedCaption(e.target.value)}
        placeholder="Légende / hashtags..."
        rows={2}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
      />

      <button
        type="button"
        onClick={publish}
        disabled={status === "loading" || selected.length === 0}
        className="w-full py-2 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 transition disabled:opacity-50"
      >
        {status === "loading"
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi...</>
          : <><Send className="w-3.5 h-3.5" /> Planifier la publication</>
        }
      </button>

      {status === "ok" && (
        <div className="text-[11px] text-emerald-400 flex items-start gap-1.5">
          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{message}<br/><span className="text-slate-500">AutoSocial doit tourner sur ton PC : <code>npm run dashboard</code></span></span>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
          <AlertCircle className="w-3.5 h-3.5" /> {message}
        </div>
      )}
    </div>
  );
};
