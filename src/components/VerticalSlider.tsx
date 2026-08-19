'use client';

import React, { useRef, useCallback, useState } from 'react';

interface VerticalSliderProps {
  /** 0..1, top is 1 */
  value: number;
  onChange: (value: number) => void;
  /** Sizing for the track area, e.g. "h-10 w-4" */
  className?: string;
  /** Sizing for the draggable handle, e.g. "w-3 h-1.5" */
  handleClassName?: string;
  ariaLabel?: string;
}

/**
 * Bare vertical fader: track, fill, handle. Pointer-event based so it works with
 * mouse, touch and pen; touch-action none keeps a drag from scrolling the page.
 */
const VerticalSlider: React.FC<VerticalSliderProps> = ({
  value,
  onChange,
  className = 'h-full w-full',
  handleClassName = 'w-4 h-2',
  ariaLabel,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const valueFromEvent = useCallback((clientY: number) => {
    const el = trackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.height === 0) return null;
    return Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const next = valueFromEvent(e.clientY);
    if (next !== null) onChange(next);
  }, [onChange, valueFromEvent]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const next = valueFromEvent(e.clientY);
    if (next !== null) onChange(next);
  }, [isDragging, onChange, valueFromEvent]);

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  }, []);

  const nudge = useCallback((delta: number) => {
    onChange(Math.max(0, Math.min(1, value + delta)));
  }, [onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); nudge(0.05); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); nudge(-0.05); }
    else if (e.key === 'Home') { e.preventDefault(); onChange(1); }
    else if (e.key === 'End') { e.preventDefault(); onChange(0); }
  }, [nudge, onChange]);

  return (
    // The outer element takes the caller's positioning/sizing classes, so it must
    // not carry a `position` of its own - that would conflict with an `absolute`
    // passed in and collapse the box to 0x0. The inner wrapper provides the
    // containing block for the absolutely positioned parts.
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-orientation="vertical"
      className={`cursor-pointer select-none touch-none focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
    >
      <div className="relative w-full h-full">
        {/* Track */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-600 -translate-x-1/2" />

        {/* Fill */}
        <div
          className={`absolute left-1/2 bottom-0 w-0.5 bg-gradient-to-t from-emerald-500 to-cyan-400 -translate-x-1/2 ${
            isDragging ? '' : 'transition-all duration-100'
          }`}
          style={{ height: `${Math.max(4, value * 100)}%` }}
        />

        {/* Handle */}
        <div
          className={`absolute left-1/2 bg-gray-200 border border-gray-500 shadow-sm hover:bg-white hover:border-emerald-400 ${handleClassName} ${
            isDragging ? 'bg-white border-emerald-400' : 'transition-all duration-100'
          }`}
          style={{ top: `${(1 - value) * 100}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
    </div>
  );
};

export default VerticalSlider;
