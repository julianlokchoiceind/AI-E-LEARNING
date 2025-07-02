'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Settings, X } from 'lucide-react';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const state = event.data;
    
    if (state === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      startProgressTracking();
      startHideControlsTimer();
    } else if (state === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      stopProgressTracking();
      clearHideControlsTimer();
      setShowControls(true);
    } else if (state === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      stopProgressTracking();
      setShowControls(true);
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
    setPlaybackRate(speed);
    setShowSettings(false);
  };
  
  const handleVolumeChange = (newVolume: number) => {
    if (!player) return;
    player.setVolume(newVolume * 100);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const handleMute = () => {
    if (!player) return;
    
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };
  
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
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {/* YouTube Player */}
        <div ref={playerRef} className="w-full aspect-video" />
        
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
                  <span>{Math.round(watchPercentage)}% watched</span>
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
                  <span className="ml-auto">{Math.round(watchPercentage)}% watched</span>
                )}
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 cursor-pointer hover:h-3 transition-all">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
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
                {nextLessonId && watchPercentage >= 80 && (
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
        {watchPercentage < 80 && !isMobile && (
          <div className="absolute top-4 right-4 bg-yellow-500/90 text-black px-3 py-1 rounded-lg text-sm">
            Watch 80% to unlock next lesson
          </div>
        )}
        
        {/* Loading Indicator */}
        {!isReady && (
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