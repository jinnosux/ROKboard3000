'use client';

import { useState, useEffect, useRef } from 'react';
import { REGION_CONFIG } from '@/utils/wavesurferConfig';
import type { WaveSurferType, RegionsPluginType, Region } from '@/types/audio';

export const useWavesurferRegions = (
  wavesurfer: WaveSurferType | null, 
  isReady: boolean, 
  regionsEnabled: boolean,
  onRegionsCleared?: () => void
) => {
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const regionsPluginRef = useRef<RegionsPluginType | null>(null);
  const isCreatingRegionRef = useRef(false);

  useEffect(() => {
    if (wavesurfer && isReady) {
      const initRegions = async () => {
        try {
          const RegionsPlugin = (await import('wavesurfer.js/plugins/regions')).default;
          const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
          regionsPluginRef.current = regions;
          
          regions.enableDragSelection(REGION_CONFIG);

          regions.on('region-created', (region: Region) => {
            // Prevent infinite loop
            if (isCreatingRegionRef.current) return;
            
            // Clear previous regions if any exist
            const existingRegions = regions.getRegions();
            if (existingRegions.length > 1) {
              isCreatingRegionRef.current = true;
              existingRegions.forEach((existingRegion: Region) => {
                if (existingRegion.id !== region.id) {
                  existingRegion.remove();
                }
              });
              isCreatingRegionRef.current = false;
            }
            
            setCurrentRegion(region);
          });

          regions.on('region-clicked', (region: Region, e: MouseEvent) => {
            e.stopPropagation();
            setCurrentRegion(region);
          });

        } catch {
          // Failed to load regions plugin - silently handle
        }
      };
      
      if (regionsEnabled) {
        initRegions();
      } else {
        if (regionsPluginRef.current) {
          regionsPluginRef.current.clearRegions();
        }
        setCurrentRegion(null);
        onRegionsCleared?.();
      }
    }
  }, [wavesurfer, isReady, regionsEnabled, onRegionsCleared]);

  return { 
    currentRegion, 
    setCurrentRegion, 
    regionsPluginRef 
  };
};