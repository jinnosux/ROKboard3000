'use client';

import React from 'react';
import VerticalSlider from './VerticalSlider';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ volume, onVolumeChange }) => {
  return (
    <div className="bg-black border border-gray-600 p-2 rounded-sm shadow-inner h-full flex flex-col w-16">
      <div className="text-xs text-gray-400 text-center mb-2 font-mono tracking-wider">
        VOLUME
      </div>
      <div className="flex-1 flex justify-center">
        <div className="bg-gray-950 border border-gray-700 p-1 w-6 h-full relative">
          <VerticalSlider
            value={volume}
            onChange={onVolumeChange}
            className="absolute inset-1"
            handleClassName="w-4 h-2"
            ariaLabel="Master volume"
          />
        </div>
      </div>
    </div>
  );
};

export default VolumeControl;
