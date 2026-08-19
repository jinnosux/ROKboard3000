'use client';

import React, { useEffect, useState, useCallback } from 'react';
import SoundButton from '@/components/SoundButton';
import ControlBox from '@/components/ControlBox';
import MultiTrackPlayer from '@/components/MultiTrackPlayer';
import { AudioAnalysisProvider, useAudioAnalysis } from '@/contexts/AudioAnalysisContext';
import { sections, type ResolvedSound } from '@/data/soundLibrary';

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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [simplePlayingId, setSimplePlayingId] = useState<string | null>(null);
  const [simpleAudio, setSimpleAudio] = useState<HTMLAudioElement | null>(null);
  const [simpleDuration, setSimpleDuration] = useState(0);

  const [masterVolume, setMasterVolume] = useState(0.8);

  const { togglePlayPauseAll, isActive: isAnyPlaying, registerSimpleAudio } = useAudioAnalysis();

  // Initialize audio element on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      setSimpleAudio(audio);
      registerSimpleAudio(audio);
    }
  }, [registerSimpleAudio]);

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


  const handleTrackSelect = (soundConfig: ResolvedSound) => {
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

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

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
          {/* Control Box - sticks alongside the grid on desktop, normal flow on mobile.
              self-start is required: a stretched flex item spans the whole scroll
              range and so has nowhere to stick to. */}
          <div
            className="w-full md:w-auto md:flex-shrink-0 md:sticky md:top-6 md:self-start md:max-h-[calc(100vh-3rem)] md:overflow-y-auto"
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
          
          {/* Sound Buttons, grouped by category */}
          <div className="flex-1 flex flex-col gap-6 px-2 md:px-0">
            {sections.map(({ category, sounds }) => {
              const isCollapsed = collapsedCategories.has(category.id);

              return (
              <section key={category.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={!isCollapsed}
                  className="group w-full flex items-center gap-2 mb-2 text-left cursor-pointer"
                >
                  <svg
                    className={`w-3 h-3 text-gray-500 group-hover:text-emerald-400 transition-all duration-200 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                    viewBox="0 0 12 12"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M2 4l4 4 4-4z" />
                  </svg>
                  <h2 className="text-sm font-mono tracking-widest uppercase text-gray-300 group-hover:text-white transition-colors">
                    {category.label}
                  </h2>
                  <span className="text-xs font-mono text-gray-500">{sounds.length}</span>
                  <div className="flex-1 h-px bg-gray-800 ml-2 group-hover:bg-gray-700 transition-colors" />
                </button>

                <div
                  className={`grid ${getGridCols()} gap-2 md:gap-4 auto-rows-min ${isCollapsed ? 'hidden' : ''}`}
                >
                  {sounds.map(soundConfig => {
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
                          imageSrc={soundConfig.image}
                          gradient={soundConfig.gradient}
                          isCompact={columns >= 8}
                          onTrackSelect={() => handleTrackSelect(soundConfig)}
                          category={soundConfig.categoryLabel}
                          showCategory={columns === 4 || columns === 6}
                          isAdvancedMode={advanced}
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
              </section>
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
