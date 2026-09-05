// Local type definitions for Viadeo components (adapted from MoneyPrinterTurbo)

export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export interface Punch {
  at: number;
  duration: number;
  text: string;
}

export interface BrollSegment {
  clipPath: string;
  insertAt: number;
  duration: number;
}

export interface Badges {
  showBrand: boolean;
  showAI: boolean;
  showDate: boolean;
}
