/**
 * MawResponsive - Wrapper that detects screen size and shows appropriate version
 */

import React, { useState, useEffect } from 'react';
import MawNew from './MawNew';
import MawMobileOptimized from './MawMobileOptimized';

export default function MawResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      // Check screen width and touch capability
      const isMobileWidth = window.innerWidth <= 768;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider it mobile if narrow screen OR touch device with reasonable width
      const mobile = isMobileWidth || (isTouchDevice && window.innerWidth <= 1024);
      
      setIsMobile(mobile);
      setIsLoading(false);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show loading while determining device type
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-200">
        <h1 className="text-4xl mb-2">🩸 The Maw</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // Debug info (remove in production)
  console.log('🖥️ Device detection:', {
    isMobile,
    width: window.innerWidth,
    height: window.innerHeight,
    touchDevice: 'ontouchstart' in window
  });

  // Show appropriate version
  return isMobile ? <MawMobileOptimized /> : <MawNew />;
}