import type { Region, WaveSurferType } from '@/types/audio';

export const createRegionPlayback = (
  currentRegion: Region | null, 
  loopEnabled: boolean,
  wavesurfer?: WaveSurferType | null
): void => {
  if (!currentRegion || !wavesurfer) return;

  if (loopEnabled) {
    // For looping, set time to start of region and play normally
    // We'll handle the looping logic separately with time monitoring
    wavesurfer.setTime(currentRegion.start);
    wavesurfer.play();
  } else {
    // For single play, use region's built-in method if it works reliably
    try {
      currentRegion.play(true);
    } catch {
      // Fallback to manual approach
      wavesurfer.setTime(currentRegion.start);
      wavesurfer.play();
    }
  }
};