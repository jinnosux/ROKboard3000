'use client';

import React, { useEffect, useState, useCallback } from 'react';
import SoundButton from '@/components/SoundButton';
import ControlBox from '@/components/ControlBox';
import MultiTrackPlayer from '@/components/MultiTrackPlayer';
import { AudioAnalysisProvider, useAudioAnalysis } from '@/contexts/AudioAnalysisContext';
import soundLibrary from '@/data/sounds.json';

const HomeContent = () => {
  const [columns, setColumns] = useState(4);
  const [serialMode, setSerialMode] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [tracks, setTracks] = useState<{
    id: string;
    name: string;
    artist: string;
    url: string;
  }[]>([]);
  
  const [masterVolume, setMasterVolume] = useState(0.7);

  const { togglePlayPauseAll, isActive: isAnyPlaying } = useAudioAnalysis();


  // Add spacebar event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPauseAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPauseAll]);

  const getGridCols = () => {
    switch(columns) {
      case 4: return 'grid-cols-4';
      case 6: return 'grid-cols-6'; 
      case 8: return 'grid-cols-8';
      case 10: return 'grid-cols-10';
      default: return 'grid-cols-4';
    }
  };

  const getControlSize = () => {
    return { width: '256px', height: '600px' }; // Desktop size - mobile will override with CSS
  };

  const handleTrackSelect = (soundConfig: typeof soundLibrary[0]) => {
    const newTrack = {
      id: soundConfig.id,
      name: soundConfig.name,
      artist: soundConfig.artist,
      url: soundConfig.url
    };
    
    if (serialMode) {
      // In serial mode, add to tracks (up to 4 tracks)
      setTracks(prev => {
        // Don't add if track already exists or if we have 4 tracks
        if (prev.some(track => track.id === soundConfig.id) || prev.length >= 4) {
          return prev;
        }
        return [...prev, newTrack];
      });
    } else {
      // In non-serial mode, replace with single track
      setTracks([newTrack]);
    }
  };


  const handleSerialModeChange = useCallback((newSerialMode: boolean) => {
    setSerialMode(newSerialMode);
    
    // Clear all tracks when switching modes
    setTracks([]);
  }, []);

  const handleRemoveTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
  }, []);

  const handleStopAll = useCallback(() => {
    // Use the existing togglePlayPauseAll to stop all wavesurfer instances
    if (isAnyPlaying) {
      togglePlayPauseAll();
    }
  }, [isAnyPlaying, togglePlayPauseAll]);

  return (
    <div className="min-h-screen bg-black text-white font-inter p-6 pb-24 md:pb-12">
      <div className="w-full">
        {/* Mobile: Stack vertically, Desktop: Side by side */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Control Box */}
          <div 
            className="w-full md:w-auto md:flex-shrink-0" 
            style={{ 
              width: 'auto',
              height: 'auto'
            }}
          >
            <div 
              className="w-full md:w-[256px]"
            >
              <ControlBox
                masterVolume={masterVolume}
                onVolumeChange={setMasterVolume}
                columns={columns}
                onColumnsChange={setColumns}
                onStopAll={handleStopAll}
                isAnyPlaying={isAnyPlaying}
                serialMode={serialMode}
                onSerialModeChange={handleSerialModeChange}
                autoplay={autoplay}
                onAutoplayChange={setAutoplay}
              />
            </div>
          </div>
          
          {/* Sound Buttons Grid */}
          <div className={`grid ${getGridCols()} gap-4 flex-1 auto-rows-min`}>
            {soundLibrary.map(soundConfig => {
              const isInTracks = tracks.some(track => track.id === soundConfig.id);
              
              return (
                <div key={soundConfig.id} className="aspect-square relative min-h-0">
                  <SoundButton
                    sound={{
                      id: soundConfig.id,
                      name: soundConfig.name,
                      url: soundConfig.url,
                      buffer: null,
                      isLoading: false,
                      isPlaying: false,
                    }}
                    onPlay={() => handleTrackSelect(soundConfig)}
                    onStop={() => {}}
                    disabled={serialMode && tracks.length >= 4 && !isInTracks}
                    imageSrc={soundConfig.imageSrc}
                    isCompact={columns >= 8}
                    onTrackSelect={() => handleTrackSelect(soundConfig)}
                  />
                  {isInTracks && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Unified Player Footer */}
      <MultiTrackPlayer
        serialMode={serialMode}
        tracks={tracks}
        onRemoveTrack={handleRemoveTrack}
        autoplay={autoplay}
      />
    </div>
  );
};

export default function Home() {
  return (
    <AudioAnalysisProvider>
      <HomeContent />
    </AudioAnalysisProvider>
  );
}
