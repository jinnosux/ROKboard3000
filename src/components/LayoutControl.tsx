'use client';

import React from 'react';

interface LayoutControlProps {
  currentColumns: number;
  onColumnsChange: (columns: number) => void;
}

const LayoutControl: React.FC<LayoutControlProps> = ({ currentColumns, onColumnsChange }) => {
  const columnOptions = [4, 6, 8, 10];

  return (
    <div className="flex space-x-1">
      {columnOptions.map(columns => (
        <button
          key={columns}
          onClick={() => onColumnsChange(columns)}
          className={`
            border border-gray-600 rounded-sm shadow-inner transition-all duration-300 font-mono text-xs tracking-wider
            ${currentColumns === columns 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-black text-gray-300 hover:bg-gray-800'
            }
          `}
          style={{ width: '34px', height: '40px' }}
        >
          {columns}
        </button>
      ))}
    </div>
  );
};

export default LayoutControl;