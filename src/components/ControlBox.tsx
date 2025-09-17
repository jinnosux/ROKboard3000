'use client';

import React from 'react';
import VUMeter from './VUMeter';
import VolumeControl from './VolumeControl';
import LayoutControl from './LayoutControl';

interface ControlBoxProps {
  masterVolume: number;
  onVolumeChange: (volume: number) => void;
  columns: number;
  onColumnsChange: (columns: number) => void;
  onStopAll: () => void;
  isAnyPlaying: boolean;
  autoplay: boolean;
  onAutoplayChange: (enabled: boolean) => void;
  advanced: boolean;
  onAdvancedChange: (enabled: boolean) => void;
}

const ControlBox: React.FC<ControlBoxProps> = ({
  masterVolume,
  onVolumeChange,
  columns,
  onColumnsChange,
  onStopAll,
  isAnyPlaying,
  autoplay,
  onAutoplayChange,
  advanced,
  onAdvancedChange
}) => {
  return (
    <div className="w-full bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 flex flex-col items-center relative">
      
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-white mb-1 tracking-wider font-mono">
          ROKboard 3000
        </h1>
        <div className="text-sm text-gray-400 font-mono tracking-wider">
          CONTROL
        </div>
      </div>

      {/* Control containers with mobile-responsive layout */}
      <div className="flex flex-col md:flex-col space-y-5">

        {/* Mobile: Two column layout, Desktop: Single column */}
        <div className="flex flex-row space-x-6 items-stretch md:flex-col md:space-x-0 md:space-y-5 md:items-start">

          {/* Left Column (Mobile) / Top Section (Desktop): VU meter and volume */}
          <div className="flex flex-col items-center justify-center space-y-4 flex-1 md:justify-start">
            <div className="flex items-center space-x-4 h-40">
              <VUMeter />
              <VolumeControl
                volume={masterVolume}
                onVolumeChange={onVolumeChange}
              />
            </div>
          </div>

          {/* Right Column (Mobile) / Bottom Section (Desktop): All buttons */}
          <div className="flex flex-col items-center justify-center space-y-4 flex-1 md:justify-start">
            <button
              onClick={onStopAll}
              disabled={!isAnyPlaying}
              className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 ${
                isAnyPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/25'
                  : 'bg-black text-gray-400 cursor-not-allowed'
              }`}
              style={{ width: '144px', height: '40px' }}
            >
              <span className="font-mono text-xs tracking-wider">
                STOP ALL
              </span>
            </button>

            <button
              onClick={() => onAdvancedChange(!advanced)}
              className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 ${
                advanced
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25'
                  : 'bg-black text-gray-400 cursor-default'
              }`}
              style={{ width: '144px', height: '40px' }}
            >
              <span className="font-mono text-xs tracking-wider">
                ADVANCED {advanced ? 'ON' : 'OFF'}
              </span>
            </button>

            {advanced && (
              <button
                onClick={() => onAutoplayChange(!autoplay)}
                className={`border border-gray-600 rounded-sm shadow-inner transition-all duration-300 ${
                  autoplay
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25'
                    : 'bg-black text-gray-400 cursor-default'
                }`}
                style={{ width: '144px', height: '40px' }}
              >
                <span className="font-mono text-xs tracking-wider">
                  AUTOPLAY {autoplay ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            <LayoutControl
              currentColumns={columns}
              onColumnsChange={onColumnsChange}
            />
          </div>
        </div>
      </div>
      </div>
  );
};

export default ControlBox;