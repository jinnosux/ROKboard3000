'use client';

import React, { useRef, useCallback, useState } from 'react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ volume, onVolumeChange }) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderClick = useCallback((e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const newVolume = Math.max(0, Math.min(1, 1 - (y / height)));
    onVolumeChange(newVolume);
  }, [onVolumeChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleSliderClick(e);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const y = moveEvent.clientY - rect.top;
      const height = rect.height;
      const newVolume = Math.max(0, Math.min(1, 1 - (y / height)));
      onVolumeChange(newVolume);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleSliderClick, onVolumeChange]);

  return (
    <div className="bg-black border border-gray-600 p-2 rounded-sm shadow-inner h-full flex flex-col w-16">
      <div className="text-xs text-gray-400 text-center mb-2 font-mono tracking-wider">
        VOLUME
      </div>
      <div className="flex-1 flex justify-center">
        <div className="bg-gray-950 border border-gray-700 p-1 w-6 h-full relative">
          <div 
            ref={sliderRef}
            className="absolute inset-1 cursor-pointer"
            onMouseDown={handleMouseDown}
          >
            {/* Slider Track */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600 transform -translate-x-1/2" />
            
            {/* Slider Fill */}
            <div 
              className={`absolute left-1/2 bottom-0 w-0.5 bg-gradient-to-t from-emerald-500 to-cyan-400 transform -translate-x-1/2 ${
                isDragging ? '' : 'transition-all duration-100'
              }`}
              style={{ height: `${Math.max(4, (volume * 100))}%` }}
            />
            
            {/* Slider Handle */}
            <div 
              className={`absolute left-1/2 w-4 h-2 bg-gray-200 border border-gray-500 shadow-sm cursor-pointer hover:bg-white hover:border-emerald-400 ${
                isDragging ? 'bg-white border-emerald-400' : 'transition-all duration-100'
              }`}
              style={{ 
                top: `${(1 - volume) * 100}%`, 
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeControl;