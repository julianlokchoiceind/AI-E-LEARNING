'use client';

import React, { useState, useRef, useCallback } from 'react';

interface VideoProgressBarProps {
  progress: number; // 0-100
  buffered?: number; // 0-100
  duration: number; // in seconds
  currentTime: number; // in seconds
  onSeek?: (time: number) => void;
  disabled?: boolean;
  className?: string;
  showTime?: boolean;
  isMobile?: boolean;
}

export const VideoProgressBar: React.FC<VideoProgressBarProps> = ({
  progress,
  buffered = 0,
  duration,
  currentTime,
  onSeek,
  disabled = false,
  className = '',
  showTime = true,
  isMobile = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!progressBarRef.current || disabled) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const time = (percentage / 100) * duration;
    
    setHoverTime(time);
  }, [duration, disabled]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!progressBarRef.current || disabled || !onSeek) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const time = (percentage / 100) * duration;
    
    onSeek(time);
  }, [duration, disabled, onSeek]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !onSeek) return;
    
    setIsDragging(true);
    e.preventDefault();
  }, [disabled, onSeek]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !progressBarRef.current || disabled || !onSeek) return;
    
    const touch = e.touches[0];
    const rect = progressBarRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const time = (percentage / 100) * duration;
    
    onSeek(time);
    e.preventDefault();
  }, [isDragging, duration, disabled, onSeek]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className={`video-progress-container ${className}`}>
      {/* Time Display */}
      {showTime && (
        <div className={`flex items-center text-white mb-2 ${
          isMobile ? 'text-xs' : 'text-sm'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span className="mx-2">/</span>
          <span>{formatTime(duration)}</span>
          {!isMobile && (
            <span className="ml-auto">
              {Math.round(progress)}% watched
            </span>
          )}
        </div>
      )}
      
      {/* Progress Bar Container */}
      <div
        ref={progressBarRef}
        className={`relative w-full bg-gray-700 rounded-full cursor-pointer group ${
          isMobile ? 'h-3' : 'h-2 hover:h-3'
        } transition-all duration-200`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverTime(null)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Buffered Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gray-500 rounded-full transition-all duration-300"
          style={{ width: `${buffered}%` }}
        />
        
        {/* Watch Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Progress Thumb */}
          {!disabled && onSeek && (
            <div className={`absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 
              bg-blue-600 border-2 border-white rounded-full transition-all duration-200 ${
                isDragging || (!isMobile && hoverTime !== null)
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
              } ${isMobile ? 'w-4 h-4' : 'w-3 h-3 group-hover:opacity-100 group-hover:scale-100'}`}
            />
          )}
        </div>
        
        {/* Hover Time Tooltip (Desktop only) */}
        {!isMobile && hoverTime !== null && !disabled && (
          <div
            className="absolute bottom-full mb-2 px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded whitespace-nowrap transform -translate-x-1/2"
            style={{
              left: `${(hoverTime / duration) * 100}%`
            }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
      
      {/* Mobile Progress Indicator */}
      {isMobile && (
        <div className="flex items-center justify-between mt-1 text-xs text-white opacity-75">
          <span>{Math.round(progress)}% watched</span>
          {buffered > progress && (
            <span>Buffered: {Math.round(buffered)}%</span>
          )}
        </div>
      )}
    </div>
  );
};