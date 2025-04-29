// src/hooks/useClickOutside.js
import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside a specified element.
 *
 * @param {Function} handler - Function to call when a click outside is detected.
 * @param {boolean} [listenCapturing=true] - Whether to listen in the capturing phase.
 */
export function useClickOutside(handler, listenCapturing = true) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      // Check if the clicked element is contained within the ref'd element
      if (ref.current && !ref.current.contains(e.target)) {
        // console.log('Click outside detected');
        handler();
      }
    }

    // Use mousedown event listener - often better for this purpose than click
    document.addEventListener('mousedown', handleClick, listenCapturing);

    // Cleanup function to remove the event listener
    return () =>
      document.removeEventListener('mousedown', handleClick, listenCapturing);

  }, [handler, listenCapturing]); // Re-run effect if handler or capture flag changes

  // Return the ref to be attached to the DOM element
  return ref;
}