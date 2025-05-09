// src/features/editor/plugins/EditorToolbarPlugin.jsx

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { useToolbar } from '../hooks/useToolbar';
import { useHighlightHandler } from '../../highlights/hooks/useHighlightHandler';
import { useComments } from '../../comments/hooks/useComments';
import { getRectsForSavedRange } from '../../highlights/utils/highlightOverlayHelpers';

import HighlightToolbar from '../components/EditorToolbar';
import { COLOR_LIST } from '../../highlights/utils/highlightColorMap';
import { CREATE_COMMENT_COMMAND } from '../../comments/commentCommands';

// Helper function to check if two DOMRects overlap
const rectsOverlap = (a, b) =>
  !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

export default function EditorToolbarPlugin({ editorInnerDivRef, tabId }) {
  const [editor] = useLexicalComposerContext();
  const [currentColor, setCurrentColor] = useState('yellow');

  // Custom hook to manage toolbar visibility and position based on selection
  const {
    showToolbar,
    toolbarPosition,
    isTextSelected,
    isHighlightedTextSelected,
  } = useToolbar(editorInnerDivRef, tabId);

  // Custom hook for handling highlight/unhighlight actions
  const { handleHighlight, handleRemoveHighlight } = useHighlightHandler(
    tabId,
    currentColor,
  );

  // Access comment threads for overlap detection
  const { threads: commentThreads } = useComments();

  // State to track if the current text selection overlaps an existing comment anchor
  const [overlapsAnchor, setOverlapsAnchor] = useState(false);

  // Memoized function to compute if the current selection overlaps any comment anchors.
  // This is extracted for readability and is memoized to prevent unnecessary recalculations
  // if its dependencies haven't changed.
  const computeOverlap = useCallback(() => {
    // Requires an active editor, tabId, and a text selection to proceed.
    if (!editor || !tabId || !isTextSelected) {
      return false;
    }

    const domSel = window.getSelection();
    let foundOverlap = false;

    if (domSel && domSel.rangeCount > 0) {
      const domRange = domSel.getRangeAt(0);
      if (!domRange.collapsed) {
        const selRects = Array.from(domRange.getClientRects());

        // Access editor state in a read-only transaction to get comment thread ranges
        editor.getEditorState().read(() => {
          (commentThreads || []) // Ensure commentThreads is an array
            .filter((t) => t.tabId === tabId && t.textRange) // Process relevant threads with valid text ranges
            .forEach((t) => {
              if (foundOverlap) return; // Early exit if overlap is already found
              try {
                const anchorRects = getRectsForSavedRange(editor, t.textRange);
                selRects.forEach((sr) => {
                  if (foundOverlap) return;
                  anchorRects.forEach((ar) => {
                    if (rectsOverlap(sr, ar)) {
                      foundOverlap = true;
                    }
                  });
                });
              } catch (e) {
                // Log potential errors during rectangle calculation for a specific thread
                console.warn(`[EditorToolbarPlugin] Error calculating overlap rects for thread ${t.id}:`, e);
              }
            });
        });
      }
    }
    return foundOverlap;
  }, [editor, tabId, commentThreads, isTextSelected]); // Dependencies for the overlap calculation logic

  // Effect to update the `overlapsAnchor` state.
  // This effect runs when the toolbar's visibility, text selection status,
  // or the `computeOverlap` function (if its underlying dependencies change) is updated.
  useEffect(() => {
    if (showToolbar && isTextSelected) {
      const newOverlapStatus = computeOverlap();
      // Conditional State Guard: Only update state if the calculated value actually differs
      // from the current state. This is crucial for preventing infinite render loops.
      // Uses functional update form to ensure it's based on the latest state.
      setOverlapsAnchor((currentOverlap) => {
        if (currentOverlap !== newOverlapStatus) {
          return newOverlapStatus;
        }
        return currentOverlap;
      });
    } else {
      // If toolbar is not shown or no text is selected, reset the overlap status.
      // Conditional State Guard: Only update state if it's not already false.
      setOverlapsAnchor((currentOverlap) => {
        if (currentOverlap) {
          return false;
        }
        return currentOverlap;
      });
    }
  }, [showToolbar, isTextSelected, computeOverlap]); // Dependencies that trigger re-evaluation.

  /* ---------- Toolbar Action Callbacks ---------- */
  const onHighlight = useCallback(() => editor.update(handleHighlight), [editor, handleHighlight]);
  const onRemoveHighlight = useCallback(() => editor.update(handleRemoveHighlight), [editor, handleRemoveHighlight]);
  const onColorChange = useCallback((c) => setCurrentColor(c), []);

  // Callback to dispatch the command for creating a new comment
  const triggerCreateComment = useCallback(() => {
    if (editor && isTextSelected && !overlapsAnchor) {
      editor.dispatchCommand(CREATE_COMMENT_COMMAND, undefined);
    }
  }, [editor, isTextSelected, overlapsAnchor]);


  /* ---------- Render Toolbar ---------- */
  // Do not render the toolbar if it's not supposed to be shown or if document.body is unavailable (SSR guard)
  if (!showToolbar || !document.body) {
    return null;
  }

  return createPortal(
    <HighlightToolbar
      editor={editor}
      position={toolbarPosition}
      isTextSelected={isTextSelected}
      isHighlightSelected={isHighlightedTextSelected}
      onHighlight={onHighlight}
      onRemoveHighlight={onRemoveHighlight}
      onComment={triggerCreateComment}
      currentColor={currentColor}
      onColorChange={onColorChange}
      palette={COLOR_LIST}
      // Disable comment button if selection overlaps an existing anchor
      canComment={!overlapsAnchor}
    />,
    document.body,
  );
}

// PropTypes definition for the component
EditorToolbarPlugin.propTypes = {
  editorInnerDivRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
  // tabId is used to scope comments and highlights; it's optional but highly recommended.
  tabId: PropTypes.string,
};

// Default props for the component
// Ensures tabId defaults to null if not provided, making checks like `if (tabId)` safe.
EditorToolbarPlugin.defaultProps = {
  tabId: null,
};