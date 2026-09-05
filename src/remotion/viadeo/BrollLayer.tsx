import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import type { BrollSegment } from "./schema";

type BrollLayerProps = {
  segments: BrollSegment[];
  fps: number;
};

/**
 * Recouvre ponctuellement l'avatar par des clips b-roll (illustration de la
 * news) pendant les fenetres de temps fournies par le pipeline.
 */
export const BrollLayer: React.FC<BrollLayerProps> = ({ segments, fps }) => {
  return (
    <>
      {segments.map((segment, index) => (
        <Sequence
          key={index}
          from={Math.round(segment.insertAt * fps)}
          durationInFrames={Math.round(segment.duration * fps)}
        >
          <AbsoluteFill>
            <OffthreadVideo
              src={
                /^(https?:)?\/\//.test(segment.clipPath)
                  ? segment.clipPath
                  : staticFile(segment.clipPath.replace(/^public\//, ""))
              }
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        </Sequence>
      ))}
    </>
  );
};
