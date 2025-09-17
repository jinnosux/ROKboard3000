'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { WaveSurferType } from '@/types/audio';

interface WavesurferInstanceData {
  id: string;
  wavesurfer: WaveSurferType;
  isPlaying: boolean;
  markUserInteraction?: () => void;
}

export const useGlobalAudioAnalysis = () => {
  const [level, setLevel] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const wavesurferInstances = useRef<Map<string, WavesurferInstanceData>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const simpleAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);


  const registerWavesurfer = useCallback((id: string, wavesurfer: WaveSurferType, isPlaying: boolean, markUserInteraction?: () => void) => {
    wavesurferInstances.current.set(id, { id, wavesurfer, isPlaying, markUserInteraction });

    // Update global active state
    const hasActive = Array.from(wavesurferInstances.current.values()).some(instance => instance.isPlaying) ||
                     (simpleAudioRef.current && !simpleAudioRef.current.paused);
    setIsActive(hasActive);

  }, []);

  const unregisterWavesurfer = useCallback((id: string) => {
    wavesurferInstances.current.delete(id);

    // Update global active state
    const hasActive = Array.from(wavesurferInstances.current.values()).some(instance => instance.isPlaying) ||
                     (simpleAudioRef.current && !simpleAudioRef.current.paused);
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
      const hasActive = Array.from(wavesurferInstances.current.values()).some(inst => inst.isPlaying) ||
                       (simpleAudioRef.current && !simpleAudioRef.current.paused);
      setIsActive(hasActive);

    }
  }, []);

  const registerSimpleAudio = useCallback((audio: HTMLAudioElement) => {
    simpleAudioRef.current = audio;

    // Add event listeners to track simple audio state
    const updateSimpleAudioState = () => {
      const hasActive = Array.from(wavesurferInstances.current.values()).some(instance => instance.isPlaying) ||
                       (simpleAudioRef.current && !simpleAudioRef.current.paused);
      setIsActive(hasActive);
    };

    audio.addEventListener('play', updateSimpleAudioState);
    audio.addEventListener('pause', updateSimpleAudioState);
    audio.addEventListener('ended', updateSimpleAudioState);

    // Try to set up Web Audio API for analysis (but don't break if it fails)
    const setupWebAudio = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;

          sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
      } catch (error) {
        console.warn('Could not set up Web Audio API for VU meter:', error);
        // Clear refs if setup failed
        audioContextRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;
      }
    };

    // Try setup on first user interaction
    const setupOnInteraction = () => {
      setupWebAudio();
      audio.removeEventListener('play', setupOnInteraction);
    };
    audio.addEventListener('play', setupOnInteraction);

    // Return cleanup function
    return () => {
      audio.removeEventListener('play', updateSimpleAudioState);
      audio.removeEventListener('pause', updateSimpleAudioState);
      audio.removeEventListener('ended', updateSimpleAudioState);
      audio.removeEventListener('play', setupOnInteraction);
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
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

      // Check if simple audio is playing
      const isSimpleAudioPlaying = simpleAudioRef.current && !simpleAudioRef.current.paused;

      // Get the currently playing wavesurfer instance
      const activeInstances = Array.from(wavesurferInstances.current.values()).filter(inst => inst.isPlaying);

      if (activeInstances.length === 0 && !isSimpleAudioPlaying) {
        setLevel(0);
        if (isActive) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
        return;
      }

      // Prioritize simple audio if it's playing
      if (isSimpleAudioPlaying) {
        if (analyserRef.current) {
          try {
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate RMS (Root Mean Square) for better VU response
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += (dataArray[i] / 255) * (dataArray[i] / 255);
            }
            const rms = Math.sqrt(sum / bufferLength);

            // Apply scaling and smoothing - balanced approach
            let scaledLevel = Math.min(rms * 2, 1.0);

            if (scaledLevel < 0.01) {
              scaledLevel = 0;
            } else if (scaledLevel < 0.03) {
              scaledLevel = scaledLevel * 0.8; // Slightly reduce very quiet audio
            } else {
              scaledLevel = Math.max(0.06, scaledLevel); // No artificial cap - show real values
            }

            setLevel(scaledLevel);

            if (isActive) {
              animationFrameRef.current = requestAnimationFrame(updateLevel);
            }
            return;
          } catch (error) {
            console.warn('Error analyzing simple audio:', error);
          }
        }

        // Fallback: Simple animated pattern when Web Audio API is not available
        const fallbackLevel = Math.max(0.2, Math.min(0.7, Math.abs(Math.sin(Date.now() * 0.01)) * 0.5 + 0.3));
        setLevel(fallbackLevel);

        if (isActive) {
          animationFrameRef.current = requestAnimationFrame(updateLevel);
        }
        return;
      }

      // Fall back to wavesurfer analysis
      if (activeInstances.length > 0) {
        const activeWavesurfer = activeInstances[0].wavesurfer;

        try {
          // Get current playback position and duration
          const currentTime = activeWavesurfer.getCurrentTime ? activeWavesurfer.getCurrentTime() : 0;
        const duration = activeWavesurfer.getDuration ? activeWavesurfer.getDuration() : 1;
        
        // Try to get the actual waveform data from wavesurfer
        let waveformLevel = 0;
        
        // Try to get real waveform data from wavesurfer
        let foundData = false;
        
        // Get decoded audio data using WaveSurfer v7 API
        try {
          const audioBuffer = activeWavesurfer.getDecodedData();
          if (audioBuffer) {
            const channelData = audioBuffer.getChannelData(0); // Get first channel
            const progress = currentTime / duration;
            const sampleIndex = Math.floor(progress * channelData.length);
            
            if (sampleIndex >= 0 && sampleIndex < channelData.length) {
              const rawValue = channelData[sampleIndex];
              waveformLevel = Math.abs(rawValue);
              
              // Apply scaling to make movement more visible
              // Most audio samples are quite small (0.0 to 1.0), so amplify for better VU response
              waveformLevel = Math.min(waveformLevel * 3, 1.0);
              
              foundData = true;
            }
          }
        } catch {
          // Silently handle any errors getting decoded data
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
    registerSimpleAudio,
  };
};