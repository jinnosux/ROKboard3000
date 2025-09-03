'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import { AudioTrack } from '@/types/audio';
import { createWavesurferConfig } from '@/utils/wavesurferConfig';
import { createRegionPlayback } from '@/utils/regionPlayback';
import { useWavesurferRegions } from '@/hooks/useWavesurferRegions';
import { useWavesurferEvents } from '@/hooks/useWavesurferEvents';
import { usePlayPauseHandler } from '@/hooks/usePlayPauseHandler';
import { useAudioAnalysis } from '@/contexts/AudioAnalysisContext';

interface TrackPlayerProps {
  track: AudioTrack;
  onRemove?: (trackId: string) => void;
  height?: number;
  isCompact?: boolean;
  autoplay?: boolean;
}

const TrackPlayer: React.FC<TrackPlayerProps> = React.memo(({ 
  track, 
  onRemove, 
  height = 80,
  isCompact = false,
  autoplay = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [regionsEnabled, setRegionsEnabled] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [preservePitch, setPreservePitch] = useState(false);
  const [showSpeedOptions, setShowSpeedOptions] = useState(false);
  const [loopMode, setLoopMode] = useState(false); // New: Smart loop mode
  const hasUserInteractedRef = useRef(false);
  
  const { registerWavesurfer, unregisterWavesurfer, updatePlayingState } = useAudioAnalysis();
  
  const { wavesurfer, isReady, isPlaying } = useWavesurfer({
    container: containerRef,
    ...createWavesurferConfig(track.url, height)
  });

  // Function to mark user interaction
  const markUserInteraction = useCallback(() => {
    hasUserInteractedRef.current = true;
  }, []);

  // Register this wavesurfer instance with the global audio analysis
  useEffect(() => {
    if (wavesurfer && isReady) {
      registerWavesurfer(track.id, wavesurfer, isPlaying, markUserInteraction);
      
      return () => {
        unregisterWavesurfer(track.id);
      };
    }
  }, [wavesurfer, isReady, isPlaying, track.id, registerWavesurfer, unregisterWavesurfer, markUserInteraction]);

  // Update playing state when it changes
  useEffect(() => {
    if (wavesurfer && isReady) {
      updatePlayingState(track.id, isPlaying);
    }
  }, [isPlaying, track.id, wavesurfer, isReady, updatePlayingState]);

  // Update pitch preservation when it changes
  useEffect(() => {
    if (wavesurfer && isReady) {
      const mediaElement = wavesurfer.getMediaElement();
      if (mediaElement) {
        (mediaElement as HTMLMediaElement & { preservesPitch?: boolean }).preservesPitch = preservePitch;
      }
    }
  }, [wavesurfer, isReady, preservePitch]);

  // Autoplay functionality - start playing when track loads and autoplay is enabled (only if user hasn't interacted)
  useEffect(() => {
    if (wavesurfer && isReady && autoplay && !isPlaying && !hasUserInteractedRef.current) {
      wavesurfer.play();
    }
  }, [wavesurfer, isReady, autoplay, isPlaying]);

  const { currentRegion, isLooping, startLoop, stopLoop } = useWavesurferRegions(
    wavesurfer, 
    isReady, 
    regionsEnabled, 
    () => {
      setLoopEnabled(false);
      setLoopMode(false); // Reset loop mode when regions are cleared
    }
  );
  
  useWavesurferEvents(wavesurfer, isReady, regionsEnabled);

  const playRegion = useCallback(() => {
    if (loopEnabled && currentRegion && !isLooping) {
      // Only start loop if not already looping
      startLoop(currentRegion);
    }
    createRegionPlayback(currentRegion, loopEnabled, wavesurfer);
  }, [loopEnabled, currentRegion, isLooping, startLoop, wavesurfer]);
  
  const originalHandlePlayPause = usePlayPauseHandler(
    wavesurfer, 
    isReady, 
    isPlaying, 
    currentRegion, 
    regionsEnabled, 
    playRegion
  );

  const handlePlayPause = useCallback(() => {
    markUserInteraction();
    
    // If there's a current region and regions are enabled, handle region play/pause
    if (currentRegion && regionsEnabled) {
      if (isPlaying) {
        // If currently playing, just pause (don't stop looping, just pause playback)
        wavesurfer?.pause();
      } else {
        // If not playing, check if we're within the region bounds
        const currentTime = wavesurfer?.getCurrentTime() || 0;
        const isWithinRegion = currentTime >= currentRegion.start && currentTime <= currentRegion.end;
        
        if (isWithinRegion) {
          // We're within the region, just resume normal playback
          wavesurfer?.play();
          // If loop mode was enabled, re-enable the loop monitoring
          if (loopEnabled && !isLooping) {
            startLoop(currentRegion);
          }
        } else {
          // We're outside the region, start from the beginning
          playRegion();
        }
      }
    } else {
      originalHandlePlayPause();
    }
  }, [markUserInteraction, currentRegion, regionsEnabled, isPlaying, wavesurfer, loopEnabled, isLooping, startLoop, playRegion, originalHandlePlayPause]);

  // Handle spacebar for this specific track when it has focus or regions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && currentRegion && regionsEnabled) {
        event.preventDefault();
        event.stopPropagation();
        handlePlayPause();
      }
    };

    // Only add listener when there's a current region
    if (currentRegion && regionsEnabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [currentRegion, regionsEnabled, handlePlayPause]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (wavesurfer && isReady) {
      // In WaveSurfer.js v7, setPlaybackRate only takes one parameter
      wavesurfer.setPlaybackRate(rate);
      
      // Set preservesPitch property on the media element
      const mediaElement = wavesurfer.getMediaElement();
      if (mediaElement) {
        (mediaElement as HTMLMediaElement & { preservesPitch?: boolean }).preservesPitch = preservePitch;
      }
      
      setPlaybackRate(rate);
    }
  }, [wavesurfer, isReady, preservePitch]);

  const speedOptions = [0.25, 0.5, 1.0, 1.5, 2.0];

  const controlButtonSize = isCompact ? 'w-12 h-6' : 'w-16 h-8';
  const textSize = isCompact ? 'text-sm' : 'text-sm';

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-3">
      {/* Track Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className={`text-white font-medium truncate ${textSize}`}>
            {track.name}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(track.id)}
            className="text-gray-400 hover:text-red-400 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Controls and Waveform - 3 Column Layout */}
      <div className="flex items-center gap-3">
        {/* Column 1: Play Button - Height of 2 buttons combined */}
        <button
          onClick={handlePlayPause}
          disabled={!isReady}
          className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center ${isCompact ? 'w-12 h-14' : 'w-16 h-18'}`}
        >
          {isPlaying ? (
            <div className={`bg-white ${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`}></div>
          ) : (
            <div className={`w-0 h-0 border-l-white border-y-transparent ml-0.5 ${
              isCompact ? 'border-l-[8px] border-y-[6px]' : 'border-l-[10px] border-y-[7px]'
            }`}></div>
          )}
        </button>

        {/* Column 2: CUT/LOOP */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              const newRegionsEnabled = !regionsEnabled;
              
              // Stop audio when enabling regions for proper selection
              if (newRegionsEnabled && isPlaying) {
                wavesurfer?.pause();
              }
              
              setRegionsEnabled(newRegionsEnabled);
              
              // If turning off regions while in loop mode, also disable loop mode
              if (!newRegionsEnabled && loopMode) {
                setLoopMode(false);
                setLoopEnabled(false);
                if (isLooping) {
                  stopLoop();
                }
              }
            }}
            disabled={!isReady}
            className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 ${
              regionsEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25'
                : 'bg-black text-gray-400 hover:bg-gray-800'
            } ${controlButtonSize}`}
          >
            <span className={`font-mono tracking-wider ${isCompact ? 'text-xs' : 'text-sm'}`}>
              CUT
            </span>
          </button>

          <button
            onClick={() => {
              const newLoopMode = !loopMode;
              
              // Stop audio when enabling loop mode for proper region selection
              if (newLoopMode && isPlaying) {
                wavesurfer?.pause();
              }
              
              setLoopMode(newLoopMode);
              
              if (newLoopMode) {
                // Enable loop mode: auto-turn on CUT for region marking
                setRegionsEnabled(true);
                setLoopEnabled(true);
              } else {
                // Disable loop mode: turn off looping and CUT
                setLoopEnabled(false);
                setRegionsEnabled(false);
                if (isLooping) {
                  stopLoop();
                }
              }
            }}
            disabled={!isReady}
            className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 ${
              loopMode || (loopEnabled && currentRegion)
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25'
                : 'bg-black text-gray-400 hover:bg-gray-800'
            } ${controlButtonSize}`}
          >
            <span className={`font-mono tracking-wider ${isCompact ? 'text-xs' : 'text-sm'}`}>
              LOOP
            </span>
          </button>
        </div>

        {/* Column 3: PITCH/Speed */}
        <div className="flex flex-col gap-2 relative">
          <button
            onClick={() => setPreservePitch(!preservePitch)}
            disabled={!isReady}
            className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 ${
              preservePitch
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25'
                : 'bg-black text-gray-400 hover:bg-gray-800'
            } ${controlButtonSize}`}
          >
            <span className={`font-mono tracking-wider ${isCompact ? 'text-xs' : 'text-sm'}`}>
              PITCH
            </span>
          </button>

          {/* Speed Selector Button */}
          <button
            onClick={() => setShowSpeedOptions(!showSpeedOptions)}
            disabled={!isReady}
            className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 bg-black text-gray-400 hover:bg-gray-800 ${controlButtonSize}`}
          >
            <span className={`font-mono tracking-wider ${isCompact ? 'text-xs' : 'text-sm'}`}>
              {playbackRate}x
            </span>
          </button>

          {/* Speed Options Dropdown - Opens upward to avoid overflow */}
          {showSpeedOptions && (
            <div className="absolute bottom-full left-0 mb-1 bg-gray-900 border border-gray-600 rounded-sm shadow-lg z-10">
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    handlePlaybackRateChange(speed);
                    setShowSpeedOptions(false);
                  }}
                  disabled={!isReady}
                  className={`w-full px-3 py-2 ${isCompact ? 'text-xs' : 'text-sm'} font-mono text-center hover:bg-gray-800 transition-all duration-300 first:rounded-t-sm last:rounded-b-sm ${
                    playbackRate === speed ? 'bg-emerald-600 text-white shadow-lg hover:shadow-emerald-500/25' : 'text-gray-400'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Waveform */}
        <div className="flex-1">
          <div ref={containerRef} className="w-full" />
        </div>
      </div>

    </div>
  );
});

TrackPlayer.displayName = 'TrackPlayer';

export default TrackPlayer;