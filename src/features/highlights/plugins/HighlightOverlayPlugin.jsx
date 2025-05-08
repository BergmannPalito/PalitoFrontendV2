// src/features/highlights/plugins/HighlightOverlayPlugin.jsx
// (or src/features/patents/components/Layout/plugins/HighlightOverlayPlugin.jsx if that's the correct location)

import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx'; // Import clsx for conditional classes

// Adjust context/util paths based on this file's actual location
import { useHighlightContext } from '../context/HighlightContext';
import { getRectsForSavedRange } from '../utils/highlightOverlayHelpers';
import { colorToBgClass } from '../utils/highlightColorMap';

/**
 * Renders visual overlays for highlights stored in HighlightContext.
 * Ensures comment anchors appear visually above regular highlights using z-index.
 */
export default function HighlightOverlayPlugin({
  editorInnerDivRef, // Ref to the scrollable container inside the editor
  tabId,            // ID of the current tab/document
  isActive,         // Whether the parent editor pane is currently visible/active
}) {
  const [editor] = useLexicalComposerContext();
  const { highlightsByTab = {} } = useHighlightContext() || {};
  // State holds the calculated rectangles to render
  const [highlightRects, setHighlightRects] = useState([]);
  // Ref to store the bounding client rect of the container for offset calculations
  const containerRectRef = useRef(null);

  /* ————— calculate rects ————— */
  const _recalc = useCallback(() => {
    // Ensure all dependencies are available and the pane is active
    if (!editor || !tabId || !editorInnerDivRef.current || !isActive) {
      // Clear rects if not active to prevent showing stale highlights briefly
      if (!isActive && highlightRects.length > 0) {
         setHighlightRects([]);
      }
      return;
    }

    const scrollContainer = editorInnerDivRef.current;
    containerRectRef.current = scrollContainer.getBoundingClientRect();
    const { top: containerTop, left: containerLeft } = containerRectRef.current;
    const { scrollTop, scrollLeft } = scrollContainer; // Get current scroll position

    const newRects = [];
    const currentHighlights = highlightsByTab[tabId] || [];

    // Iterate through highlights stored in context for the current tab
    currentHighlights.forEach((savedHighlight) => {
      // Get DOM rectangles for the highlight's range
      const rects = getRectsForSavedRange(editor, savedHighlight);
      rects.forEach((r, i) => {
        // Ignore tiny or invalid rectangles
        if (r.width < 0.5 || r.height < 0.5) return;

        // Create an object for rendering, including position, size, color, and the anchor flag
        newRects.push({
          id: `${savedHighlight.id}-${i}`, // Unique key for each rect fragment
          top: r.top - containerTop + scrollTop, // Adjust for container offset and scroll
          left: r.left - containerLeft + scrollLeft, // Adjust for container offset and scroll
          width: r.width,
          height: r.height,
          color: savedHighlight.color || 'yellow', // Use stored color or default
          isCommentAnchor: !!savedHighlight.isCommentAnchor, // <<< Make sure flag is included
        });
      });
    });

    // Update state only if the calculated data has actually changed
    if (JSON.stringify(highlightRects) !== JSON.stringify(newRects)) {
      setHighlightRects(newRects);
    }
    // Dependencies ensure recalc runs when needed
  }, [editor, tabId, editorInnerDivRef, isActive, highlightsByTab, highlightRects]);

  /* Debounced version for frequent updates (scroll/resize/editor changes) */
  const recalcDebounced = useDebouncedCallback(_recalc, 100); // 100ms debounce

  /* Recalculate on editor state updates */
  useEffect(() => {
    if (!editor) return () => {};
    const unregister = editor.registerUpdateListener(recalcDebounced);
    return () => unregister(); // Cleanup listener
  }, [editor, recalcDebounced]);

  /* Recalculate if the list of highlights in context changes */
  useEffect(() => {
    // _recalc checks isActive internally, so just call debounced version
    recalcDebounced();
  }, [highlightsByTab, tabId, recalcDebounced]);

  /* Recalculate on container scroll or window resize */
  useEffect(() => {
    const container = editorInnerDivRef.current;
    if (!container) return () => {};
    // Handler to update container rect ref and trigger recalc
    const sync = () => {
      if (editorInnerDivRef.current) { // Ensure ref still exists
          containerRectRef.current = editorInnerDivRef.current.getBoundingClientRect();
          recalcDebounced();
      }
    };
    // Use passive scroll listener for performance
    container.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync(); // Initial calculation on mount
    // Cleanup listeners
    return () => {
      container.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [editorInnerDivRef, recalcDebounced]);

  /* Recalculate *immediately* (no debounce) when pane becomes active/inactive */
  useEffect(() => {
    if (isActive) {
      _recalc(); // Use non-debounced for immediate visual update
    } else {
      // Clear the rectangles when the pane becomes inactive
      setHighlightRects([]);
    }
  }, [isActive, _recalc]); // Depend on isActive and the memoized _recalc function

  /* --- Render Logic --- */

  // Get the DOM element to portal into (the editor's inner scrollable div)
  const portalTarget = editorInnerDivRef.current;

  // Don't render the portal if the target isn't available or the pane isn't active
  if (!portalTarget || !isActive) {
    return null;
  }

  // Render the highlight overlay divs into the portal target
  return createPortal(
    <>
      {highlightRects.map((rect) => (
        <div
          key={rect.id} // React key for each rect fragment
          className={clsx(
            'absolute rounded-sm pointer-events-none', // Base positioning and styling
            colorToBgClass[rect.color] || colorToBgClass.yellow, // Dynamic background color
            // ***** Conditional z-index *****
            rect.isCommentAnchor ? 'z-10' : 'z-0'
            // ***** End Conditional z-index *****
          )}
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
          aria-hidden="true" // Hide from accessibility tree
        />
      ))}
    </>,
    portalTarget // Render inside the editor's inner div
  );
}

// PropTypes definition
HighlightOverlayPlugin.propTypes = {
  editorInnerDivRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
  tabId: PropTypes.string,
  isActive: PropTypes.bool,
};

// Default props
HighlightOverlayPlugin.defaultProps = {
  tabId: null,
  isActive: false,
};