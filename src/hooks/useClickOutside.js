// src/hooks/useClickOutside.js
import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside a specified element.
 *
 * @param {Function} handler - Function to call when a click outside is detected. It will receive the event object as an argument.
 * @param {boolean} [listenCapturing=true] - Whether to listen in the capturing phase.
 */
export function useClickOutside(handler, listenCapturing = true) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { // The event object 'e' is received here
      // --- DEBUG LOGS ---
      // console.log('[useClickOutside] handleClick fired. Target:', e.target);
      if (ref.current) {
          // console.log('[useClickOutside] Ref exists. Checking contains...');
          const isInside = ref.current.contains(e.target);
          // console.log(`[useClickOutside] ref.current.contains(e.target): ${isInside}`);
          // --- END DEBUG LOGS ---

          // Check if the clicked element is contained within the ref'd element
          if (!isInside) {
            // console.log('[useClickOutside] Click detected OUTSIDE ref element. Calling handler.');
            // --- FIX: Pass the event object 'e' to the handler ---
            handler(e);
            // --- END FIX ---
          } else {
            // console.log('[useClickOutside] Click detected INSIDE ref element. Doing nothing.');
          }
      } else {
         // console.log('[useClickOutside] Ref is null or undefined.');
      }
    }

    // Use mousedown event listener
    // console.log('[useClickOutside] Adding event listener.');
    document.addEventListener('mousedown', handleClick, listenCapturing);

    // Cleanup function to remove the event listener
    return () => {
      // console.log('[useClickOutside] Removing event listener.');
      document.removeEventListener('mousedown', handleClick, listenCapturing);
    }

  }, [handler, listenCapturing]); // Re-run effect if handler or capture flag changes

  // Return the ref to be attached to the DOM element
  return ref;
}