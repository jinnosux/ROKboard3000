'use client';

import { useEffect } from 'react';

export const useWavesurferEvents = (
  wavesurfer: any,
  isReady: boolean,
  regionsEnabled: boolean,
  onPlay?: () => void,
  onPause?: () => void
) => {
  useEffect(() => {
    if (wavesurfer && isReady) {
      const handleInteraction = (relativeX: number) => {
        if (!regionsEnabled) {
          const duration = wavesurfer.getDuration();
          const seekTime = relativeX * duration;
          wavesurfer.setTime(seekTime);
        }
      };

      const handlePlay = () => onPlay?.();
      const handlePause = () => onPause?.();

      wavesurfer.on('click', handleInteraction);
      if (onPlay) wavesurfer.on('play', handlePlay);
      if (onPause) wavesurfer.on('pause', handlePause);

      return () => {
        wavesurfer.un('click', handleInteraction);
        if (onPlay) wavesurfer.un('play', handlePlay);
        if (onPause) wavesurfer.un('pause', handlePause);
      };
    }
  }, [wavesurfer, isReady, regionsEnabled, onPlay, onPause]);
};