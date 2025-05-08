// src/features/comments/plugins/CommentsPlugin.jsx
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $setSelection } from 'lexical';
import { nanoid } from 'nanoid';

import { useComments } from '../hooks/useComments';
import { useHighlightContext } from '../../highlights/context/HighlightContext';
import { getRectsForSavedRange } from '../../highlights/utils/highlightOverlayHelpers';
import { CREATE_COMMENT_COMMAND } from '../commentCommands';

const rectsOverlap = (a, b) =>
  !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

export default function CommentsPlugin({ tabId }) {
  const [editor] = useLexicalComposerContext();
  const { dispatch: dispatchComment, threads: commentThreads } = useComments();
  const { highlightsByTab = {}, addHighlight, removeHighlightsByIds } = useHighlightContext();

  useEffect(() => {
    if (!editor || !tabId) return;

    const unregisterCommand = editor.registerCommand(
      CREATE_COMMENT_COMMAND,
      () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || selection.isCollapsed()) return true;

          // --- Overlap Check (ensure selection doesn't overlap existing comment anchors) ---
          let overlapsExistingAnchor = false;
          const domSel = window.getSelection();
          if (domSel?.rangeCount > 0) {
            const domRange = domSel.getRangeAt(0);
            const selRects = Array.from(domRange.getClientRects());

            // Check against comment thread ranges stored in CommentsContext
            (commentThreads || [])
              .filter((t) => t.tabId === tabId && t.textRange)
              .forEach((t) => {
                if (overlapsExistingAnchor) return;
                const anchorRects = getRectsForSavedRange(editor, t.textRange);
                selRects.forEach((sr) => {
                  if (overlapsExistingAnchor) return;
                  anchorRects.forEach((ar) => {
                    if (rectsOverlap(sr, ar)) {
                      overlapsExistingAnchor = true;
                    }
                  });
                });
              });
              
            // Optional: Check against highlights context as a fallback (if necessary)
             (highlightsByTab[tabId] || [])
                .filter(h => h.isCommentAnchor) // Check existing highlights marked as anchors
                .forEach(h => {
                   if (overlapsExistingAnchor) return;
                   const anchorRects = getRectsForSavedRange(editor, h);
                   selRects.forEach((sr) => {
                      if (overlapsExistingAnchor) return;
                       anchorRects.forEach((ar) => {
                         if (rectsOverlap(sr, ar)) {
                            overlapsExistingAnchor = true;
                         }
                       });
                   });
                });

            if (overlapsExistingAnchor) {
              console.warn('[CommentsPlugin] Selection overlaps existing comment anchor. Aborting.');
              $setSelection(null);
              return true; // Command handled, but no comment created
            }
          }
          // --- End Overlap Check ---

          const textSnippet = selection.getTextContent().slice(0, 50);
          // Define the anchor range with the metadata property
          const anchorRange = {
            anchorKey: selection.anchor.key,
            anchorOffset: selection.anchor.offset,
            focusKey: selection.focus.key,
            focusOffset: selection.focus.offset,
            id: `comment-highlight-${nanoid(7)}`,
            color: 'commentAnchorBlue', // Default visual style (can be overridden by theme)
            isCommentAnchor: true,      // ***** ADD THIS PROPERTY *****
          };

          // Remove overlapping regular highlights
          let originalHighlight = null;
          if (domSel?.rangeCount > 0) {
            const domRange = domSel.getRangeAt(0);
            const selRects = Array.from(domRange.getClientRects());
            const regularHighlights = (highlightsByTab[tabId] || []).filter(h => !h.isCommentAnchor); // Only check non-comment highlights

            regularHighlights.forEach((h) => {
              if (originalHighlight) return; // Only replace one
              const hRects = getRectsForSavedRange(editor, h);
              const overlap = selRects.some((sr) => hRects.some((hr) => rectsOverlap(sr, hr)));
              if (overlap) {
                originalHighlight = h;
                removeHighlightsByIds(tabId, [h.id]);
              }
            });
          }

          // Add the visual anchor highlight (now includes isCommentAnchor: true)
          // This range object will be used by HighlightOverlayPlugin
          addHighlight(tabId, anchorRange);

          // Add the comment thread data to CommentsContext
          dispatchComment({
            type: 'ADD_COMMENT',
            payload: {
              tabId,
              textRange: anchorRange, // Pass the same range object, including isCommentAnchor
              textSnippet,
              text: '',
              author: 'Current User',
              originalHighlight,
            },
          });

          $setSelection(null);
        });
        return true; // Command handled
      },
      4 // Low priority
    );

    return () => {
      unregisterCommand();
    };
  }, [editor, tabId, dispatchComment, addHighlight, removeHighlightsByIds, highlightsByTab, commentThreads]);

  return null;
}