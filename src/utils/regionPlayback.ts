import type { Region, WaveSurferType } from '@/types/audio';

export const createRegionPlayback = (
  currentRegion: Region | null,
  wavesurfer?: WaveSurferType | null
): void => {
  if (!currentRegion || !wavesurfer) return;

  // region.play(true) resolves to wavesurfer.play(region.start, region.end).
  // The core enforces the end bound itself on its 16ms timer, so there is no
  // need to seek and poll manually.
  currentRegion.play(true);
};
