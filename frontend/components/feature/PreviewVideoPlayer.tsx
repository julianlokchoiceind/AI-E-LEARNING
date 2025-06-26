'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface PreviewVideoPlayerProps {
  videoUrl: string;
  title: string;
  className?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const PreviewVideoPlayer: React.FC<PreviewVideoPlayerProps> = ({
  videoUrl,
  title,
  className = ""
}) => {
  const [player, setPlayer] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  const videoId = getYouTubeVideoId(videoUrl);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!videoId || !playerRef.current) return;

    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 0, // Disable YouTube controls
        disablekb: 1,
        fs: 0, // Disable fullscreen
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        start: 0,
        end: 300, // Limit preview to 5 minutes
      },
      events: {
        onReady: (event: any) => {
          setPlayer(event.target);
          setIsReady(true);
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            startHideControlsTimer();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            clearHideControlsTimer();
            setShowControls(true);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            setShowControls(true);
          }
        },
      },
    });
  };

  const startHideControlsTimer = () => {
    clearHideControlsTimer();
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // Hide controls after 3 seconds
  };

  const clearHideControlsTimer = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (!player || !isReady) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (isPlaying) {
      startHideControlsTimer();
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      startHideControlsTimer();
    }
  };

  if (!videoId) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-white text-center">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-60" />
            <p className="text-lg font-medium">Course Preview</p>
            <p className="text-sm opacity-80">Video preview not available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video Player */}
      <div className="aspect-video">
        <div ref={playerRef} className="w-full h-full" />
      </div>

      {/* Custom Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handlePlayPause}
      >
        {/* Play/Pause Button */}
        <button
          className={`bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all duration-200 transform hover:scale-110 ${
            isMobile ? 'p-3' : 'p-4'
          }`}
          onClick={handlePlayPause}
        >
          {isPlaying ? (
            <Pause className={`text-gray-900 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          ) : (
            <Play className={`text-gray-900 ml-1 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          )}
        </button>

        {/* Preview Badge */}
        <div className={`absolute ${isMobile ? 'top-2 left-2' : 'top-4 left-4'}`}>
          <span className={`bg-blue-600 text-white rounded-full font-medium ${
            isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'
          }`}>
            Preview
          </span>
        </div>

        {/* Preview Time Limit */}
        <div className={`absolute ${isMobile ? 'top-2 right-2' : 'top-4 right-4'}`}>
          <span className={`bg-black bg-opacity-60 text-white rounded-full ${
            isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'
          }`}>
            5 min preview
          </span>
        </div>

        {/* Bottom Controls */}
        <div className={`absolute left-4 right-4 flex items-center justify-between ${
          isMobile ? 'bottom-2' : 'bottom-4'
        }`}>
          <div className="flex items-center gap-2 text-white">
            <Volume2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} truncate max-w-[120px] md:max-w-none`}>
              {title}
            </span>
          </div>
          
          {!isMobile && (
            <div className="text-white text-sm">
              Preview Mode
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm">Loading preview...</p>
          </div>
        </div>
      )}
    </div>
  );
};