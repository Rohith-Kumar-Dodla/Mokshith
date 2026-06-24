import { useEffect, useState } from 'react';

// Simple viewport hook: isMobile <768, isTablet 768-1023, isDesktop >=1024
export default function useViewport() {
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') return { isMobile: false, isTablet: false, isDesktop: true };
    const w = window.innerWidth;
    return { isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024 };
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setSize({ isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024 });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return size;
}

