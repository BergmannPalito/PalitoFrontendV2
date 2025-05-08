// src/features/editor/plugins/EditorToolbarPlugin.jsx

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// $getSelection, $isRangeSelection, $setSelection are NO LONGER needed here for comments
// import { nanoid } from 'nanoid'; // NO LONGER needed here for comments

import { useToolbar } from '../hooks/useToolbar';
import { useHighlightHandler } from '../../highlights/hooks/useHighlightHandler';
// useComments is still needed for overlap check
import { useComments } from '../../comments/hooks/useComments';
// Highlight context NO LONGER needed here for comment creation
// import { useHighlightContext } from '../../highlights/context/HighlightContext';
import { getRectsForSavedRange } from '../../highlights/utils/highlightOverlayHelpers'; // Still needed for overlap check

import HighlightToolbar from '../components/EditorToolbar';
import { COLOR_LIST } from '../../highlights/utils/highlightColorMap';
import { CREATE_COMMENT_COMMAND } from '../../comments/commentCommands'; // Import the command

// Helper: Check for overlap (Keep for UI disable logic)
const rectsOverlap = (a, b) =>
  !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

export default function EditorToolbarPlugin({ editorInnerDivRef, tabId }) {
  const [editor] = useLexicalComposerContext();
  const [currentColor, setCurrentColor] = useState('yellow');

  // Toolbar position and selection state
  const {
    showToolbar,
    toolbarPosition,
    isTextSelected,
    isHighlightedTextSelected,
  } = useToolbar(editorInnerDivRef, tabId);

  // Regular highlight handlers
  const { handleHighlight, handleRemoveHighlight } = useHighlightHandler(
    tabId,
    currentColor,
  );

  // Comment context needed ONLY for overlap check now
  const { threads: commentThreads } = useComments();

  /* ---------- Selection overlaps an existing anchor? ---------- */
  // This logic remains here because the *Toolbar UI* needs to know if the button should be enabled.
  const [overlapsAnchor, setOverlapsAnchor] = useState(false);

  const computeOverlap = useCallback(() => {
    if (!editor || !tabId || !isTextSelected) return false; // Added isTextSelected check here

    const domSel = window.getSelection();
    if (!domSel || domSel.rangeCount === 0) return false;
    const domRange = domSel.getRangeAt(0);
    if (domRange.collapsed) return false;

    const selRects = Array.from(domRange.getClientRects());
    let found = false;

    // Read editor state ONLY to get comment thread ranges for comparison
    editor.getEditorState().read(() => {
      commentThreads
        .filter((t) => t.tabId === tabId)
        .forEach((t) => {
          if (found) return; // Early exit if overlap found
          const anchorRects = getRectsForSavedRange(editor, t.textRange);
          selRects.forEach((sr) => {
            if (found) return;
            anchorRects.forEach((ar) => {
              if (rectsOverlap(sr, ar)) {
                found = true;
              }
            });
          });
        });
    });

    return found;
  }, [editor, tabId, commentThreads, isTextSelected]); // Added isTextSelected dependency

  useEffect(() => {
    // Only compute overlap if the toolbar is shown AND text is selected
    if (showToolbar && isTextSelected) {
      setOverlapsAnchor(computeOverlap());
    } else {
      // Reset overlap state if toolbar hidden or no text selected
      setOverlapsAnchor(false);
    }
  }, [showToolbar, isTextSelected, computeOverlap]);

  /* ---------- Toolbar Action Callbacks ---------- */
  const onHighlight = useCallback(() => editor.update(handleHighlight), [editor, handleHighlight]);
  const onRemoveHighlight = useCallback(() => editor.update(handleRemoveHighlight), [editor, handleRemoveHighlight]);
  const onColorChange = useCallback((c) => setCurrentColor(c), []);

  // NEW: Function to trigger comment creation via command
  const triggerCreateComment = useCallback(() => {
    if (editor && isTextSelected && !overlapsAnchor) {
      editor.dispatchCommand(CREATE_COMMENT_COMMAND, undefined);
    }
  }, [editor, isTextSelected, overlapsAnchor]);


  /* ---------- render ---------- */
  if (!showToolbar || !document.body) {
    return null;
  }

  return createPortal(
    <HighlightToolbar
      editor={editor} // Pass editor for potential direct actions if needed elsewhere, though less common now
      position={toolbarPosition}
      isTextSelected={isTextSelected}
      isHighlightSelected={isHighlightedTextSelected}
      onHighlight={onHighlight} // Keep regular highlight actions
      onRemoveHighlight={onRemoveHighlight} // Keep regular highlight actions
      // Pass the command dispatcher function instead of handleComment
      onComment={triggerCreateComment}
      currentColor={currentColor}
      onColorChange={onColorChange}
      palette={COLOR_LIST}
      // Button is disabled based on overlap state calculated here
      canComment={!overlapsAnchor}
    />,
    document.body,
  );
}

// PropTypes remain the same
EditorToolbarPlugin.propTypes = {
  editorInnerDivRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
  tabId: PropTypes.string,
};