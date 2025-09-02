'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface WavesurferInstance {
  id: string;
  wavesurfer: any;
  isPlaying: boolean;
  markUserInteraction?: () => void;
}

export const useGlobalAudioAnalysis = () => {
  const [level, setLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const wavesurferInstances = useRef<Map<string, WavesurferInstance>>(new Map());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const setupAnalyserForWavesurfer = useCallback((wavesurfer: any) => {
    if (!wavesurfer) return;
    
    try {
      // Mark that we have a "working" analyser for waveform data access
      analyserRef.current = { type: 'wavesurfer-waveform' } as any;
    } catch (error) {
      console.warn('Could not setup VU meter:', error);
    }
  }, []);

  const registerWavesurfer = useCallback((id: string, wavesurfer: any, isPlaying: boolean, markUserInteraction?: () => void) => {
    wavesurferInstances.current.set(id, { id, wavesurfer, isPlaying, markUserInteraction });
    
    // Update global active state
    const hasActive = Array.from(wavesurferInstances.current.values()).some(instance => instance.isPlaying);
    setIsActive(hasActive);

    // Setup analyser if we have an active wavesurfer and don't have one yet
    if (isPlaying && wavesurfer && !analyserRef.current) {
      setupAnalyserForWavesurfer(wavesurfer);
    }
  }, [setupAnalyserForWavesurfer]);

  const unregisterWavesurfer = useCallback((id: string) => {
    wavesurferInstances.current.delete(id);
    
    // Update global active state
    const hasActive = Array.from(wavesurferInstances.current.values()).some(instance => instance.isPlaying);
    setIsActive(hasActive);
    
    // Clean up analyser if no active instances
    if (!hasActive) {
      setLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, []);

  const updatePlayingState = useCallback((id: string, isPlaying: boolean) => {
    const instance = wavesurferInstances.current.get(id);
    if (instance) {
      instance.isPlaying = isPlaying;
      
      // Update global active state
      const hasActive = Array.from(wavesurferInstances.current.values()).some(inst => inst.isPlaying);
      setIsActive(hasActive);
      
      // Try to setup analyser when something starts playing
      if (isPlaying && !analyserRef.current) {
        setupAnalyserForWavesurfer(instance.wavesurfer);
      }
    }
  }, [setupAnalyserForWavesurfer]);

  useEffect(() => {
    if (!isActive || !analyserRef.current) {
      setLevel(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const updateLevel = () => {
      if (!isActive) {
        setLevel(0);
        return;
      }

      // Get the currently playing wavesurfer instance
      const activeInstances = Array.from(wavesurferInstances.current.values()).filter(inst => inst.isPlaying);
      
      if (activeInstances.length === 0) {
        setLevel(0);
        if (isActive) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
        return;
      }

      // Use the first active instance (we can enhance this later for multiple instances)
      const activeWavesurfer = activeInstances[0].wavesurfer;
      
      try {
        // Get current playback position and duration
        const currentTime = activeWavesurfer.getCurrentTime ? activeWavesurfer.getCurrentTime() : 0;
        const duration = activeWavesurfer.getDuration ? activeWavesurfer.getDuration() : 1;
        
        // Try to get the actual waveform data from wavesurfer
        let waveformLevel = 0;
        
        // Try to get real waveform data from wavesurfer
        let foundData = false;
        
        // Check multiple possible sources for waveform/audio data
        const possibleDataSources = [
          activeWavesurfer.backend?.peaks,
          activeWavesurfer.backend?.buffer,
          activeWavesurfer.decodedData,
          activeWavesurfer.peaks,
          activeWavesurfer.renderer?.peaks,
          activeWavesurfer.renderer?.decodedData,
          activeWavesurfer.audioBuffer,
          activeWavesurfer.buffer
        ];
        
        for (const dataSource of possibleDataSources) {
          if (dataSource && (Array.isArray(dataSource) || dataSource.getChannelData)) {
            try {
              let peaks = null;
              
              if (Array.isArray(dataSource)) {
                peaks = dataSource;
              } else if (dataSource.getChannelData) {
                peaks = dataSource.getChannelData(0); // Get first channel
              }
              
              if (peaks) {
                const progress = currentTime / duration;
                const peakIndex = Math.floor(progress * peaks.length);
                
                if (peakIndex >= 0 && peakIndex < peaks.length && peaks[peakIndex] !== undefined) {
                  const rawValue = peaks[peakIndex];
                  waveformLevel = Math.abs(rawValue);
                  
                  // Apply scaling to make movement more visible
                  // Most audio samples are quite small (0.0 to 1.0), so amplify for better VU response
                  waveformLevel = Math.min(waveformLevel * 3, 1.0);
                  
                  foundData = true;
                  break;
                }
              }
            } catch (error) {
              // Silently continue to next data source
            }
          }
        }
        
        // If no real data found, show silence
        if (!foundData) {
          waveformLevel = 0;
        }
        
        // Apply smoothing with better range handling
        let smoothedLevel = waveformLevel;
        
        // For very small values (silence), allow true zero
        if (waveformLevel < 0.01) {
          smoothedLevel = 0; // True silence = no bars at all
        } else if (waveformLevel < 0.05) {
          smoothedLevel = waveformLevel; // Very quiet audio shows minimal activity
        } else {
          // For active audio, ensure good visibility  
          smoothedLevel = Math.max(0.08, Math.min(0.95, waveformLevel));
        }
        
        setLevel(smoothedLevel);
        
      } catch (error) {
        console.warn('Error getting wavesurfer waveform data:', error);
        // Fallback to simple time-based pattern
        const fallbackLevel = Math.max(0.1, Math.min(0.8, Math.abs(Math.sin(Date.now() * 0.005)) * 0.6 + 0.2));
        setLevel(fallbackLevel);
      }
      
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };

    updateLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive]);

  const togglePlayPauseAll = useCallback(() => {
    const instances = Array.from(wavesurferInstances.current.values());
    const playingInstances = instances.filter(inst => inst.isPlaying);
    
    // Mark all instances as having user interaction
    instances.forEach(instance => {
      if (instance.markUserInteraction) {
        instance.markUserInteraction();
      }
    });
    
    if (playingInstances.length > 0) {
      // If any are playing, pause all playing ones
      playingInstances.forEach(instance => {
        if (instance.wavesurfer && instance.wavesurfer.pause) {
          instance.wavesurfer.pause();
        }
      });
    } else {
      // If none are playing, play all that were previously paused
      instances.forEach(instance => {
        if (instance.wavesurfer && instance.wavesurfer.play) {
          instance.wavesurfer.play();
        }
      });
    }
  }, []);

  return {
    level,
    isActive,
    registerWavesurfer,
    unregisterWavesurfer,
    updatePlayingState,
    togglePlayPauseAll,
  };
};