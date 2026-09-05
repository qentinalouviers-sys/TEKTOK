import React from "react";
import { AbsoluteFill } from "remotion";


import { BADGE_STYLE, COLORS, FONT_FAMILY, SAFE_AREA } from "./theme";
import type { Badges } from "./schema";

type HabillageProps = {
  badges: Badges;
  date: string;
};

/**
 * Habillage haut (pastille marque + pastille IA + date) et scrim bas pour
 * garder les sous-titres lisibles quel que soit le fond.
 */
export const Habillage: React.FC<HabillageProps> = ({ badges, date }) => {
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: SAFE_AREA.top,
          left: SAFE_AREA.side,
          right: SAFE_AREA.side,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {badges.showBrand && <Pill label="VIADEO" filled />}
          {badges.showAI && <Pill label="IA" />}
        </div>
        {badges.showDate && (
          <div
            style={{
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              fontSize: 28,
              color: COLORS.text,
              opacity: 0.85,
            }}
          >
            {date}
          </div>
        )}
      </div>

      {/* Scrim bas : degrade discret pour la lisibilite des sous-titres. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 520,
          background: `linear-gradient(to bottom, rgba(14,17,22,0) 0%, rgba(14,17,22,0.75) 100%)`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

const Pill: React.FC<{ label: string; filled?: boolean }> = ({
  label,
  filled,
}) => (
  <div
    style={{
      height: BADGE_STYLE.height,
      paddingLeft: BADGE_STYLE.paddingX,
      paddingRight: BADGE_STYLE.paddingX,
      borderRadius: BADGE_STYLE.height / 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: filled ? COLORS.accent : "rgba(23,28,34,0.75)",
      border: filled ? "none" : `2px solid ${COLORS.accent}`,
    }}
  >
    <span
      style={{
        fontFamily: FONT_FAMILY,
        fontWeight: BADGE_STYLE.fontWeight,
        fontSize: BADGE_STYLE.fontSize,
        letterSpacing: 1,
        color: filled ? COLORS.charcoal : COLORS.accent,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  </div>
);
