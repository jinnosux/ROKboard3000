'use client';

import { useState, useEffect, useRef } from 'react';
import { REGION_CONFIG } from '@/utils/wavesurferConfig';

export const useWavesurferRegions = (
  wavesurfer: any, 
  isReady: boolean, 
  regionsEnabled: boolean,
  onRegionsCleared?: () => void
) => {
  const [currentRegion, setCurrentRegion] = useState<any>(null);
  const regionsPluginRef = useRef<any>(null);
  const isCreatingRegionRef = useRef(false);

  useEffect(() => {
    if (wavesurfer && isReady) {
      const initRegions = async () => {
        try {
          const RegionsPlugin = (await import('wavesurfer.js/plugins/regions')).default;
          const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
          regionsPluginRef.current = regions;
          
          regions.enableDragSelection(REGION_CONFIG);

          regions.on('region-created', (region: any) => {
            // Prevent infinite loop
            if (isCreatingRegionRef.current) return;
            
            // Clear previous regions if any exist
            const existingRegions = regions.getRegions();
            if (existingRegions.length > 1) {
              isCreatingRegionRef.current = true;
              existingRegions.forEach((existingRegion: any) => {
                if (existingRegion.id !== region.id) {
                  existingRegion.remove();
                }
              });
              isCreatingRegionRef.current = false;
            }
            
            setCurrentRegion(region);
          });

          regions.on('region-clicked', (region: any, e: any) => {
            e.stopPropagation();
            setCurrentRegion(region);
          });

        } catch (error) {
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
  }, [wavesurfer, isReady, regionsEnabled]);

  return { 
    currentRegion, 
    setCurrentRegion, 
    regionsPluginRef 
  };
};