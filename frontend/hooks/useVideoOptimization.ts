import { useEffect, useState, useCallback, useRef } from 'react';

interface VideoOptimizationOptions {
  autoQuality?: boolean;
  preload?: boolean;
  bufferAhead?: number;
  adaptiveBitrate?: boolean;
}

interface VideoOptimizationState {
  quality: string;
  isBuffering: boolean;
  bufferHealth: number;
  networkSpeed: 'slow' | 'medium' | 'fast';
  optimalQuality: string;
}

export const useVideoOptimization = (options: VideoOptimizationOptions = {}) => {
  const {
    autoQuality = true,
    preload = true,
    bufferAhead = 30,
    adaptiveBitrate = true
  } = options;

  const [state, setState] = useState<VideoOptimizationState>({
    quality: 'auto',
    isBuffering: false,
    bufferHealth: 0,
    networkSpeed: 'medium',
    optimalQuality: 'hd720'
  });

  const networkSpeedRef = useRef<number>(0);
  const connectionRef = useRef<any>(null);

  // Detect network connection quality
  useEffect(() => {
    const detectNetworkSpeed = () => {
      // Use navigator.connection API if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        connectionRef.current = connection;
        
        const updateNetworkInfo = () => {
          const effectiveType = connection.effectiveType;
          const downlink = connection.downlink;
          
          let speed: 'slow' | 'medium' | 'fast' = 'medium';
          let quality = 'hd720';
          
          if (effectiveType === '4g' && downlink > 2) {
            speed = 'fast';
            quality = 'hd1080';
          } else if (effectiveType === '3g' || downlink < 1) {
            speed = 'slow';
            quality = 'medium';
          } else {
            speed = 'medium';
            quality = 'hd720';
          }
          
          setState(prev => ({
            ...prev,
            networkSpeed: speed,
            optimalQuality: autoQuality ? quality : prev.quality
          }));
        };
        
        updateNetworkInfo();
        connection.addEventListener('change', updateNetworkInfo);
        
        return () => {
          connection.removeEventListener('change', updateNetworkInfo);
        };
      } else {
        // Fallback: Test download speed
        const testNetworkSpeed = async () => {
          const startTime = Date.now();
          
          try {
            const response = await fetch('/api/speed-test?t=' + Date.now(), {
              method: 'HEAD',
              cache: 'no-cache'
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            let speed: 'slow' | 'medium' | 'fast';
            let quality: string;
            
            if (duration < 100) {
              speed = 'fast';
              quality = 'hd1080';
            } else if (duration > 500) {
              speed = 'slow';
              quality = 'medium';
            } else {
              speed = 'medium';
              quality = 'hd720';
            }
            
            setState(prev => ({
              ...prev,
              networkSpeed: speed,
              optimalQuality: autoQuality ? quality : prev.quality
            }));
          } catch (error) {
          }
        };
        
        testNetworkSpeed();
      }
    };
    
    detectNetworkSpeed();
  }, [autoQuality]);

  // Optimize YouTube player settings based on network conditions
  const getOptimalPlayerVars = useCallback(() => {
    const baseVars = {
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      playsinline: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined
    };

    // Adaptive quality settings
    if (adaptiveBitrate && autoQuality) {
      return {
        ...baseVars,
        vq: state.optimalQuality, // Video quality
        hd: state.networkSpeed === 'fast' ? 1 : 0, // HD preference
        // Buffer settings based on network speed
        ...(state.networkSpeed === 'slow' && {
          start: 0,
          // Force lower quality on slow connections
          vq: 'medium'
        })
      };
    }

    return baseVars;
  }, [state.networkSpeed, state.optimalQuality, adaptiveBitrate, autoQuality]);

  // Preload optimization
  const shouldPreload = useCallback((videoId: string) => {
    if (!preload) return false;
    
    // Don't preload on slow connections or low battery
    if (state.networkSpeed === 'slow') return false;
    
    // Check battery status if available
    const battery = (navigator as any).battery;
    if (battery && battery.level < 0.2) return false;
    
    return true;
  }, [preload, state.networkSpeed]);

  // Buffer health monitoring
  const updateBufferHealth = useCallback((player: any) => {
    if (!player || !player.getVideoLoadedFraction) return;
    
    const loadedFraction = player.getVideoLoadedFraction();
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration();
    
    if (duration > 0) {
      const currentProgress = currentTime / duration;
      const bufferAheadTime = (loadedFraction - currentProgress) * duration;
      
      setState(prev => ({
        ...prev,
        bufferHealth: Math.max(0, Math.min(100, (bufferAheadTime / bufferAhead) * 100)),
        isBuffering: bufferAheadTime < 5 // Less than 5 seconds ahead
      }));
    }
  }, [bufferAhead]);

  // Adaptive quality adjustment during playback
  const adjustQualityIfNeeded = useCallback((player: any) => {
    if (!player || !autoQuality || !adaptiveBitrate) return;
    
    const currentQuality = player.getPlaybackQuality();
    
    // Monitor playback stalls and adjust quality
    if (state.isBuffering && currentQuality !== 'small') {
      // Downgrade quality if buffering frequently
      const lowerQualities = ['medium', 'small'];
      const currentIndex = lowerQualities.indexOf(currentQuality);
      
      if (currentIndex === -1) {
        player.setPlaybackQuality('medium');
      } else if (currentIndex < lowerQualities.length - 1) {
        player.setPlaybackQuality(lowerQualities[currentIndex + 1]);
      }
    } else if (!state.isBuffering && state.networkSpeed === 'fast' && state.bufferHealth > 80) {
      // Upgrade quality if network is good and buffer is healthy
      if (currentQuality === 'medium') {
        player.setPlaybackQuality('hd720');
      } else if (currentQuality === 'hd720' && state.networkSpeed === 'fast') {
        player.setPlaybackQuality('hd1080');
      }
    }
  }, [autoQuality, adaptiveBitrate, state.isBuffering, state.networkSpeed, state.bufferHealth]);

  // Mobile-specific optimizations
  const getMobileOptimizations = useCallback(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    
    if (!isMobile) return {};
    
    return {
      // Reduce quality on mobile to save bandwidth
      vq: state.networkSpeed === 'fast' ? 'hd720' : 'medium',
      // Enable inline playback on iOS
      playsinline: 1,
      // Optimize for touch interfaces
      fs: 0, // Disable fullscreen button (we'll handle it custom)
      // Reduce buffer size on mobile
      bufferSize: state.networkSpeed === 'slow' ? 'small' : 'medium'
    };
  }, [state.networkSpeed]);

  return {
    state,
    getOptimalPlayerVars,
    shouldPreload,
    updateBufferHealth,
    adjustQualityIfNeeded,
    getMobileOptimizations,
    // Utility functions
    setQuality: (quality: string) => setState(prev => ({ ...prev, quality })),
    setBuffering: (isBuffering: boolean) => setState(prev => ({ ...prev, isBuffering }))
  };
};