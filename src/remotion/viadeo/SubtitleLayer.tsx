import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Subtitle } from "./schema";
import { COLORS, FONT_FAMILY, SAFE_AREA, SUBTITLE_STYLE } from "./theme";

type SubtitleLayerProps = {
  subtitles: Subtitle[];
};

/**
 * Sous-titres blancs, larges, groupes par courts segments (lisibles sans le
 * son). Un seul segment actif a la fois, cut sec a l'entree comme a la sortie
 * (pas de fondu long, cf. DA "rythme").
 */
export const SubtitleLayer: React.FC<SubtitleLayerProps> = ({ subtitles }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const active = subtitles.find((s) => t >= s.start && t < s.end);
  if (!active) return null;

  const framesSinceStart = frame - Math.round(active.start * fps);
  const pop = spring({
    frame: framesSinceStart,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.6 },
  });
  const scale = interpolate(pop, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: SUBTITLE_STYLE.bottomOffset,
        paddingLeft: SAFE_AREA.side,
        paddingRight: SAFE_AREA.side,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: SUBTITLE_STYLE.fontWeight,
          fontSize: SUBTITLE_STYLE.fontSize,
          lineHeight: SUBTITLE_STYLE.lineHeight,
          letterSpacing: SUBTITLE_STYLE.letterSpacing,
          color: COLORS.subtitle,
          textAlign: "center",
          transform: `scale(${scale})`,
          opacity: pop,
          textShadow: [
            `0 0 ${SUBTITLE_STYLE.strokeWidth}px rgba(0,0,0,0.9)`,
            "0 4px 18px rgba(0,0,0,0.65)",
          ].join(", "),
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};
