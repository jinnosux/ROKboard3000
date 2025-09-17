'use client';

import React, { useEffect, useState, useCallback } from 'react';
import SoundButton from '@/components/SoundButton';
import ControlBox from '@/components/ControlBox';
import MultiTrackPlayer from '@/components/MultiTrackPlayer';
import { AudioAnalysisProvider, useAudioAnalysis } from '@/contexts/AudioAnalysisContext';
import soundLibrary from '@/data/sounds.json';

const HomeContent = () => {
  const [columns, setColumns] = useState(4);
  const [autoplay, setAutoplay] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [tracks, setTracks] = useState<{
    id: string;
    name: string;
    artist: string;
    url: string;
  }[]>([]);
  const [simplePlayingId, setSimplePlayingId] = useState<string | null>(null);
  const [simpleAudio, setSimpleAudio] = useState<HTMLAudioElement | null>(null);
  const [simpleDuration, setSimpleDuration] = useState(0);

  const [masterVolume, setMasterVolume] = useState(0.8);

  const { togglePlayPauseAll, isActive: isAnyPlaying } = useAudioAnalysis();

  // Initialize audio element on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSimpleAudio(new Audio());
    }
  }, []);

  // Simple audio playback handler
  const handleSimplePlay = (soundId: string, soundUrl: string) => {
    if (!simpleAudio) return;

    if (simplePlayingId === soundId) {
      // Stop current sound
      simpleAudio.pause();
      simpleAudio.currentTime = 0;
      setSimplePlayingId(null);
    } else {
      // Play new sound
      simpleAudio.src = soundUrl;
      simpleAudio.volume = masterVolume;
      simpleAudio.currentTime = 0;
      simpleAudio.play();
      setSimplePlayingId(soundId);
    }
  };

  // Setup audio event listeners for duration and end tracking
  useEffect(() => {
    if (!simpleAudio) return;

    const handleLoadedMetadata = () => {
      setSimpleDuration(simpleAudio.duration || 0);
    };

    const handleEnded = () => {
      setSimplePlayingId(null);
      setSimpleDuration(0);
    };

    simpleAudio.addEventListener('loadedmetadata', handleLoadedMetadata);
    simpleAudio.addEventListener('ended', handleEnded);

    return () => {
      simpleAudio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      simpleAudio.removeEventListener('ended', handleEnded);
    };
  }, [simpleAudio]);

  // Update volume when masterVolume changes
  useEffect(() => {
    if (simpleAudio) {
      simpleAudio.volume = masterVolume;
    }
  }, [simpleAudio, masterVolume]);

  // Stop all audio when switching between advanced/simple modes
  useEffect(() => {
    // Stop simple mode audio
    if (simpleAudio) {
      simpleAudio.pause();
      simpleAudio.currentTime = 0;
      setSimplePlayingId(null);
    }

    // Stop advanced mode audio (multitrack/wavesurfer)
    if (isAnyPlaying) {
      togglePlayPauseAll();
    }
  }, [advanced]); // Trigger when advanced mode changes

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


  const handleTrackSelect = (soundConfig: typeof soundLibrary[0]) => {
    const newTrack = {
      id: soundConfig.id,
      name: soundConfig.name,
      artist: soundConfig.artist,
      url: soundConfig.url
    };
    
    // Always in multi-track mode - add to tracks (up to 4 tracks)
    setTracks(prev => {
      // Don't add if track already exists or if we have 4 tracks
      if (prev.some(track => track.id === soundConfig.id) || prev.length >= 4) {
        return prev;
      }
      return [...prev, newTrack];
    });
  };


  // Removed handleSerialModeChange - always in multi-track mode

  const handleRemoveTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId));
  }, []);

  const handleStopAll = useCallback(() => {
    // Stop simple mode audio
    if (simpleAudio && simplePlayingId) {
      simpleAudio.pause();
      simpleAudio.currentTime = 0;
      setSimplePlayingId(null);
    }

    // Use the existing togglePlayPauseAll to stop all wavesurfer instances
    if (isAnyPlaying) {
      togglePlayPauseAll();
    }
  }, [isAnyPlaying, togglePlayPauseAll, simpleAudio, simplePlayingId]);

  return (
    <div className="min-h-screen bg-black text-white font-inter p-6 pb-24 md:pb-12 px-0 pt-0 md:px-6 md:pt-6">
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
                isAnyPlaying={isAnyPlaying || !!simplePlayingId}
                autoplay={autoplay}
                onAutoplayChange={setAutoplay}
                advanced={advanced}
                onAdvancedChange={setAdvanced}
              />
            </div>
          </div>
          
          {/* Sound Buttons Grid */}
          <div className={`grid ${getGridCols()} gap-2 md:gap-4 flex-1 auto-rows-min px-2 md:px-0`}>
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
                    disabled={advanced && tracks.length >= 4 && !isInTracks}
                    imageSrc={soundConfig.imageSrc}
                    isCompact={columns >= 8}
                    onTrackSelect={() => handleTrackSelect(soundConfig)}
                    category={soundConfig.category}
                    showCategory={columns === 4 || columns === 6}
                    isAdvancedMode={advanced}
                    masterVolume={masterVolume}
                    simplePlayingId={simplePlayingId}
                    onSimplePlay={handleSimplePlay}
                    simpleDuration={simpleDuration}
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
      
      {/* Unified Player Footer - only show in advanced mode */}
      {advanced && (
        <MultiTrackPlayer
          tracks={tracks}
          onRemoveTrack={handleRemoveTrack}
          autoplay={autoplay}
        />
      )}
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
