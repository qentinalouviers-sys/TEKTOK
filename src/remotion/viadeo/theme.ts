/**
 * Constantes de style Viadeo (charte docs/DA.md).
 * Point unique de retouche pour couleurs / typo / dimensions.
 */

export const COLORS = {
  charcoal: "#0E1116",
  surface: "#171C22",
  accent: "#E8923C",
  text: "#E7EAEE",
  subtitle: "#FFFFFF",
} as const;

// Sans-serif grasse système (pas de police distante : le rendu doit marcher hors-ligne).
export const FONT_FAMILY =
  '-apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif';

export const LAYOUT = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

export const SAFE_AREA = {
  top: 90,
  bottom: 160,
  side: 56,
} as const;

export const SUBTITLE_STYLE = {
  fontSize: 68,
  lineHeight: 1.15,
  fontWeight: 800,
  letterSpacing: -0.5,
  strokeWidth: 10,
  bottomOffset: SAFE_AREA.bottom,
} as const;

export const PUNCH_STYLE = {
  fontSize: 140,
  fontWeight: 900,
  letterSpacing: -2,
} as const;

export const BADGE_STYLE = {
  height: 64,
  fontSize: 30,
  fontWeight: 800,
  paddingX: 28,
} as const;
