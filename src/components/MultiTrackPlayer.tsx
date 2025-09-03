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
  tracks: Track[];
  onRemoveTrack?: (trackId: string) => void;
  autoplay?: boolean;
}

const MultiTrackPlayer: React.FC<MultiTrackPlayerProps> = ({ tracks, onRemoveTrack, autoplay = false }) => {
  const removeTrack = useCallback((trackId: string) => {
    onRemoveTrack?.(trackId);
  }, [onRemoveTrack]);

  const layoutClasses = useMemo(() => {
    const count = tracks.length;
    
    if (count === 0) return '';
    
    // Always in multi-track mode: Mobile stacked, Desktop 2-column grid
    return 'grid-cols-1 md:grid-cols-2 auto-rows-min';
  }, [tracks.length]);

  const trackHeight = useMemo(() => {
    // Always in multi-track mode: consistent height to prevent layout shifts
    return 80;
  }, []);

  const isCompact = useMemo(() => 
    // Always in multi-track mode: always use compact layout
    true,
    []
  );

  if (tracks.length === 0) {
    return (
      <div className="mt-6 md:fixed md:bottom-0 md:left-0 md:right-0 md:mt-0 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl md:p-6">
        <div className="flex items-center justify-center">
          <div className="text-gray-500 font-mono text-sm">
            Click sound buttons to add up to 4 tracks
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 md:fixed md:bottom-0 md:left-0 md:right-0 md:mt-0 bg-transparent md:p-6">
      <div className={`grid gap-3 ${layoutClasses}`}>
        {tracks.map((track) => (
          <TrackPlayer
            key={track.id}
            track={track}
            onRemove={removeTrack}
            height={trackHeight}
            isCompact={isCompact}
            autoplay={autoplay}
          />
        ))}
      </div>
      
      {tracks.length > 0 && tracks.length < 4 && (
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