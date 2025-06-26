'use client';

import React, { useEffect, useState, useRef } from 'react';

interface ResponsiveVideoContainerProps {
  children: React.ReactNode;
  aspectRatio?: number; // width/height ratio, default 16/9
  maxWidth?: string;
  className?: string;
}

export const ResponsiveVideoContainer: React.FC<ResponsiveVideoContainerProps> = ({
  children,
  aspectRatio = 16 / 9,
  maxWidth = '100%',
  className = ''
}) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = width / aspectRatio;
        
        setContainerSize({ width, height });
      }
    };

    updateSize();
    
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectRatio]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ 
        maxWidth,
        aspectRatio: `${aspectRatio}`,
      }}
    >
      <div className="absolute inset-0 w-full h-full">
        {children}
      </div>
    </div>
  );
};

// Preset container components for common use cases
export const StandardVideoContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ResponsiveVideoContainer 
    aspectRatio={16 / 9} 
    className={className}
  >
    {children}
  </ResponsiveVideoContainer>
);

export const SquareVideoContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ResponsiveVideoContainer 
    aspectRatio={1} 
    className={className}
  >
    {children}
  </ResponsiveVideoContainer>
);

export const WideVideoContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <ResponsiveVideoContainer 
    aspectRatio={21 / 9} 
    className={className}
  >
    {children}
  </ResponsiveVideoContainer>
);