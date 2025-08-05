'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import YouTube, { YouTubeProps, YouTubeEvent } from 'react-youtube';
import { ToastService } from '@/lib/toast/ToastService';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, X } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  lessonId: string;
  courseId: string;
  onProgress?: (percentage: number, actualPercentage: number) => void;
  onComplete?: () => void;
  onDurationChange?: (duration: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onPause?: (percentage: number, currentTime: number) => void;
  onPlay?: () => void;
  initialProgress?: number;
  initialCurrentPosition?: number; // exact timestamp in seconds
  nextLessonId?: string;
  actualVideoProgress?: number; // Pass actual progress from parent
}

const VideoPlayerComponent: React.FC<VideoPlayerProps> = ({
  videoUrl,
  lessonId,
  courseId,
  onProgress,
  onComplete,
  onDurationChange,
  onTimeUpdate,
  onPause,
  onPlay,
  initialProgress = 0,
  initialCurrentPosition = 0,
  nextLessonId,
  actualVideoProgress = 0
}) => {
  // Use useRef to maintain player instance across re-renders
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchPercentage, setWatchPercentage] = useState(initialProgress);
  // Remove internal actualWatchPercentage state - use prop from parent
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seekCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  
  // Track component mount state
  const isMountedRef = useRef(true);
  
  // Memoized progress callback to prevent unnecessary re-renders
  const handleProgressUpdate = useCallback((percentage: number, actualPercentage: number) => {
    if (isMountedRef.current && onProgress) {
      onProgress(percentage, actualPercentage);
    }
  }, [onProgress]);
  
  // Direct play/pause with retry logic for YouTube API timing issues
  const handlePlayPauseClick = useCallback(() => {
    if (!playerRef.current || !isReady) {
      return;
    }
    
    const attemptPlayPause = (retries = 3) => {
      try {
        // Double check player exists and has required methods
        if (!playerRef.current || typeof playerRef.current.getPlayerState !== 'function') {
          if (retries > 0) {
            setTimeout(() => attemptPlayPause(retries - 1), 200);
          }
          return;
        }
        
        const playerState = playerRef.current.getPlayerState();
        const playerStates = window.YT?.PlayerState || { PLAYING: 1, PAUSED: 2 };
        
        // Use actual player state instead of React state
        if (playerState === playerStates.PLAYING) {
          // Check player exists before calling pauseVideo
          if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
            playerRef.current.pauseVideo();
            // Immediately update UI state for responsive feedback
            setIsPlaying(false);
            
            // Verify pause worked after a short delay
            setTimeout(() => {
              if (playerRef.current && typeof playerRef.current.getPlayerState === 'function' && 
                  playerRef.current.getPlayerState() === playerStates.PLAYING && retries > 0) {
                attemptPlayPause(retries - 1);
              }
            }, 100);
          }
        } else {
          // Check player exists before calling playVideo
          if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
            // Immediately update UI state for responsive feedback
            setIsPlaying(true);
            
            // Verify play worked after a short delay
            setTimeout(() => {
              if (playerRef.current && typeof playerRef.current.getPlayerState === 'function' && 
                  playerRef.current.getPlayerState() !== playerStates.PLAYING && retries > 0) {
                attemptPlayPause(retries - 1);
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('[VideoPlayer] Error toggling play/pause:', error);
        if (retries > 0) {
          setTimeout(() => attemptPlayPause(retries - 1), 200);
        } else {
          setPlayerError('Failed to toggle playback');
        }
      }
    };
    
    attemptPlayPause();
  }, [isReady]);
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(videoUrl) || '';

  // Memoized YouTube player options for performance
  const opts: YouTubeProps['opts'] = useMemo(() => ({
    playerVars: {
      autoplay: 0,
      controls: 0,          // Disable controls to use custom controls
      disablekb: 1,         // Disable keyboard controls
      modestbranding: 1,    // Hide YouTube logo
      rel: 0,               // Don't show related videos
      showinfo: 0,          // Hide video info
      iv_load_policy: 3,    // Hide annotations
      fs: 0,                // Disable fullscreen button
      playsinline: 1,       // Play inline on mobile
      origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    }
  }), []);

  const onPlayerReady = useCallback((event: YouTubeEvent) => {
    try {
      const playerInstance = event.target;
      
      // Ensure player instance is valid before assigning
      if (!playerInstance || typeof playerInstance.getDuration !== 'function') {
        console.error('[VideoPlayer] Invalid player instance received');
        setPlayerError('Failed to initialize player');
        setIsLoading(false);
        return;
      }
      
      playerRef.current = playerInstance;
      setIsReady(true);
      setIsLoading(false);
      setPlayerError(null);
      
      // Function to get duration with retry
      const getDurationWithRetry = (retries = 5, delay = 100) => {
        const attemptGetDuration = (attempt: number) => {
          if (!playerRef.current || !isMountedRef.current) return;
          
          const videoDuration = playerRef.current.getDuration();
          
          if (videoDuration && videoDuration > 0) {
            setDuration(videoDuration);
            
            // Call onDurationChange callback if provided
            if (onDurationChange && isMountedRef.current) {
              onDurationChange(videoDuration);
            }
            
            // Resume from exact saved position if available
            try {
              // Calculate the actual max time based on actualVideoProgress
              const actualProgressTime = actualVideoProgress > 0 ? (actualVideoProgress / 100) * videoDuration : 0;
              
              console.log('[VideoPlayer] Resume Debug:', {
                initialCurrentPosition,
                initialProgress,
                actualVideoProgress,
                videoDuration,
                actualProgressTime,
                calculatedMaxTime: Math.max(initialCurrentPosition, actualProgressTime, (initialProgress / 100) * videoDuration)
              });
              
              if (initialCurrentPosition > 0) {
                playerRef.current.seekTo(initialCurrentPosition, true);
                // Set max watched time to the highest value
                const maxTime = Math.max(initialCurrentPosition, actualProgressTime);
                setMaxWatchedTime(maxTime);
                maxWatchedTimeRef.current = maxTime;
              } else if (initialProgress > 0 || actualVideoProgress > 0) {
                // Use the higher progress value
                const progressToUse = Math.max(initialProgress, actualVideoProgress);
                const resumeTime = (progressToUse / 100) * videoDuration;
                playerRef.current.seekTo(resumeTime, true);
                setMaxWatchedTime(resumeTime);
                maxWatchedTimeRef.current = resumeTime;
              }
            } catch (error) {
              console.error('[VideoPlayer] Error during resume:', error);
            }
          } else if (attempt < retries) {
            // Retry after delay
            setTimeout(() => attemptGetDuration(attempt + 1), delay);
          }
        };
        
        attemptGetDuration(1);
      };
      
      // Start trying to get duration
      getDurationWithRetry();

      // Set initial volume
      playerInstance.setVolume(volume * 100);
    } catch (error) {
      console.error('Error in onPlayerReady:', error);
      setPlayerError('Failed to initialize player');
      setIsLoading(false);
    }
  }, [initialProgress, initialCurrentPosition, onDurationChange, volume]);

  // Ref to store current max watched time for seek monitoring
  const maxWatchedTimeRef = useRef(0);
  
  // Update ref whenever maxWatchedTime changes
  useEffect(() => {
    maxWatchedTimeRef.current = maxWatchedTime;
  }, [maxWatchedTime]);
  
  // Ref to store current actualVideoProgress to avoid closure issues
  const actualWatchPercentageRef = useRef(actualVideoProgress);
  
  // Update ref whenever actualVideoProgress changes
  useEffect(() => {
    actualWatchPercentageRef.current = actualVideoProgress;
  }, [actualVideoProgress]);

  // Seek restriction monitoring
  const startSeekMonitoring = useCallback(() => {
    if (seekCheckIntervalRef.current) return;
    
    seekCheckIntervalRef.current = setInterval(() => {
      if (!playerRef.current || !isReady || !isMountedRef.current) return;
      
      try {
        // Check if player has required methods
        if (typeof playerRef.current.getCurrentTime !== 'function' || 
            typeof playerRef.current.seekTo !== 'function') {
          return;
        }
        
        const current = playerRef.current.getCurrentTime();
        const currentMaxWatchedTime = maxWatchedTimeRef.current;
        
        // Also consider actualVideoProgress when checking seek limits
        const duration = playerRef.current.getDuration();
        const actualProgressTime = duration > 0 ? (actualVideoProgress / 100) * duration : 0;
        const effectiveMaxTime = Math.max(currentMaxWatchedTime, actualProgressTime);
        
        if (current > effectiveMaxTime + 3) {
          playerRef.current.seekTo(effectiveMaxTime, true);
          ToastService.info('You can only watch up to where you\'ve already viewed');
        }
      } catch (error) {
        console.error('[VideoPlayer] Error in seek monitoring:', error);
      }
    }, 250);
  }, [isReady]);

  const stopSeekMonitoring = useCallback(() => {
    if (seekCheckIntervalRef.current) {
      clearInterval(seekCheckIntervalRef.current);
      seekCheckIntervalRef.current = null;
    }
  }, []);

  const onPlayerStateChange = useCallback((event: YouTubeEvent) => {
    const state = event.data;
    const playerStates = window.YT?.PlayerState || {
      PLAYING: 1,
      PAUSED: 2,
      ENDED: 0
    };
    
    if (state === playerStates.PLAYING) {
      setIsPlaying(true);
      
      // Notify parent component that video is playing
      if (onPlay && isMountedRef.current) {
        onPlay();
      }
      
      // Double-check duration when video starts playing
      if (playerRef.current && duration === 0) {
        const videoDuration = playerRef.current.getDuration();
        if (videoDuration && videoDuration > 0) {
          setDuration(videoDuration);
          if (onDurationChange && isMountedRef.current) {
            onDurationChange(videoDuration);
          }
        }
      }
      
      startProgressTracking();
      startSeekMonitoring();
      startHideControlsTimer();
    } else if (state === playerStates.PAUSED) {
      setIsPlaying(false);
      stopProgressTracking();
      stopSeekMonitoring();
      clearHideControlsTimer();
      setShowControls(true);
      
      if (onPause && isMountedRef.current && actualVideoProgress > 0) {
        onPause(actualVideoProgress, currentTime);
      }
    } else if (state === playerStates.ENDED) {
      setIsPlaying(false);
      stopProgressTracking();
      stopSeekMonitoring();
      setShowControls(true);
    }
  }, [duration, onDurationChange, onPause, onPlay, actualVideoProgress, currentTime, startSeekMonitoring, stopSeekMonitoring]);

  // Move function declarations before they're used
  const stopProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const onPlayerError = useCallback((event: YouTubeEvent) => {
    console.error('YouTube Player Error:', event.data);
    const errorMessage = 'Error loading video. Please try again.';
    setPlayerError(errorMessage);
    setIsLoading(false);
    ToastService.error(errorMessage);
  }, []);

  const startProgressTracking = useCallback(() => {
    if (intervalRef.current) {
      return;
    }
    intervalRef.current = setInterval(() => {
      if (!playerRef.current || !isReady || !isMountedRef.current) return;

      try {
        // Check if player has required methods
        if (typeof playerRef.current.getCurrentTime !== 'function' || 
            typeof playerRef.current.getDuration !== 'function') {
          return;
        }
        
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        
        if (current >= 0 && total && total > 0) {
          setCurrentTime(current);
          setDuration(total);
          
          // Call onDurationChange callback if duration changed
          if (onDurationChange && total > 0 && isMountedRef.current) {
            onDurationChange(total);
          }
          
          // Call onTimeUpdate callback to update parent component
          if (onTimeUpdate && isMountedRef.current) {
            onTimeUpdate(current);
          }
          
          const percentage = (current / total) * 100;
          setWatchPercentage(percentage);
          
          // Calculate actual percentage for callback
          let currentActualPercentage;
          
          if (current > maxWatchedTime) {
            currentActualPercentage = (current / total) * 100;
            setMaxWatchedTime(current);
          } else {
            // Use the actual progress from parent
            currentActualPercentage = actualVideoProgress;
          }
          if (onProgress && isMountedRef.current) {
            onProgress(percentage, currentActualPercentage);
          }

          // Check for 80% completion based on actual progress
          if (currentActualPercentage >= 80 && !hasCompletedOnce) {
            setHasCompletedOnce(true);
            if (onComplete && isMountedRef.current) {
              onComplete();
            }
            ToastService.success('Lesson completed! Next lesson unlocked.');
          }
        }
      } catch (error) {
        console.error('[VideoPlayer] Error tracking progress:', error);
        // Don't stop tracking on error, just log it
      }
    }, 1000); // Update every second
  }, [isReady, hasCompletedOnce, onComplete, onDurationChange, onTimeUpdate, onProgress, actualVideoProgress, maxWatchedTime]);

  // Auto-hide controls
  const startHideControlsTimer = () => {
    clearHideControlsTimer();
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  const clearHideControlsTimer = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  };
  
  const handleMouseMove = () => {
    setShowControls(true);
    if (isPlaying) {
      startHideControlsTimer();
    }
  };

  // Custom controls with error handling
  const handlePlayPause = useCallback(() => {
    handlePlayPauseClick();
  }, [handlePlayPauseClick]);

  const handleRewind = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    
    try {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(Math.max(0, currentTime - 10), true);
    } catch (error) {
      console.error('Error rewinding:', error);
    }
  }, [isReady]);

  const handleForward = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    
    try {
      const currentTime = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      playerRef.current.seekTo(Math.min(duration, currentTime + 10), true);
    } catch (error) {
      console.error('Error forwarding:', error);
    }
  }, [isReady]);

  const handleSpeedChange = useCallback((speed: number) => {
    if (!playerRef.current || !isReady) return;
    
    try {
      playerRef.current.setPlaybackRate(speed);
      setPlaybackRate(speed);
      setShowSettings(false);
    } catch (error) {
      console.error('Error changing playback speed:', error);
    }
  }, [isReady]);
  
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!playerRef.current || !isReady) return;
    
    try {
      playerRef.current.setVolume(newVolume * 100);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    } catch (error) {
      console.error('Error changing volume:', error);
    }
  }, [isReady]);
  
  const handleMute = useCallback(() => {
    if (!playerRef.current || !isReady) return;
    
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        if (volume === 0) setVolume(0.5);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }, [isReady, isMuted, volume]);
  
  const handleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Comprehensive cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      stopProgressTracking();
      stopSeekMonitoring();
      clearHideControlsTimer();
      
      
      // Clear player reference
      playerRef.current = null;
    };
  }, [stopSeekMonitoring]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextLesson = () => {
    if (nextLessonId && actualVideoProgress >= 80) {
      router.push(`/learn/${courseId}/${nextLessonId}`);
    }
  };

  // Error state UI
  if (playerError || !videoId) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <p className="text-red-500">{playerError || 'Invalid video URL'}</p>
        {playerError && (
          <button
            onClick={() => {
              setPlayerError(null);
              setIsLoading(true);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="video-player-container">
      <div 
        ref={containerRef}
        className={`relative bg-black overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50' : 'rounded-lg'
        }`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isPlaying) startHideControlsTimer();
        }}
      >
        {/* YouTube Player using react-youtube */}
        <div className="w-full aspect-video">
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onError={onPlayerError}
            className="w-full h-full"
            iframeClassName="w-full h-full"
          />
        </div>
        
        {/* Custom Control Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Top Controls (Mobile) */}
          {isMobile && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Go back"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="text-sm text-center flex-1 mx-4">
                  <span>{Math.round(Math.max(initialProgress, actualVideoProgress))}% watched</span>
                </div>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
          
          {/* Center Play/Pause Button */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handlePlayPause}
                className="bg-white/90 hover:bg-white rounded-full p-6 transition-all duration-200 transform hover:scale-110"
                aria-label="Play video"
              >
                <Play className="w-12 h-12 text-gray-900 ml-1" />
              </button>
            </div>
          )}
          
          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent">
            {/* Progress Bar */}
            <div className={`px-4 ${isMobile ? 'pt-4 pb-2' : 'pt-6 pb-4'}`}>
              <div className={`flex items-center text-white text-sm mb-2 ${isMobile ? 'text-xs' : ''}`}>
                <span>{formatTime(currentTime)}</span>
                <span className="mx-2">/</span>
                <span>{formatTime(duration)}</span>
                {!isMobile && (
                  <span className="ml-auto">{Math.round(Math.max(initialProgress, actualVideoProgress))}% watched</span>
                )}
              </div>
              <div 
                className="w-full bg-gray-700 rounded-full h-2 cursor-pointer hover:h-3 transition-all relative"
                onClick={(e) => {
                  if (!playerRef.current || !isReady || !duration) return;
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickPercentage = (clickX / rect.width) * 100;
                  const seekTime = (clickPercentage / 100) * duration;
                  
                  // Restrict seek to max watched time or progress
                  // Use the highest value between maxWatchedTime, initialProgress, and actualVideoProgress
                  const initialProgressTime = (initialProgress / 100) * duration;
                  const actualProgressTime = (actualVideoProgress / 100) * duration;
                  const maxAllowedTime = Math.max(maxWatchedTime, initialProgressTime, actualProgressTime);
                  
                  console.log('[VideoPlayer] Seek attempt:', {
                    clickPercentage: clickPercentage.toFixed(2) + '%',
                    seekTime: formatTime(seekTime),
                    maxWatchedTime: formatTime(maxWatchedTime),
                    actualVideoProgress: actualVideoProgress + '%',
                    maxAllowedTime: formatTime(maxAllowedTime),
                    allowed: seekTime <= maxAllowedTime
                  });
                  
                  const allowedSeekTime = Math.min(seekTime, maxAllowedTime);
                  playerRef.current.seekTo(allowedSeekTime, true);
                  
                  if (seekTime > maxAllowedTime) {
                    ToastService.info('You can only seek to previously watched content');
                  }
                }}
              >
                {/* Max watched indicator */}
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-400/30 rounded-full"
                  style={{ width: `${Math.max(initialProgress, (maxWatchedTime / duration) * 100)}%` }}
                />
                {/* Current position */}
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 relative"
                  style={{ width: `${watchPercentage}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className={`flex items-center justify-between px-4 ${isMobile ? 'pb-2' : 'pb-4'}`}>
              <div className="flex items-center space-x-2 md:space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-blue-400 transition-colors p-2"
                  aria-label="Play/Pause"
                >
                  {isPlaying ? (
                    <Pause className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
                  ) : (
                    <Play className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ml-1`} />
                  )}
                </button>
                
                <button
                  onClick={handleRewind}
                  className="text-white hover:text-blue-400 transition-colors p-2"
                  aria-label="Rewind 10s"
                >
                  <SkipBack className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </button>

                <button
                  onClick={handleForward}
                  className="text-white hover:text-blue-400 transition-colors p-2"
                  aria-label="Forward 10s"
                >
                  <SkipForward className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </button>
                
                {/* Volume Control (Desktop) */}
                {!isMobile && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleMute}
                      className="text-white hover:text-blue-400 transition-colors p-2"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 accent-blue-600"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Settings Button */}
                {!isMobile && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-white hover:text-blue-400 transition-colors p-2"
                      aria-label="Settings"
                    >
                      <Settings className="w-6 h-6" />
                    </button>
                    
                    {/* Settings Dropdown */}
                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-4 min-w-[200px]">
                        <div className="text-white text-sm space-y-3">
                          <div>
                            <label className="block mb-2">Playback Speed</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                                <button
                                  key={speed}
                                  onClick={() => handleSpeedChange(speed)}
                                  className={`px-2 py-1 rounded text-xs transition-colors ${
                                    playbackRate === speed
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-700 hover:bg-gray-600'
                                  }`}
                                >
                                  {speed}x
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Fullscreen Button (Desktop) */}
                {!isMobile && (
                  <button
                    onClick={handleFullscreen}
                    className="text-white hover:text-blue-400 transition-colors p-2"
                    aria-label="Fullscreen"
                  >
                    <Maximize className="w-6 h-6" />
                  </button>
                )}

                {/* Next Lesson Button */}
                {nextLessonId && actualVideoProgress >= 80 && (
                  <button
                    onClick={handleNextLesson}
                    className={`bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${
                      isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                    }`}
                  >
                    {isMobile ? 'Next →' : 'Next Lesson →'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Settings Panel */}
          {isMobile && showSettings && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
              <div className="bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white text-lg font-semibold">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-white hover:text-gray-400 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Playback Speed */}
                  <div>
                    <label className="block text-white text-sm mb-3">Playback Speed</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-3 py-2 rounded text-sm transition-colors ${
                            playbackRate === speed
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-white hover:bg-gray-600'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Volume */}
                  <div>
                    <label className="block text-white text-sm mb-3">Volume</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleMute}
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="flex-1 accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sequential Learning Notice */}
        {actualVideoProgress < 80 && !isMobile && (
          <div className="absolute top-4 right-4 bg-yellow-500/90 text-black px-3 py-1 rounded-lg text-sm">
            Watch 80% to unlock next lesson
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Loading video...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Don't compare callbacks since they might change on parent re-renders
export const VideoPlayer = React.memo(VideoPlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.lessonId === nextProps.lessonId &&
    prevProps.courseId === nextProps.courseId &&
    prevProps.initialProgress === nextProps.initialProgress &&
    prevProps.initialCurrentPosition === nextProps.initialCurrentPosition &&
    prevProps.nextLessonId === nextProps.nextLessonId &&
    prevProps.actualVideoProgress === nextProps.actualVideoProgress
    // Don't compare callback functions - they're handled internally with debouncing
  );
});