'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface SoundBuffer {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
}

export interface Sound {
  id: string;
  name: string;
  url: string;
  buffer: SoundBuffer | null;
  isLoading: boolean;
  isPlaying: boolean;
  duration?: number;
  startTime?: number;
  progress?: number;
}

export const useAudio = (serialMode: boolean = false) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sounds, setSounds] = useState<Record<string, Sound>>({});
  const gainNodeRef = useRef<GainNode | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const progressIntervalRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const initAudioContext = async () => {
      if (typeof window !== 'undefined') {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
        
        // Create master gain node
        const gainNode = context.createGain();
        gainNode.connect(context.destination);
        gainNodeRef.current = gainNode;
        gainNode.gain.value = masterVolume;
      }
    };

    initAudioContext();

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = masterVolume;
    }
  }, [masterVolume]);

  const loadSound = useCallback(async (id: string, name: string, url: string) => {
    if (!audioContext) return;

    setSounds(prev => ({
      ...prev,
      [id]: {
        id,
        name,
        url,
        buffer: null,
        isLoading: true,
        isPlaying: false,
      }
    }));

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('Empty or invalid audio file');
      }
      
      const buffer = await audioContext.decodeAudioData(arrayBuffer);
      if (!buffer) {
        throw new Error('Failed to decode audio data');
      }

      setSounds(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          buffer: { buffer, source: null },
          isLoading: false,
          duration: buffer.duration,
        }
      }));
    } catch (error) {
      // Failed to load sound - silently handle
      setSounds(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isLoading: false,
          buffer: null,
        }
      }));
    }
  }, [audioContext]);

  const playSound = useCallback((id: string) => {
    if (!audioContext || !gainNodeRef.current) return;
    
    const sound = sounds[id];
    if (!sound || !sound.buffer || !sound.buffer.buffer || sound.isLoading) {
      // Cannot play sound - silently handle
      return;
    }

    // Resume audio context if suspended (required for user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // In serial mode (disabled), stop all other sounds before playing new one
    if (!serialMode) {
      Object.keys(sounds).forEach(soundId => {
        const otherSound = sounds[soundId];
        if (soundId !== id && otherSound?.buffer?.source && otherSound.isPlaying) {
          otherSound.buffer.source.stop();
        }
      });
    }

    // Stop current playback if already playing
    if (sound.buffer.source) {
      sound.buffer.source.stop();
    }

    // Create new buffer source
    const source = audioContext.createBufferSource();
    source.buffer = sound.buffer.buffer;
    source.connect(gainNodeRef.current);

    const startTime = audioContext.currentTime;
    
    // Update sound state
    setSounds(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        buffer: { ...prev[id].buffer!, source },
        isPlaying: true,
        startTime,
        progress: 0,
      }
    }));

    // Start progress tracking
    const duration = sound.duration || 0;
    progressIntervalRef.current[id] = setInterval(() => {
      const elapsed = audioContext.currentTime - startTime;
      const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;
      
      setSounds(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          progress,
        }
      }));
      
      if (progress >= 1) {
        clearInterval(progressIntervalRef.current[id]);
      }
    }, 50); // Update every 50ms for smooth animation

    // Handle playback end
    source.onended = () => {
      try {
        if (progressIntervalRef.current[id]) {
          clearInterval(progressIntervalRef.current[id]);
          delete progressIntervalRef.current[id];
        }
        setSounds(prev => ({
          ...prev,
          [id]: {
            ...prev[id],
            isPlaying: false,
            progress: 0,
          }
        }));
      } catch (error) {
        // Error in onended handler - silently handle
      }
    };

    source.start();
  }, [audioContext, sounds, serialMode]);

  const stopSound = useCallback((id: string) => {
    const sound = sounds[id];
    if (!sound) {
      // Cannot stop sound - silently handle
      return;
    }
    
    if (sound.buffer?.source && sound.isPlaying) {
      try {
        sound.buffer.source.stop();
      } catch (error) {
        // Error stopping sound - silently handle
      }
      
      if (progressIntervalRef.current[id]) {
        clearInterval(progressIntervalRef.current[id]);
        delete progressIntervalRef.current[id];
      }
      
      setSounds(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isPlaying: false,
          progress: 0,
        }
      }));
    }
  }, [sounds]);

  const stopAllSounds = useCallback(() => {
    Object.keys(sounds).forEach(id => {
      stopSound(id);
    });
  }, [sounds, stopSound]);

  return {
    sounds,
    loadSound,
    playSound,
    stopSound,
    stopAllSounds,
    masterVolume,
    setMasterVolume,
    isReady: !!audioContext,
  };
};