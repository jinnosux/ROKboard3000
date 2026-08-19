'use client';

import { useState, useEffect, useRef } from 'react';
import { REGION_CONFIG } from '@/utils/wavesurferConfig';
import type { WaveSurferType, RegionsPluginType, Region } from '@/types/audio';

export const useWavesurferRegions = (
  wavesurfer: WaveSurferType | null,
  isReady: boolean,
  regionsEnabled: boolean,
  loopEnabled: boolean,
  onRegionsCleared?: () => void
) => {
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const regionsPluginRef = useRef<RegionsPluginType | null>(null);
  const isCreatingRegionRef = useRef(false);
  const disableDragSelectionRef = useRef<(() => void) | null>(null);
  // The region-out handler is registered once with the plugin, so it reads the
  // current loop state through a ref rather than closing over a stale value.
  const loopEnabledRef = useRef(loopEnabled);

  useEffect(() => {
    loopEnabledRef.current = loopEnabled;
  }, [loopEnabled]);

  useEffect(() => {
    if (wavesurfer && isReady) {
      const initRegions = async () => {
        try {
          // Only create plugin if it doesn't exist
          if (!regionsPluginRef.current) {
            const RegionsPlugin = (await import('wavesurfer.js/plugins/regions')).default;
            const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
            regionsPluginRef.current = regions;

            regions.on('region-created', (region: Region) => {
              // Prevent infinite loop
              if (isCreatingRegionRef.current) return;

              // Mark that we're creating a region to prevent race conditions
              isCreatingRegionRef.current = true;

              // Always clear ALL existing regions except the new one
              const existingRegions = regions.getRegions();
              existingRegions.forEach((existingRegion: Region) => {
                if (existingRegion.id !== region.id) {
                  try {
                    existingRegion.remove();
                  } catch {
                    // Ignore errors if region already removed
                  }
                }
              });

              // Reset the flag and set current region
              isCreatingRegionRef.current = false;
              setCurrentRegion(region);
            });

            regions.on('region-clicked', (region: Region, e: MouseEvent) => {
              e.stopPropagation();
              setCurrentRegion(region);
            });

            // Playback left the region: restart it if we're looping. The plugin
            // only emits this for regions it still tracks, so a region that was
            // replaced by a new selection stops looping on its own.
            regions.on('region-out', (region: Region) => {
              if (loopEnabledRef.current) {
                region.play(true);
              }
            });
          }

          // Disable any existing drag selection first
          if (disableDragSelectionRef.current) {
            disableDragSelectionRef.current();
          }

          // Enable drag selection and store the disable function
          disableDragSelectionRef.current = regionsPluginRef.current.enableDragSelection(REGION_CONFIG);


        } catch {
          // Failed to load regions plugin - silently handle
        }
      };

      if (regionsEnabled) {
        initRegions();
      } else {
        // Disable drag selection
        if (disableDragSelectionRef.current) {
          disableDragSelectionRef.current();
          disableDragSelectionRef.current = null;
        }

        // Clear regions
        if (regionsPluginRef.current) {
          regionsPluginRef.current.clearRegions();
        }

        setCurrentRegion(null);
        onRegionsCleared?.();
      }
    }

    // Cleanup function
    return () => {
      if (disableDragSelectionRef.current) {
        disableDragSelectionRef.current();
        disableDragSelectionRef.current = null;
      }
    };
  }, [wavesurfer, isReady, regionsEnabled, onRegionsCleared]);

  return {
    currentRegion,
    setCurrentRegion,
    regionsPluginRef
  };
};
