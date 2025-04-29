// src/hooks/useMediaQuery.js
import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    // Check initial state safely for SSR or environments without `window`
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false; // Default value if window is not available
  });

  useEffect(() => {
    // Ensure window is defined before proceeding
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    const listener = (event) => {
      setMatches(event.matches);
    };

    // Add listener
    // Starting from Safari 14, Chrome 91, Firefox 88: addEventListener is preferred
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
    }


    // Set initial state correctly after mount
    setMatches(mediaQueryList.matches);

    // Cleanup listener on component unmount
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, [query]); // Re-run effect if query changes

  return matches;
}