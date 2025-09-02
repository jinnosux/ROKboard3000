'use client';

import { useCallback } from 'react';

export const usePlayPauseHandler = (
  wavesurfer: any, 
  isReady: boolean, 
  isPlaying: boolean, 
  currentRegion: any, 
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