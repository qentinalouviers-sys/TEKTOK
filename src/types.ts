export interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  views: string;
  duration: string;
  description: string;
  channelId?: string;
  channelName?: string;
  channelAvatar?: string;
}

export interface Creator {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  subscribers: string;
  category: string;
  banner: string;
  videos: VideoItem[];
}

export interface ViralClip {
  id: string;
  clipType: string;
  clipTitle: string;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  viralityScore: number;
  hookExplanation: string;
  retentionAnalysis: string;
  dropoffPrevention: string;
  suggestedTextOverlay: string;
  tiktokCaption: string;
  editingTips: string[];
  retentionCurve: number[];
}

export interface VideoAnalysis {
  videoId: string;
  videoTitle: string;
  channelName: string;
  overallViralScore: number;
  viralSummary: string;
  bestPostingTimes: string;
  targetVibe: string;
  clips: ViralClip[];
  analyzedAt: string;
  modelUsed?: string;
  isFallback?: boolean;
}
