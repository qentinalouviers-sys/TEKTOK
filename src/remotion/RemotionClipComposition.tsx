import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ViralClip, VideoItem } from "../types";

export interface RemotionClipProps {
  clip: ViralClip;
  video: VideoItem;
  channelName: string;
  subtitleStyle?: "hormozi" | "cyber" | "mrbeast" | "minimal";
  customHookText?: string;
  showProgressBar?: boolean;
  showCaptions?: boolean;
  layoutMode?: "split-blur" | "scale-crop" | "cinematic";
  customCaptions?: string[];
  sourceVideoUrl?: string | null;
}

export const RemotionClipComposition: React.FC<RemotionClipProps> = ({
  clip,
  video,
  channelName,
  subtitleStyle = "hormozi",
  customHookText,
  showProgressBar = true,
  showCaptions = true,
  layoutMode = "split-blur",
  sourceVideoUrl = null,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  // Calculate current second in clip
  const currentSecondsInClip = frame / fps;
  const currentVideoSecond = clip.startSeconds + currentSecondsInClip;

  // Spring animations for entrance
  const entranceSpring = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  const hookOpacity = interpolate(frame, [0, 10, 150, 180], [0, 1, 1, 0.85], {
    extrapolateRight: "clamp",
  });

  const hookScale = interpolate(entranceSpring, [0, 1], [0.85, 1]);

  // Hook text to display
  const hookText = customHookText || clip.suggestedTextOverlay || "ATTENDS LA FIN... 😱";

  // Build dynamic animated subtitle words based on timing
  // We divide clip into realistic phrase beats
  const phrases = [
    hookText,
    clip.hookExplanation.slice(0, 75),
    "Ce moment précis où tout bascule...",
    clip.clipTitle,
    "Regarde bien ce qui se passe ici !",
    "Incroyable réaction de " + (channelName || "créateur"),
  ];

  const phraseIndex = Math.min(
    phrases.length - 1,
    Math.floor((frame / durationInFrames) * phrases.length)
  );
  const currentPhrase = phrases[phraseIndex] || hookText;
  const phraseWords = currentPhrase.split(" ").filter(Boolean);

  // Subtitle styling presets
  const getSubtitleTheme = () => {
    switch (subtitleStyle) {
      case "cyber":
        return {
          textColor: "#00f0ff",
          highlightColor: "#ff007f",
          bgBadge: "rgba(10, 15, 30, 0.85)",
          border: "2px solid #00f0ff",
          shadow: "0 0 25px rgba(0, 240, 255, 0.6)",
        };
      case "mrbeast":
        return {
          textColor: "#ffffff",
          highlightColor: "#facc15",
          bgBadge: "rgba(220, 38, 38, 0.95)",
          border: "3px solid #facc15",
          shadow: "0 10px 30px rgba(0, 0, 0, 0.9)",
        };
      case "minimal":
        return {
          textColor: "#ffffff",
          highlightColor: "#38bdf8",
          bgBadge: "rgba(0, 0, 0, 0.75)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          shadow: "0 8px 20px rgba(0,0,0,0.6)",
        };
      case "hormozi":
      default:
        return {
          textColor: "#ffffff",
          highlightColor: "#eab308",
          bgBadge: "rgba(0, 0, 0, 0.9)",
          border: "3px solid #eab308",
          shadow: "0 12px 35px rgba(0, 0, 0, 0.85)",
        };
    }
  };

  const theme = getSubtitleTheme();

  // Calculate animated progress bar percentage (0 to 100)
  const progressPercent = Math.min(100, (frame / durationInFrames) * 100);

  // Format timestamp display mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Generate reactive sound bars
  const barCount = 18;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "#050508",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* BACKGROUND LAYER - 9:16 Vertical Framing with Blurred Ambiance */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${video.thumbnail})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          filter: "blur(28px) brightness(0.35) saturate(1.4)",
          transform: "scale(1.2)",
        }}
      />

      {/* TOP GRADIENT FOR TIKTOK HUD READABILITY */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "300px",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)",
          zIndex: 5,
        }}
      />

      {/* BOTTOM GRADIENT FOR CAPTION READABILITY */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "450px",
          background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)",
          zIndex: 5,
        }}
      />

      {/* MAIN VIDEO FRAME (CENTERED 16:9 or CROPPED 9:16) */}
      <div
        style={{
          position: "absolute",
          top: layoutMode === "scale-crop" ? "0%" : "22%",
          left: "0%",
          right: "0%",
          height: layoutMode === "scale-crop" ? "100%" : "56%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
          overflow: "hidden",
          boxShadow: layoutMode === "scale-crop" ? "none" : "0 25px 60px rgba(0,0,0,0.9)",
          borderRadius: layoutMode === "scale-crop" ? "0px" : "16px",
          border: layoutMode === "scale-crop" ? "none" : "1px solid rgba(255,255,255,0.12)",
          margin: layoutMode === "scale-crop" ? "0" : "0 30px",
        }}
      >
        {sourceVideoUrl ? (
          <video
            src={sourceVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: layoutMode === "scale-crop" ? "cover" : "contain",
            }}
          />
        ) : (
          <img
            src={video.thumbnail}
            alt={video.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: layoutMode === "scale-crop" ? "cover" : "contain",
              transform: `scale(${1 + Math.sin(frame / 60) * 0.02})`,
            }}
          />
        )}

        {/* TIME LIVE COUNTER BADGE */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            padding: "8px 16px",
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#ffffff",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#ef4444",
              display: "inline-block",
            }}
          />
          {formatTime(currentVideoSecond)} / {clip.endTime}
        </div>
      </div>

      {/* TOP HEADER: HOOK TEXT OVERLAY */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          left: "40px",
          right: "40px",
          zIndex: 10,
          opacity: hookOpacity,
          transform: `scale(${hookScale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "16px 28px",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(16px)",
            borderRadius: "20px",
            border: "2px solid rgba(239, 68, 68, 0.8)",
            boxShadow: "0 10px 30px rgba(239, 68, 68, 0.4)",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "36px",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {hookText}
          </span>
        </div>
      </div>

      {/* CREATOR BADGE & WATERMARK */}
      <div
        style={{
          position: "absolute",
          top: "185px",
          left: "50px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            padding: "6px 16px",
            borderRadius: "9999px",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            color: "#ffffff",
            fontSize: "20px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ color: "#38bdf8" }}>▶</span>
          <span>{channelName}</span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>|</span>
          <span style={{ color: "#4ade80", fontWeight: 700 }}>
            {clip.viralityScore}/100 VIRAL
          </span>
        </div>
      </div>

      {/* DYNAMIC WORD-BY-WORD HORMOZI / MRBEAST ANIMATED SUBTITLES */}
      {showCaptions && (
        <div
          style={{
            position: "absolute",
            bottom: "220px",
            left: "40px",
            right: "40px",
            zIndex: 15,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
              padding: "20px 32px",
              backgroundColor: theme.bgBadge,
              backdropFilter: "blur(16px)",
              borderRadius: "24px",
              border: theme.border,
              boxShadow: theme.shadow,
              maxWidth: "92%",
            }}
          >
            {phraseWords.map((word, idx) => {
              const activeWordIndex =
                Math.floor((frame % 35) / (35 / phraseWords.length)) %
                phraseWords.length;
              const isHighlight = idx === activeWordIndex;

              const wordBounce = isHighlight
                ? 1 + Math.sin(frame * 0.4) * 0.12
                : 1;

              return (
                <span
                  key={idx}
                  style={{
                    color: isHighlight ? theme.highlightColor : theme.textColor,
                    fontSize: "44px",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    transform: `scale(${wordBounce})`,
                    display: "inline-block",
                    textShadow: isHighlight
                      ? `0 0 20px ${theme.highlightColor}`
                      : "0 2px 8px rgba(0,0,0,0.8)",
                    transition: "transform 0.1s ease",
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* SOUNDWAVE VISUALIZER AT BOTTOM */}
      <div
        style={{
          position: "absolute",
          bottom: "120px",
          left: "60px",
          right: "60px",
          height: "45px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {Array.from({ length: barCount }).map((_, i) => {
          const waveHeight =
            12 + Math.abs(Math.sin((frame + i * 14) * 0.18)) * 36;
          return (
            <div
              key={i}
              style={{
                width: "8px",
                height: `${waveHeight}px`,
                backgroundColor: i % 2 === 0 ? "#38bdf8" : "#eab308",
                borderRadius: "4px",
                opacity: 0.75,
              }}
            />
          );
        })}
      </div>

      {/* RETENTION PROGRESS BAR FILLING ACROSS CLIP DURATION */}
      {showProgressBar && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: "40px",
            right: "40px",
            height: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: "9999px",
            overflow: "hidden",
            zIndex: 15,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "linear-gradient(to right, #38bdf8, #a855f7, #f43f5e)",
              borderRadius: "9999px",
              boxShadow: "0 0 12px rgba(56, 189, 248, 0.8)",
            }}
          />
        </div>
      )}

      {/* REMOTION POWERED BADGE */}
      <div
        style={{
          position: "absolute",
          bottom: "14px",
          left: "0px",
          right: "0px",
          textAlign: "center",
          zIndex: 12,
          fontSize: "15px",
          fontWeight: 600,
          color: "rgba(255, 255, 255, 0.45)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        Généré avec Remotion Engine • 1080x1920 (9:16)
      </div>
    </div>
  );
};
