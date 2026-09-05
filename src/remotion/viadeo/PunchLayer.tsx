import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Punch } from "./schema";
import { COLORS, FONT_FAMILY, PUNCH_STYLE } from "./theme";

type PunchLayerProps = {
  punches: Punch[];
  fps: number;
};

/**
 * Textes "punch" plein ecran (mots-cles, facon Brut) qui coupent sec entre
 * deux segments de sous-titres.
 */
export const PunchLayer: React.FC<PunchLayerProps> = ({ punches, fps }) => {
  return (
    <>
      {punches.map((punch, index) => (
        <Sequence
          key={index}
          from={Math.round(punch.at * fps)}
          durationInFrames={Math.round(punch.duration * fps)}
        >
          <SinglePunch text={punch.text} />
        </Sequence>
      ))}
    </>
  );
};

const SinglePunch: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 260, mass: 0.5 },
  });
  const scale = interpolate(pop, [0, 1], [0.7, 1]);

  // Cut sec en sortie : on ne fait fondre que les 3 dernieres frames.
  const outOpacity = interpolate(
    frame,
    [durationInFrames - 3, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.charcoal,
        alignItems: "center",
        justifyContent: "center",
        opacity: Math.min(pop, outOpacity),
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontWeight: PUNCH_STYLE.fontWeight,
          fontSize: PUNCH_STYLE.fontSize,
          letterSpacing: PUNCH_STYLE.letterSpacing,
          color: COLORS.accent,
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.02,
          transform: `scale(${scale})`,
          padding: "0 60px",
        }}
      >
        {text.split("\n").map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
