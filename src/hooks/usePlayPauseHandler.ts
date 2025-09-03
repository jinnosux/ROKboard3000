'use client';

import { useCallback } from 'react';
import type { WaveSurferType, Region } from '@/types/audio';

export const usePlayPauseHandler = (
  wavesurfer: WaveSurferType | null, 
  isReady: boolean, 
  isPlaying: boolean, 
  currentRegion: Region | null, 
  regionsEnabled: boolean,
  onPlayRegion: () => void
) => {
  return useCallback(() => {
    if (!wavesurfer || !isReady) return;

    if (currentRegion && regionsEnabled) {
      if (isPlaying) {
        wavesurfer.pause();
      } else {
        onPlayRegion();
      }
    } else {
      if (isPlaying) {
        wavesurfer.pause();
      } else {
        wavesurfer.play();
      }
    }
  }, [wavesurfer, isReady, isPlaying, currentRegion, regionsEnabled, onPlayRegion]);
};