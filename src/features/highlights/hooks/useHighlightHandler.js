/* eslint-disable no-console */
import { useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
} from 'lexical';
import { nanoid } from 'nanoid';

import { useHighlightContext } from '../context/HighlightContext';

import {
  serializeRange,
  rangesIntersect,
  containsEntireHighlight,
  splitHighlight,
  mergeRanges,
  normaliseRange, // Ensure this is imported if used
} from '../utils/highlightUtils';


/* ------------------------------------------------------------ */
/* helper: reconcile new highlight with current list           */
/* Handles merging and splitting based on overlap and color,   */
/* EXCLUDING comment anchors from being affected by regular highlights */
/* ------------------------------------------------------------ */
function mergeAndReconcileHighlights(editor, currentHighlights, incomingHighlight) {
  const toAdd = [];
  let toRemoveIds = [];
  let currentIncoming = { ...incomingHighlight }; // Work with a copy

  // Assign ID if missing, mark as NOT comment anchor if property missing
  if (!currentIncoming.id) {
    currentIncoming.id = `hl-${nanoid(8)}`;
  }
  if (currentIncoming.isCommentAnchor === undefined) {
      currentIncoming.isCommentAnchor = false;
  }

  // Cannot reconcile if incoming is marked as a comment anchor
  // Regular highlight actions should not create comment anchors.
  if (currentIncoming.isCommentAnchor) {
    console.warn("Attempted to reconcile a comment anchor via regular highlight logic.");
    return { toAdd: [], toRemoveIds: [] };
  }

  // --- First Pass: Merge incoming with compatible existing highlights ---
  let merged = false;
  // Only consider merging with other *regular* highlights of the *same color*
  let potentialMergeCandidates = currentHighlights.filter(h =>
      !h.isCommentAnchor && // Don't merge with comment anchors
      h.color === currentIncoming.color && // Only merge same color
      h.id !== currentIncoming.id
    );

  do {
      merged = false;
      let nextMergeCandidates = [];
      for (const h of potentialMergeCandidates) {
          // Ensure mergeRanges function itself doesn't merge comment anchors inadvertently if logic changed
          const result = mergeRanges(editor, h, currentIncoming);
          if (result && !h.isCommentAnchor && !currentIncoming.isCommentAnchor) { // Double check types
              currentIncoming = { ...result, id: currentIncoming.id, isCommentAnchor: false }; // Keep incoming ID, update range/color, mark type
              toRemoveIds.push(h.id);
              merged = true;
          } else {
              nextMergeCandidates.push(h);
          }
      }
      potentialMergeCandidates = nextMergeCandidates;
  } while (merged);


  // --- Second Pass: Split existing highlights that overlap the final incoming range ---
  let finalToRemoveIds = [...toRemoveIds];
  let finalToAdd = [];

  currentHighlights.forEach((h) => {
    // Skip if already marked for removal OR if it's a comment anchor
    if (finalToRemoveIds.includes(h.id) || h.isCommentAnchor) {
      return;
    }

    // Check overlap between existing regular highlight 'h' and the final incoming regular highlight
    if (rangesIntersect(editor, h, currentIncoming)) {
        // Only split if colors are different (same colors should have merged)
        if (h.color !== currentIncoming.color) {
           finalToRemoveIds.push(h.id);
           const pieces = splitHighlight(editor, h, currentIncoming);
           // Add the remaining pieces of 'h', ensuring they are marked as regular highlights
           finalToAdd.push(...pieces.map(p => ({ ...p, id: `hl-${nanoid(8)}`, isCommentAnchor: false })));
        }
    }
  });

  // Add the final state of the incoming regular highlight
  finalToAdd.push(currentIncoming);


  // --- Cleanup ---
  const uniqueToRemoveIds = [...new Set(finalToRemoveIds)];

  const uniqueFinalToAdd = [];
  const addedRangeKeys = new Set();
  for (const item of finalToAdd) {
      const norm = normaliseRange(editor, item);
      if (!norm) continue;
      const rangeKey = `${norm.startKey}:${norm.startOffset}-${norm.endKey}:${norm.endOffset}`;
      if (!addedRangeKeys.has(rangeKey)) {
          // Ensure ID and correct anchor status
          uniqueFinalToAdd.push({...item, id: item.id || `hl-${nanoid(8)}`, isCommentAnchor: !!item.isCommentAnchor});
          addedRangeKeys.add(rangeKey);
      } else {
           console.warn("Merge/Reconcile: Duplicate range detected, skipping:", item);
      }
  }


  return { toAdd: uniqueFinalToAdd, toRemoveIds: uniqueToRemoveIds };
}


/* ------------------------------------------------------------ */
/* main hook                                                   */
/* ------------------------------------------------------------ */
export function useHighlightHandler(tabId, currentColor = 'yellow') {
  const [editor] = useLexicalComposerContext();
  const {
    highlightsByTab = {},
    addHighlight,
    removeHighlightsByIds,
  } = useHighlightContext() || {};

  /* ------------------ add / update highlight ----------------- */
  // This function is for adding/updating REGULAR highlights
  const handleHighlight = useCallback(() => {
    if (!editor || !tabId) {
        return;
    }
    // Prevent using this function to create comment anchors accidentally
    if (currentColor === 'commentAnchorBlue') {
        console.warn(`Attempted to create regular highlight with reserved color ${currentColor}`);
        return;
    }

    editor.update(
      () => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || sel.isCollapsed()) return;

        let incoming = serializeRange(sel, currentColor);
        if (!incoming) return;
        // Mark as NOT a comment anchor
        incoming.isCommentAnchor = false;

        const current = highlightsByTab[tabId] || [];
        const { toAdd, toRemoveIds } = mergeAndReconcileHighlights(
          editor,
          current,
          incoming,
        );

        if (toRemoveIds.length) removeHighlightsByIds(tabId, toRemoveIds);
        toAdd.forEach((r) => addHighlight(tabId, r)); // Add/update highlights

        $setSelection(null);
      },
      { tag: 'AddHighlight' },
    );
  }, [
    editor,
    tabId,
    currentColor,
    highlightsByTab,
    addHighlight,
    removeHighlightsByIds,
  ]);

  /* ------------------ remove part of highlight --------------- */
  // This function removes REGULAR highlights based on selection
  const handleRemoveHighlight = useCallback(() => {
    if (!editor || !tabId) return;

    editor.update(
      () => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || sel.isCollapsed()) return;

        const removalRange = serializeRange(sel); // Color doesn't matter for removal area
        if (!removalRange) return;

        const current = highlightsByTab[tabId] || [];
        const idsToRemove = [];
        const additions = []; // For pieces left after splitting

        current.forEach((h) => {
          // ***** CHECK isCommentAnchor PROPERTY *****
          if (h.isCommentAnchor) {
            // If it's a comment anchor, SKIP processing it for removal via this action.
            return;
          }
          // ***** End Check *****

          // Proceed only for non-comment highlights
          if (containsEntireHighlight(editor, removalRange, h)) {
            idsToRemove.push(h.id);
          } else if (rangesIntersect(editor, h, removalRange)) {
            idsToRemove.push(h.id);
            const pieces = splitHighlight(editor, h, removalRange);
            // Ensure remaining pieces are marked as regular highlights and get new IDs
            additions.push(...pieces.map(p => ({ ...p, id: `hl-${nanoid(8)}`, isCommentAnchor: false })));
          }
        });

        // Perform the updates
        if (idsToRemove.length) removeHighlightsByIds(tabId, idsToRemove);
        additions.forEach((r) => addHighlight(tabId, r));
        $setSelection(null); // Clear selection after removing
      },
      { tag: 'RemoveHighlight' },
    );
  }, [
    editor,
    tabId,
    highlightsByTab,
    addHighlight,
    removeHighlightsByIds,
  ]);

  return { handleHighlight, handleRemoveHighlight };
}