// src/features/editor/plugins/EditorToolbarPlugin.jsx

import React, { useCallback, useEffect, useState, useMemo } from 'react'; // Added useMemo
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
  const computeOverlap = useCallback(() => {
    if (!editor || !tabId || !isTextSelected) {
      return false;
    }

    const domSel = window.getSelection();
    let foundOverlap = false;

    if (domSel && domSel.rangeCount > 0) {
      const domRange = domSel.getRangeAt(0);
      if (!domRange.collapsed) {
        const selRects = Array.from(domRange.getClientRects());

        editor.getEditorState().read(() => {
          (commentThreads || [])
            .filter((t) => t.tabId === tabId && t.textRange)
            .forEach((t) => {
              if (foundOverlap) return;
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
                console.warn(`[EditorToolbarPlugin] Error calculating overlap rects for thread ${t.id}:`, e);
              }
            });
        });
      }
    }
    return foundOverlap;
  }, [editor, tabId, commentThreads, isTextSelected]);

  // Determine the value for overlapsAnchor using useMemo.
  // This will only recompute if showToolbar, isTextSelected, or the actual computeOverlap function ref changes.
  const newOverlapStatus = useMemo(() => {
    if (showToolbar && isTextSelected) {
      return computeOverlap();
    }
    return false;
  }, [showToolbar, isTextSelected, computeOverlap]);

  // Effect to update the `overlapsAnchor` state.
  // This effect now only runs if newOverlapStatus (the boolean value) actually changes.
  useEffect(() => {
    setOverlapsAnchor(newOverlapStatus);
  }, [newOverlapStatus]); // Only re-run if the actual boolean overlap status changes.


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
      canComment={!overlapsAnchor}
    />,
    document.body,
  );
}

EditorToolbarPlugin.propTypes = {
  editorInnerDivRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
  tabId: PropTypes.string,
};

EditorToolbarPlugin.defaultProps = {
  tabId: null,
};