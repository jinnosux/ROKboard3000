'use client';

import React, { createContext, useContext } from 'react';
import { useGlobalAudioAnalysis } from '@/hooks/useGlobalAudioAnalysis';

interface AudioAnalysisContextType {
  level: number;
  isActive: boolean;
  registerWavesurfer: (id: string, wavesurfer: any, isPlaying: boolean, markUserInteraction?: () => void) => void;
  unregisterWavesurfer: (id: string) => void;
  updatePlayingState: (id: string, isPlaying: boolean) => void;
  togglePlayPauseAll: () => void;
}

const AudioAnalysisContext = createContext<AudioAnalysisContextType | null>(null);

export const AudioAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioAnalysis = useGlobalAudioAnalysis();

  return (
    <AudioAnalysisContext.Provider value={audioAnalysis}>
      {children}
    </AudioAnalysisContext.Provider>
  );
};

export const useAudioAnalysis = () => {
  const context = useContext(AudioAnalysisContext);
  if (!context) {
    throw new Error('useAudioAnalysis must be used within AudioAnalysisProvider');
  }
  return context;
};