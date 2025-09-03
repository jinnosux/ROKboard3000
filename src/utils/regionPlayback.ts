import type { WaveSurferType, Region } from '@/types/audio';

export const createRegionPlayback = (
  wavesurfer: WaveSurferType | null, 
  currentRegion: Region | null, 
  loopEnabled: boolean
): void => {
  if (!currentRegion || !wavesurfer) return;

  wavesurfer.setTime(currentRegion.start);
  wavesurfer.play();
  
  if (loopEnabled) {
    const checkLoop = () => {
      if (wavesurfer.getCurrentTime() >= currentRegion.end) {
        wavesurfer.setTime(currentRegion.start);
      }
      if (wavesurfer.isPlaying() && loopEnabled) {
        requestAnimationFrame(checkLoop);
      }
    };
    requestAnimationFrame(checkLoop);
  } else {
    const checkEnd = () => {
      if (wavesurfer.getCurrentTime() >= currentRegion.end) {
        wavesurfer.pause();
      } else if (wavesurfer.isPlaying()) {
        requestAnimationFrame(checkEnd);
      }
    };
    requestAnimationFrame(checkEnd);
  }
};