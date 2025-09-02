export interface AudioTrack {
  id: string;
  name: string;
  artist: string;
  url: string;
}

export interface PlayerProps {
  track?: AudioTrack | null;
  height?: number;
  onPlay?: () => void;
  onPause?: () => void;
  onRemove?: () => void;
  isPlaying?: boolean;
  isCompact?: boolean;
}

export interface WavesurferRegion {
  id: string;
  start: number;
  end: number;
  color?: string;
  drag?: boolean;
  resize?: boolean;
}