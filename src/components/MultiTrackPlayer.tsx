'use client';

import React, { useCallback, useMemo } from 'react';
import TrackPlayer from './TrackPlayer';

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
}

interface MultiTrackPlayerProps {
  serialMode: boolean;
  tracks: Track[];
  onRemoveTrack?: (trackId: string) => void;
  autoplay?: boolean;
}

const MultiTrackPlayer: React.FC<MultiTrackPlayerProps> = ({ serialMode, tracks, onRemoveTrack, autoplay = false }) => {
  const removeTrack = useCallback((trackId: string) => {
    onRemoveTrack?.(trackId);
  }, [onRemoveTrack]);

  const layoutClasses = useMemo(() => {
    const count = tracks.length;
    
    if (count === 0) return '';
    
    // Mobile: Always 1 column, Desktop: existing logic
    if (serialMode) {
      return 'grid-cols-1 md:grid-cols-2 auto-rows-min';
    }
    
    // Non-serial mode: single track takes full width
    if (count === 1) return 'grid-cols-1';
    
    // For 2+ tracks: mobile stacked, desktop 2x2 grid
    return 'grid-cols-1 md:grid-cols-2 auto-rows-min';
  }, [tracks.length, serialMode]);

  const trackHeight = useMemo(() => {
    const count = tracks.length;
    
    // Non-serial mode (single track): Use full LivePlayer height
    if (!serialMode && count === 1) return 120;
    
    // Serial mode: consistent height regardless of track count to prevent layout shifts
    if (serialMode) return 80;
    
    // Non-serial mode with 2+ tracks: use smaller height for 2x2 grid
    return 60;
  }, [serialMode, tracks.length]);

  const isCompact = useMemo(() => 
    // Serial mode: always compact to maintain consistency
    // Non-serial mode: compact for 2+ tracks
    serialMode || tracks.length >= 2,
    [serialMode, tracks.length]
  );

  if (tracks.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="text-gray-500 font-mono text-sm">
            {serialMode 
              ? "Serial mode ON - Click sound buttons to add up to 4 tracks"
              : "No track loaded - Click a sound button to load"
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-transparent p-6">
      <div className={`grid gap-3 ${layoutClasses}`}>
        {tracks.map((track) => (
          <TrackPlayer
            key={track.id}
            track={track}
            onRemove={serialMode ? removeTrack : undefined}
            height={trackHeight}
            isCompact={isCompact}
            autoplay={autoplay}
          />
        ))}
      </div>
      
      {serialMode && tracks.length > 0 && tracks.length < 4 && (
        <div className="mt-3 text-center">
          <div className="text-gray-400 text-xs font-mono">
            {tracks.length}/4 tracks loaded • Click sound buttons to add more tracks
          </div>
        </div>
      )}
    </div>
  );
};

// Export the addTrack function so it can be called from outside
export { MultiTrackPlayer };
export default MultiTrackPlayer;