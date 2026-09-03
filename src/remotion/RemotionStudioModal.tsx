import React, { useState, useRef } from "react";
import { Player, PlayerRef } from "@remotion/player";
import {
  X,
  Play,
  Download,
  Code2,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Maximize2,
  Film,
  Layers,
  Flame,
  Clock,
  Video,
  ExternalLink,
  Upload,
  Radio,
  FileVideo,
  Trash2,
  Terminal,
  Info,
  AlertCircle,
} from "lucide-react";
import { RemotionClipComposition } from "./RemotionClipComposition";
import { ViralClip, VideoItem } from "../types";

interface RemotionStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  clip: ViralClip | null;
  video: VideoItem | null;
  channelName: string;
}

export const RemotionStudioModal: React.FC<RemotionStudioModalProps> = ({
  isOpen,
  onClose,
  clip,
  video,
  channelName,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remotion customization state
  const [subtitleStyle, setSubtitleStyle] = useState<
    "hormozi" | "cyber" | "mrbeast" | "minimal"
  >("hormozi");
  const [customHookText, setCustomHookText] = useState("");
  const [showProgressBar, setShowProgressBar] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [layoutMode, setLayoutMode] = useState<
    "split-blur" | "scale-crop" | "cinematic"
  >("split-blur");

  // Real source video file upload state
  const [sourceVideoFile, setSourceVideoFile] = useState<File | null>(null);
  const [sourceVideoUrl, setSourceVideoUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDownloadTools, setShowDownloadTools] = useState(false);
  const [copiedYtDlp, setCopiedYtDlp] = useState(false);

  // Duration when generating motion graphic without file
  const [motionDuration, setMotionDuration] = useState<10 | 15 | 30>(10);

  // Export / Copy state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<"mp4" | "webm" | "gif">("mp4");
  const [exportStatusText, setExportStatusText] = useState<string>("");
  const [lastExportedFormat, setLastExportedFormat] = useState<string>("mp4");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadReadyUrl, setDownloadReadyUrl] = useState<string | null>(null);

  if (!isOpen || !clip || !video) return null;

  // Calculate duration in frames (30 fps)
  const fps = 30;
  const durationInSeconds = Math.max(5, Math.min(60, clip.durationSeconds || 30));
  const durationInFrames = Math.round(durationInSeconds * fps);

  const activeHookText = customHookText || clip.suggestedTextOverlay;

  // Handle source video file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
    setSourceVideoFile(file);
    setSourceVideoUrl(URL.createObjectURL(file));
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("video/")) return;
    if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
    setSourceVideoFile(file);
    setSourceVideoUrl(URL.createObjectURL(file));
  };

  const handleRemoveSourceFile = () => {
    if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
    setSourceVideoFile(null);
    setSourceVideoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Direct tab / screen capture with audio
  const handleStartTabCapture = async () => {
    try {
      setIsExporting(true);
      setExportProgress(10);
      setExportStatusText("Sélectionnez l'onglet avec la vidéo YouTube (Activez 'Partager l'audio')...");

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as any,
        audio: true,
      });

      setExportStatusText("Enregistrement direct de l'extrait en cours... Laissez la vidéo tourner.");
      setExportProgress(35);

      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setExportProgress(75);
        setExportStatusText("Conversion FFmpeg en MP4 universel (H.264 / AAC)...");
        const cleanName = `capture-${channelName}-${clip.clipTitle}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

        try {
          const recordedBlob = new Blob(chunks, { type: "video/webm" });
          const convertRes = await fetch(
            `/api/convert-video?format=mp4&filename=${encodeURIComponent(cleanName)}`,
            {
              method: "POST",
              headers: { "Content-Type": "video/webm" },
              body: recordedBlob,
            }
          );

          if (!convertRes.ok) throw new Error("Conversion échouée");

          const convertedBlob = await convertRes.blob();
          const convertedUrl = URL.createObjectURL(convertedBlob);
          setDownloadReadyUrl(convertedUrl);
          setExportProgress(100);
          setExportStatusText(`Extrait enregistré (${(convertedBlob.size / (1024 * 1024)).toFixed(1)} Mo) téléchargé !`);
          setIsExporting(false);

          const a = document.createElement("a");
          a.href = convertedUrl;
          a.download = `${cleanName}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (convErr) {
          console.error("Conversion error:", convErr);
          setIsExporting(false);
          setExportStatusText("Erreur lors de la conversion de la capture.");
        }
      };

      mediaRecorder.start();

      // Automatically stop after clip duration
      const recordMs = (clip.durationSeconds || 30) * 1000;
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, recordMs);
    } catch (err: any) {
      console.warn("Screen capture cancelled:", err);
      setIsExporting(false);
      setExportProgress(0);
      setExportStatusText("Capture annulée.");
    }
  };

  // Main Export Pipeline: Trims source video file via FFmpeg OR generates continuous motion graphic with audio
  const handleExportVideo = async () => {
    setIsExporting(true);
    setExportProgress(10);
    setDownloadReadyUrl(null);
    const targetFormat = exportFormat;
    setLastExportedFormat(targetFormat);

    const cleanName = `clip-${channelName}-${clip.clipTitle}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);

    // MODE 1: SOURCE VIDEO FILE IS LOADED -> REAL FFMPEG 9:16 TRIM WITH AUDIO
    if (sourceVideoFile) {
      try {
        setExportStatusText("Téléversement du fichier source vers FFmpeg...");
        setExportProgress(25);

        const res = await fetch(
          `/api/render-clip-file?startTime=${encodeURIComponent(clip.startTime)}&duration=${clip.durationSeconds}&format=${targetFormat}&filename=${encodeURIComponent(cleanName)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": sourceVideoFile.type || "video/mp4",
            },
            body: sourceVideoFile,
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Erreur serveur ${res.status}`);
        }

        setExportProgress(80);
        setExportStatusText(`Finalisation et encodage 9:16 H.264 / AAC (.${targetFormat.toUpperCase()})...`);

        const convertedBlob = await res.blob();
        const convertedUrl = URL.createObjectURL(convertedBlob);
        setDownloadReadyUrl(convertedUrl);
        setExportProgress(100);
        const sizeMb = (convertedBlob.size / (1024 * 1024)).toFixed(1);
        setExportStatusText(`Clip réel généré et téléchargé avec succès (${sizeMb} Mo) !`);
        setIsExporting(false);

        const a = document.createElement("a");
        a.href = convertedUrl;
        a.download = `${cleanName}.${targetFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch (err: any) {
        console.error("Render source file error:", err);
        setIsExporting(false);
        setExportProgress(0);
        setExportStatusText("Erreur: " + (err?.message || "Échec du découpage"));
        return;
      }
    }

    // MODE 2: MOTION GRAPHIC RENDER (Full duration with Web Audio beat and continuous animation)
    setExportStatusText("Génération de l'animation Motion Graphic 9:16...");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context 2d unavailable");

      // Load thumbnail
      let thumbnailImg: HTMLImageElement | null = null;
      if (video.thumbnail) {
        try {
          thumbnailImg = new Image();
          thumbnailImg.crossOrigin = "anonymous";
          thumbnailImg.src = video.thumbnail;
          await new Promise((resolve) => {
            if (!thumbnailImg) return resolve(null);
            thumbnailImg.onload = () => resolve(thumbnailImg);
            thumbnailImg.onerror = () => resolve(null);
            setTimeout(resolve, 500);
          });
        } catch {
          thumbnailImg = null;
        }
      }

      // Synthesize audio track via Web Audio API so the video file has real audio clocks
      let audioDest: MediaStreamAudioDestinationNode | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioDest = audioCtx.createMediaStreamDestination();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(110, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
          osc.connect(gain);
          gain.connect(audioDest);
          osc.start();
        }
      } catch (e) {
        console.warn("Web Audio init:", e);
      }

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioDest ? audioDest.stream.getAudioTracks() : []),
      ]);

      let mediaRecorder: MediaRecorder | null = null;
      const mimeTypesToTry = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp9",
        "video/webm",
      ];
      for (const mime of mimeTypesToTry) {
        if (MediaRecorder.isTypeSupported(mime)) {
          mediaRecorder = new MediaRecorder(combinedStream, { mimeType: mime, videoBitsPerSecond: 8000000 });
          break;
        }
      }
      if (!mediaRecorder) {
        mediaRecorder = new MediaRecorder(combinedStream);
      }

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // Full animation frames: 10s = 300 frames at 30 fps
      const renderTotalFrames = motionDuration * 30;
      let currentFrame = 0;
      const words = (clip.clipTitle || "MOMENT FORT VIRAL").split(" ");

      const drawFrame = (frame: number) => {
        const progress = frame / renderTotalFrames;

        // Background
        ctx.fillStyle = "#09090e";
        ctx.fillRect(0, 0, 1080, 1920);

        if (thumbnailImg && thumbnailImg.complete && thumbnailImg.naturalWidth > 0) {
          ctx.save();
          ctx.filter = "blur(32px) brightness(0.35)";
          const scale = 1.05 + Math.sin(progress * Math.PI * 2) * 0.05;
          const bgW = 1080 * scale;
          const bgH = 1920 * scale;
          ctx.drawImage(thumbnailImg, (1080 - bgW) / 2, (1920 - bgH) / 2, bgW, bgH);
          ctx.restore();

          // Center video card
          ctx.save();
          const cardW = 980;
          const cardH = 551;
          const cardX = (1080 - cardW) / 2;
          const cardY = (1920 - cardH) / 2 - 40;

          ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 20;

          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 28);
          ctx.clip();
          ctx.drawImage(thumbnailImg, cardX, cardY, cardW, cardH);
          ctx.restore();
        } else {
          const grad = ctx.createLinearGradient(0, 0, 0, 1920);
          grad.addColorStop(0, "#121222");
          grad.addColorStop(0.5, "#0b0b14");
          grad.addColorStop(1, "#180d24");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 1080, 1920);
        }

        // TikTok safe-zone marker
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Pour toi", 540, 120);
        ctx.restore();

        // Viral Hook Header Badge
        const bounce = Math.sin(progress * Math.PI * 6) * 8;
        ctx.save();
        ctx.translate(540, 260 + bounce);

        const hookText = (activeHookText || "MOMENT FORT").slice(0, 42);
        ctx.font = "900 44px -apple-system, BlinkMacSystemFont, sans-serif";
        const metrics = ctx.measureText(hookText);
        const pillW = metrics.width + 70;
        const pillH = 88;

        ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 24);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(hookText, 0, 0);
        ctx.restore();

        // Channel Badge
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "600 30px -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`@${channelName} • ClipViral AI`, 540, 370);
        ctx.restore();

        // Dynamic Subtitles
        if (showCaptions) {
          ctx.save();
          const activeWordIndex = Math.floor((progress * 4 * words.length) % words.length);
          ctx.translate(540, 1420);

          if (subtitleStyle === "hormozi") {
            const currentWord = words[activeWordIndex] || words[0] || "";
            ctx.font = "900 68px -apple-system, BlinkMacSystemFont, sans-serif";
            const wordWidth = ctx.measureText(currentWord.toUpperCase()).width + 60;

            ctx.fillStyle = "rgba(0,0,0,0.85)";
            ctx.beginPath();
            ctx.roundRect(-wordWidth / 2, -50, wordWidth, 100, 20);
            ctx.fill();

            ctx.fillStyle = activeWordIndex % 2 === 0 ? "#facc15" : "#4ade80";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(currentWord.toUpperCase(), 0, 0);
          } else if (subtitleStyle === "cyber") {
            const currentWord = words[activeWordIndex] || words[0] || "";
            ctx.shadowColor = "#06b6d4";
            ctx.shadowBlur = 25;
            ctx.font = "900 64px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillStyle = "#22d3ee";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(currentWord, 0, 0);
          } else if (subtitleStyle === "mrbeast") {
            const currentWord = words[activeWordIndex] || words[0] || "";
            ctx.font = "900 70px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 14;
            ctx.strokeStyle = "#000000";
            ctx.strokeText(currentWord.toUpperCase(), 0, 0);
            ctx.fillStyle = "#ef4444";
            ctx.fillText(currentWord.toUpperCase(), 0, 0);
          } else {
            const currentWord = words[activeWordIndex] || words[0] || "";
            ctx.font = "700 52px -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            ctx.shadowBlur = 15;
            ctx.fillText(currentWord, 0, 0);
          }
          ctx.restore();
        }

        // Animated Audio Waveform
        ctx.save();
        const numBars = 16;
        const totalW = 400;
        const startX = (1080 - totalW) / 2;
        const barW = 14;
        const barSpacing = (totalW - numBars * barW) / (numBars - 1);

        for (let i = 0; i < numBars; i++) {
          const h = 20 + Math.sin(progress * 25 + i * 0.8) * 35 + Math.cos(progress * 35 - i * 0.5) * 20;
          const x = startX + i * (barW + barSpacing);
          const y = 1620 - h / 2;
          ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
          ctx.beginPath();
          ctx.roundRect(x, y, barW, Math.max(10, h), 7);
          ctx.fill();
        }
        ctx.restore();

        // Retention Progress Bar
        if (showProgressBar) {
          ctx.save();
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.fillRect(0, 1904, 1080, 16);

          ctx.fillStyle = "#06b6d4";
          ctx.fillRect(0, 1904, 1080 * progress, 16);
          ctx.restore();
        }
      };

      mediaRecorder.start();

      const renderInterval = setInterval(() => {
        if (currentFrame >= renderTotalFrames) {
          clearInterval(renderInterval);
          mediaRecorder?.stop();
        } else {
          drawFrame(currentFrame);
          currentFrame++;
          setExportProgress(Math.min(65, Math.round((currentFrame / renderTotalFrames) * 60)));
          setExportStatusText(`Génération des trames (${currentFrame}/${renderTotalFrames} - ${motionDuration}s)...`);
        }
      }, 1000 / 30);

      // Await recording completion
      await new Promise<Blob>((resolve) => {
        if (!mediaRecorder) return;
        mediaRecorder.onstop = () => {
          const recordedBlob = new Blob(chunks, { type: "video/webm" });
          resolve(recordedBlob);
        };
      }).then(async (recordedBlob) => {
        if (targetFormat === "webm") {
          const url = URL.createObjectURL(recordedBlob);
          setDownloadReadyUrl(url);
          setExportProgress(100);
          setExportStatusText("Fichier .webm généré avec succès !");
          setIsExporting(false);

          const a = document.createElement("a");
          a.href = url;
          a.download = `${cleanName}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          setExportProgress(75);
          setExportStatusText(
            targetFormat === "mp4"
              ? "Conversion FFmpeg H.264 / AAC universel (TikTok/Reels)..."
              : "Encodage GIF animé optimisé..."
          );

          try {
            const convertRes = await fetch(
              `/api/convert-video?format=${targetFormat}&filename=${encodeURIComponent(cleanName)}`,
              {
                method: "POST",
                headers: { "Content-Type": "video/webm" },
                body: recordedBlob,
              }
            );

            if (!convertRes.ok) throw new Error(`Le serveur a répondu avec ${convertRes.status}`);

            const convertedBlob = await convertRes.blob();
            const convertedUrl = URL.createObjectURL(convertedBlob);
            setDownloadReadyUrl(convertedUrl);
            setExportProgress(100);
            const sizeMb = (convertedBlob.size / (1024 * 1024)).toFixed(1);
            setExportStatusText(`Vidéo complète téléchargée (${sizeMb} Mo, ${motionDuration}s) !`);
            setIsExporting(false);

            const a = document.createElement("a");
            a.href = convertedUrl;
            a.download = `${cleanName}.${targetFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (convertErr) {
            console.warn("Conversion serveur fallback:", convertErr);
            const fallbackUrl = URL.createObjectURL(recordedBlob);
            setDownloadReadyUrl(fallbackUrl);
            setExportProgress(100);
            setExportStatusText("Téléchargé au format direct (.webm)");
            setIsExporting(false);

            const a = document.createElement("a");
            a.href = fallbackUrl;
            a.download = `${cleanName}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      });
    } catch (err: any) {
      console.error("Export error:", err);
      setIsExporting(false);
      setExportProgress(0);
      setExportStatusText("Erreur: " + (err?.message || "Échec export"));
    }
  };

  const copyYtDlpCommand = () => {
    const cmd = `yt-dlp --download-sections "*${clip.startTime}-${clip.endTime}" -f mp4 "${video.url}" -o "clip_${clip.id}.mp4"`;
    navigator.clipboard.writeText(cmd);
    setCopiedYtDlp(true);
    setTimeout(() => setCopiedYtDlp(false), 2500);
  };

  // Generate Remotion TSX code for CLI rendering
  const remotionCodeSnippet = `// Remotion Root & Composition (1080x1920 - 9:16)
// Exécutez : npx remotion render src/index.ts ClipComposition out/clip.mp4

import { Composition } from "remotion";
import { RemotionClipComposition } from "./RemotionClipComposition";

export const RemotionRoot = () => {
  return (
    <Composition
      id="TikTokClip_${clip.id}"
      component={RemotionClipComposition}
      durationInFrames={${durationInFrames}}
      fps={${fps}}
      width={1080}
      height={1920}
      defaultProps={{
        clip: ${JSON.stringify(clip, null, 2)},
        video: ${JSON.stringify(video, null, 2)},
        channelName: "${channelName}",
        subtitleStyle: "${subtitleStyle}",
        customHookText: "${activeHookText.replace(/"/g, '\\"')}",
        showProgressBar: ${showProgressBar},
        showCaptions: ${showCaptions},
        layoutMode: "${layoutMode}",
      }}
    />
  );
};`;

  const copyRemotionCode = () => {
    navigator.clipboard.writeText(remotionCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyTikTokCaption = () => {
    navigator.clipboard.writeText(clip.tiktokCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Studio Remotion • Découpage & Export 9:16
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  Remotion 4.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Génération en temps réel du clip vertical prêt à publier sur TikTok, Reels & Shorts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SPLIT VIEW: REMOTION PLAYER + CONTROLS) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto bg-slate-950/40">
          {/* LEFT: 9:16 REMOTION LIVE PLAYER */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900/60 rounded-xl border border-slate-800/80 p-4 shadow-inner">
            <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aperçu Rendu 9:16 Vertical (1080 x 1920)</span>
            </div>

            {/* REMOTION PLAYER WRAPPER */}
            <div className="remotion-player-container relative w-[280px] sm:w-[320px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-black">
              <Player
                ref={playerRef}
                component={RemotionClipComposition}
                durationInFrames={durationInFrames}
                compositionWidth={1080}
                compositionHeight={1920}
                fps={fps}
                style={{
                  width: "100%",
                  height: "100%",
                }}
                controls
                autoPlay
                loop
                inputProps={{
                  clip,
                  video,
                  channelName,
                  subtitleStyle,
                  customHookText: activeHookText,
                  showProgressBar,
                  showCaptions,
                  layoutMode,
                  sourceVideoUrl: sourceVideoUrl || undefined,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-[280px] sm:w-[320px] text-[11px] text-slate-400 px-1">
              <span>Timecode : {clip.startTime} ➔ {clip.endTime}</span>
              <span className="font-mono text-cyan-400">
                {durationInSeconds}s ({durationInFrames} frames)
              </span>
            </div>

            {sourceVideoFile && (
              <div className="mt-3 w-[280px] sm:w-[320px] p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center justify-between">
                <span className="truncate max-w-[200px]">✓ Fichier vidéo actif : {sourceVideoFile.name}</span>
                <button
                  onClick={handleRemoveSourceFile}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="Retirer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: REMOTION CUSTOMIZER & EXPORT CONTROLS */}
          <div className="lg:col-span-7 flex flex-col gap-5 overflow-y-auto pr-1">
            {/* CLIP SUMMARY BANNER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {clip.clipType}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                    Rétention {clip.viralityScore}/100
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {clip.clipTitle}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-slate-400 block font-mono">
                  {clip.durationSeconds} secondes
                </span>
              </div>
            </div>

            {/* SOURCE VIDEO IMPORT & OPTIONS */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileVideo className="w-3.5 h-3.5 text-cyan-400" />
                  Source Vidéo du Clip (Pour découpage réel avec son)
                </label>
                <button
                  type="button"
                  onClick={() => setShowDownloadTools(!showDownloadTools)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Terminal className="w-3 h-3" />
                  {showDownloadTools ? "Masquer l'aide yt-dlp" : "Aide découpage YouTube"}
                </button>
              </div>

              {/* UPLOAD / RECORD AREA */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDropFile}
                className={`border-2 border-dashed rounded-xl p-3.5 text-center transition ${
                  isDragOver
                    ? "border-cyan-400 bg-cyan-950/20"
                    : sourceVideoFile
                    ? "border-emerald-500/50 bg-emerald-950/20"
                    : "border-slate-700 hover:border-slate-600 bg-slate-950/40"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/mp4,video/webm,video/quicktime,video/mkv"
                  className="hidden"
                  id="source-video-input"
                />

                {sourceVideoFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-xs">{sourceVideoFile.name}</p>
                        <p className="text-[10px] text-emerald-400">
                          {(sourceVideoFile.size / (1024 * 1024)).toFixed(1)} Mo • Prêt pour découpage FFmpeg 9:16 ({clip.startTime} ➔ {clip.endTime})
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveSourceFile}
                      className="px-2.5 py-1 text-xs text-red-400 hover:bg-red-950/40 border border-red-500/30 rounded-lg transition"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-left flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          Glissez la vidéo ou cliquez pour sélectionner le fichier (.mp4)
                        </p>
                        <p className="text-[11px] text-slate-400">
                          FFmpeg découpera automatiquement l'intervalle {clip.startTime} à {clip.endTime} en 9:16
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-lg border border-slate-700 transition"
                      >
                        Parcourir...
                      </button>
                      <button
                        type="button"
                        onClick={handleStartTabCapture}
                        className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-semibold rounded-lg border border-purple-500/40 transition flex items-center gap-1"
                        title="Capture l'audio et la vidéo de l'onglet YouTube en temps réel"
                      >
                        <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                        Capture Directe
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* YOUTUBE CUT HELP DRAWER */}
              {showDownloadTools && (
                <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Commande yt-dlp pour télécharger directement cet extrait :
                    </span>
                    <button
                      type="button"
                      onClick={copyYtDlpCommand}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedYtDlp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedYtDlp ? "Copié !" : "Copier"}
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto select-all">
                    {`yt-dlp --download-sections "*${clip.startTime}-${clip.endTime}" -f mp4 "${video.url}" -o "clip_${clip.id}.mp4"`}
                  </pre>
                  <p className="text-[10px] text-slate-400">
                    💡 Vous pouvez aussi simplement enregistrer l'écran avec le bouton <b>Capture Directe</b> ci-dessus pour capturer les {clip.durationSeconds}s avec le son YouTube !
                  </p>
                </div>
              )}

              {/* MODE SANS FICHIER: DURATION SELECTOR */}
              {!sourceVideoFile && (
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-400 shrink-0" />
                    Sans fichier importé, exporte un <b>Motion Graphic 9:16 animé</b> avec son :
                  </span>
                  <div className="flex items-center gap-1">
                    {[10, 15, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() => setMotionDuration(d as any)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                          motionDuration === d
                            ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* EDIT HOOK OVERLAY TEXT */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Accroche / Hook Text (Incrusté en haut du clip)
              </label>
              <input
                type="text"
                value={activeHookText}
                onChange={(e) => setCustomHookText(e.target.value)}
                placeholder="Ex: ATTENDS LA FIN... C'EST PAS POSSIBLE 😱"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Ce texte s'affiche avec animation rebondissante Remotion pour capter le spectateur dès la 1ère seconde.
              </p>
            </div>

            {/* SUBTITLE STYLES (HORMOZI, CYBER, MRBEAST, MINIMAL) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3 flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Style des Sous-titres Dynamiques Remotion
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    id: "hormozi",
                    name: "Alex Hormozi",
                    desc: "Jaune fluo & Blanc pop",
                    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                  },
                  {
                    id: "cyber",
                    name: "Cyber Neon",
                    desc: "Cyan & Magenta néon",
                    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                  },
                  {
                    id: "mrbeast",
                    name: "MrBeast Punch",
                    desc: "Badge Rouge & Jaune",
                    badge: "bg-red-500/20 text-red-300 border-red-500/30",
                  },
                  {
                    id: "minimal",
                    name: "Épuré Minimal",
                    desc: "Blanc pur & verre fumé",
                    badge: "bg-slate-500/20 text-slate-300 border-slate-500/30",
                  },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSubtitleStyle(st.id as any)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 ${
                      subtitleStyle === st.id
                        ? "bg-slate-800 border-cyan-500 shadow-md shadow-cyan-500/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold text-white">
                      {st.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {st.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* LAYOUT & HUD TOGGLES */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Cadrage & Éléments Graphiques
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setLayoutMode("split-blur")}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                    layoutMode === "split-blur"
                      ? "bg-purple-600/20 text-purple-300 border-purple-500"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  Flou Vertical 9:16
                </button>
                <button
                  onClick={() => setLayoutMode("scale-crop")}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                    layoutMode === "scale-crop"
                      ? "bg-purple-600/20 text-purple-300 border-purple-500"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  Plein Écran Zoom
                </button>
                <button
                  onClick={() => setLayoutMode("cinematic")}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition ${
                    layoutMode === "cinematic"
                      ? "bg-purple-600/20 text-purple-300 border-purple-500"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  Bandes Cinéma
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCaptions}
                    onChange={(e) => setShowCaptions(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Sous-titres mot-à-mot</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showProgressBar}
                    onChange={(e) => setShowProgressBar(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Barre de rétention</span>
                </label>
              </div>
            </div>

            {/* FORMAT D'EXPORTATION (MP4, WebM, GIF) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  Format d'exportation
                </label>
                <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {exportFormat === "mp4"
                    ? "H.264 / AAC • Universel"
                    : exportFormat === "webm"
                    ? "Flux Web VP9"
                    : "Animation Boucle"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExportFormat("mp4")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    exportFormat === "mp4"
                      ? "bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-400 text-white shadow-md shadow-cyan-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wide text-white">.MP4</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-cyan-400/20 text-cyan-300">
                      Recommandé
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    TikTok, Reels, Shorts, iPhone & Android
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("webm")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    exportFormat === "webm"
                      ? "bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-400 text-white shadow-md shadow-cyan-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wide text-white">.WEBM</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400">
                      Web
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Export direct natif du navigateur
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat("gif")}
                  className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                    exportFormat === "gif"
                      ? "bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-400 text-white shadow-md shadow-cyan-500/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black tracking-wide text-white">.GIF</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300">
                      Boucle
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Discord, e-mail & teasers
                  </span>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS & EXPORT PIPELINE */}
            <div className="mt-auto pt-2 flex flex-col gap-3">
              {/* SUCCESS DOWNLOAD BANNER */}
              {downloadReadyUrl && !isExporting && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clip .{lastExportedFormat.toUpperCase()} téléchargé avec succès !</span>
                  </div>
                  <a
                    href={downloadReadyUrl}
                    download={`remotion-clip-${clip.id}.${lastExportedFormat}`}
                    className="text-xs font-bold text-emerald-400 hover:underline shrink-0"
                  >
                    Re-télécharger
                  </a>
                </div>
              )}

              {/* PRIMARY EXPORT BUTTON */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportVideo}
                  disabled={isExporting}
                  className="flex-1 py-3.5 px-5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <div className="flex flex-col items-start text-left leading-tight">
                        <span className="text-xs font-bold">
                          {exportStatusText || `Rendu en cours (${exportProgress}%)...`}
                        </span>
                        <span className="text-[10px] text-cyan-200">
                          {exportProgress}% • Ne quittez pas la page
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Générer & Télécharger le Clip (.{exportFormat.toUpperCase()})</span>
                    </>
                  )}
                </button>

                <button
                  onClick={copyTikTokCaption}
                  className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Légende Copiée !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copier Légende & Hashtags</span>
                    </>
                  )}
                </button>
              </div>

              {/* SECONDARY REMOTION CODE / CLI EXPORT */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 pt-1">
                <button
                  onClick={copyRemotionCode}
                  className="hover:text-cyan-400 flex items-center gap-1.5 transition underline decoration-slate-700"
                >
                  {copiedCode ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Code Composition Remotion copié !
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      Exporter le code Remotion (.tsx / CLI render)
                    </span>
                  )}
                </button>

                <span className="font-mono text-slate-500">
                  Prêt pour TikTok, Reels & Shorts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
