'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  courseId: string;
  onProgress?: (percentage: number) => void;
  onComplete?: () => void;
  initialProgress?: number;
  nextLessonId?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  lessonId,
  courseId,
  onProgress,
  onComplete,
  initialProgress = 0,
  nextLessonId
}) => {
  const [player, setPlayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(initialProgress);
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(videoUrl);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      return;
    }

    // Load the IFrame Player API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API ready callback
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!playerRef.current || !videoId) return;

    const newPlayer = new window.YT.Player(playerRef.current, {
      videoId: videoId,
      playerVars: {
        controls: 0,          // Disable controls to prevent seeking
        disablekb: 1,         // Disable keyboard controls
        modestbranding: 1,    // Hide YouTube logo
        rel: 0,               // Don't show related videos
        showinfo: 0,          // Hide video info
        iv_load_policy: 3,    // Hide annotations
        fs: 0,                // Disable fullscreen button
        playsinline: 1,       // Play inline on mobile
        origin: window.location.origin
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });

    setPlayer(newPlayer);
  };

  const onPlayerReady = (event: any) => {
    setIsReady(true);
    const videoDuration = event.target.getDuration();
    setDuration(videoDuration);

    // Resume from last position if available
    if (initialProgress > 0 && videoDuration > 0) {
      const resumeTime = (initialProgress / 100) * videoDuration;
      event.target.seekTo(resumeTime, true);
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      startProgressTracking();
    } else {
      stopProgressTracking();
    }
  };

  const onPlayerError = (event: any) => {
    console.error('YouTube Player Error:', event.data);
    toast.error('Error loading video. Please try again.');
  };

  const startProgressTracking = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (!player || !player.getCurrentTime) return;

      const current = player.getCurrentTime();
      const total = player.getDuration();
      
      if (current && total) {
        setCurrentTime(current);
        setDuration(total);
        
        const percentage = (current / total) * 100;
        setWatchPercentage(percentage);
        
        // Call onProgress callback
        if (onProgress) {
          onProgress(percentage);
        }

        // Check for 80% completion
        if (percentage >= 80 && !hasCompletedOnce) {
          setHasCompletedOnce(true);
          if (onComplete) {
            onComplete();
          }
          toast.success('Lesson completed! Next lesson unlocked.');
        }
      }
    }, 1000); // Update every second
  };

  const stopProgressTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Custom controls
  const handlePlayPause = () => {
    if (!player) return;

    if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleRewind = () => {
    if (!player) return;
    const currentTime = player.getCurrentTime();
    player.seekTo(Math.max(0, currentTime - 10), true);
  };

  const handleForward = () => {
    if (!player) return;
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    player.seekTo(Math.min(duration, currentTime + 10), true);
  };

  const handleSpeedChange = (speed: number) => {
    if (!player) return;
    player.setPlaybackRate(speed);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextLesson = () => {
    if (nextLessonId && watchPercentage >= 80) {
      router.push(`/learn/${courseId}/${nextLessonId}`);
    }
  };

  if (!videoId) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <p className="text-red-500">Invalid video URL</p>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div className="relative bg-black rounded-lg overflow-hidden">
        {/* YouTube Player */}
        <div ref={playerRef} className="w-full aspect-video" />
        
        {/* Custom Control Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center text-white text-sm mb-1">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-2">/</span>
              <span>{formatTime(duration)}</span>
              <span className="ml-auto">{Math.round(watchPercentage)}% watched</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${watchPercentage}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Play/Pause"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={handleRewind}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Rewind 10s"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              <button
                onClick={handleForward}
                className="text-white hover:text-blue-400 transition-colors"
                aria-label="Forward 10s"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Speed Control */}
              <select
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="bg-gray-800 text-white text-sm rounded px-2 py-1"
                defaultValue="1"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>

              {/* Next Lesson Button */}
              {nextLessonId && watchPercentage >= 80 && (
                <button
                  onClick={handleNextLesson}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Next Lesson →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sequential Learning Notice */}
        {watchPercentage < 80 && (
          <div className="absolute top-4 right-4 bg-yellow-500/90 text-black px-3 py-1 rounded-lg text-sm">
            Watch 80% to unlock next lesson
          </div>
        )}
      </div>
    </div>
  );
};