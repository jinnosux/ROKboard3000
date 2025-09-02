'use client';

import React from 'react';
import { useAudioAnalysis } from '@/contexts/AudioAnalysisContext';

interface VUMeterProps {
  // Remove old props as we're now using the global audio analysis
}

const VUMeter: React.FC<VUMeterProps> = () => {
  const { level, isActive } = useAudioAnalysis();

  const getVUBars = () => {
    const bars = [];
    const totalBars = 15; // Restored to 15 for better visual representation
    const activeBars = Math.ceil(level * totalBars);
    
    for (let i = 0; i < totalBars; i++) {
      const isActive = i < activeBars;
      let barColor = 'bg-gray-900';
      let glowColor = '';
      
      if (isActive) {
        if (i < 10) {
          barColor = 'bg-emerald-500';
          glowColor = 'shadow-emerald-500/50';
        } else if (i < 12) {
          barColor = 'bg-yellow-500';  
          glowColor = 'shadow-yellow-500/50';
        } else {
          barColor = 'bg-red-500';
          glowColor = 'shadow-red-500/50';
        }
      }
      
      bars.push(
        <div
          key={i}
          className={`h-1.5 w-full transition-all duration-100 ${barColor} ${
            isActive ? `${glowColor} shadow-sm` : ''
          }`}
          style={{ marginBottom: '1px' }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="bg-black border border-gray-600 p-2 rounded-sm shadow-inner h-full flex flex-col w-16">
      <div className="text-xs text-gray-400 text-center mb-2 font-mono tracking-wider">
        MASTER
      </div>
      <div className="flex-1 flex justify-center">
        <div className="flex flex-col-reverse bg-gray-950 border border-gray-700 p-1 w-6 h-full overflow-hidden">
          {getVUBars()}
        </div>
      </div>
    </div>
  );
};

export default VUMeter;