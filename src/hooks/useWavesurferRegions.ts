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
  const [isLooping, setIsLooping] = useState(false);
  const regionsPluginRef = useRef<RegionsPluginType | null>(null);
  const isCreatingRegionRef = useRef(false);
  const loopingRegionRef = useRef<Region | null>(null);
  const loopCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const disableDragSelectionRef = useRef<(() => void) | null>(null);

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

  // Effect to handle loop monitoring
  useEffect(() => {
    if (isLooping && wavesurfer && loopingRegionRef.current) {
      const region = loopingRegionRef.current;
      
      const checkLoop = () => {
        if (!isLooping || !wavesurfer.isPlaying()) {
          return;
        }
        
        const currentTime = wavesurfer.getCurrentTime();
        if (currentTime >= region.end) {
          // Restart from beginning of region
          wavesurfer.setTime(region.start);
        }
      };
      
      // Check every 50ms
      loopCheckIntervalRef.current = setInterval(checkLoop, 50);
      
      return () => {
        if (loopCheckIntervalRef.current) {
          clearInterval(loopCheckIntervalRef.current);
          loopCheckIntervalRef.current = null;
        }
      };
    }
  }, [isLooping, wavesurfer]);

  const startLoop = (region: Region) => {
    loopingRegionRef.current = region;
    setIsLooping(true);
  };

  const stopLoop = () => {
    setIsLooping(false);
    loopingRegionRef.current = null;
    if (loopCheckIntervalRef.current) {
      clearInterval(loopCheckIntervalRef.current);
      loopCheckIntervalRef.current = null;
    }
  };

  return { 
    currentRegion, 
    setCurrentRegion, 
    regionsPluginRef,
    isLooping,
    startLoop,
    stopLoop
  };
};