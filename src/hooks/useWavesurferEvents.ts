'use client';

import { useEffect } from 'react';
import type { WaveSurferType } from '@/types/audio';

export const useWavesurferEvents = (
  wavesurfer: WaveSurferType | null,
  isReady: boolean,
  onPlay?: () => void,
  onPause?: () => void
) => {
  useEffect(() => {
    if (wavesurfer && isReady) {
      // Seeking on click is handled natively by the core when interact is on.
      const handlePlay = () => onPlay?.();
      const handlePause = () => onPause?.();

      if (onPlay) wavesurfer.on('play', handlePlay);
      if (onPause) wavesurfer.on('pause', handlePause);

      return () => {
        if (onPlay) wavesurfer.un('play', handlePlay);
        if (onPause) wavesurfer.un('pause', handlePause);
      };
    }
  }, [wavesurfer, isReady, onPlay, onPause]);
};