'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sound } from '@/hooks/useAudio';

interface SoundButtonProps {
  sound: Sound;
  onPlay: () => void;
  onStop: () => void;
  disabled?: boolean;
  imageSrc?: string;
  isCompact?: boolean;
  onTrackSelect?: () => void;
  category?: string;
  showCategory?: boolean;
}

const SoundButton: React.FC<SoundButtonProps> = ({ sound, onPlay, onStop, disabled, imageSrc, isCompact = false, onTrackSelect, category, showCategory = false }) => {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (sound.isPlaying) {
      onStop();
    } else {
      onPlay();
      onTrackSelect?.(); // Load track into live player
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    if (!sound.duration || !sound.isPlaying) return '';
    const elapsed = (sound.progress || 0) * sound.duration;
    const remaining = sound.duration - elapsed;
    return formatTime(remaining);
  };

  const getButtonStyle = () => {
    if (disabled || sound.isLoading) {
      return 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-700';
    }
    if (sound.isPlaying) {
      return 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-500 shadow-lg shadow-emerald-500/25';
    }
    return 'bg-gray-900 hover:bg-gray-800 text-white border-gray-600 hover:border-gray-400 hover:shadow-lg';
  };

  const getBackgroundGradient = () => {
    // Aurora Borealis inspired gradient - consistent for all buttons
    return 'from-emerald-900 via-teal-900 to-cyan-900';
  };

  return (
    <div className="w-full h-full">
      <button
        onClick={handleClick}
        disabled={disabled || sound.isLoading}
        className={`
          w-full h-full rounded-xl border transition-all duration-300 ease-out
          flex flex-col items-center justify-center p-4 relative overflow-hidden
          ${getButtonStyle()}
        `}
      >
        {/* Background - either image or gradient fallback */}
        {imageSrc && !imageError ? (
          <div className="absolute inset-0 opacity-40">
            <Image
              src={imageSrc}
              alt={sound.name}
              fill
              className="object-cover rounded-xl"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${getBackgroundGradient()}`} />
        )}
        
        {/* Progress overlay that moves from left to right */}
        {sound.isPlaying && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-green-500/40 rounded-xl"
            style={{
              width: `${(sound.progress || 0) * 100}%`,
              transition: 'width 0.1s linear'
            }}
          />
        )}
        
        <div className="relative z-10 text-center">
          {sound.isLoading ? (
            <div className="text-lg">Loading...</div>
          ) : (
            <>
              <div className={`font-black leading-tight tracking-tight ${isCompact ? 'text-xs sm:text-sm md:text-base lg:text-xl' : 'text-sm sm:text-base md:text-lg lg:text-3xl'}`}>
                {sound.name}
              </div>
              {sound.isPlaying && (
                <div className="text-xs mt-1 opacity-70 font-mono">
                  {getRemainingTime()}
                </div>
              )}
            </>
          )}
        </div>

        {sound.isPlaying && (
          <div className="absolute inset-0 border-2 border-emerald-400 rounded-xl animate-pulse" />
        )}

        {/* Category display in bottom right corner */}
        {showCategory && category && (
          <div className="absolute bottom-2 right-2 text-xs text-green-400 font-medium z-20 bg-black/60 px-1.5 py-0.5 rounded">
            {category}
          </div>
        )}
      </button>
    </div>
  );
};

export default SoundButton;