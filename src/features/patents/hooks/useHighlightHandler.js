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
} from '../utils/highlightUtils';

/* ------------------------------------------------------------ */
/*  helper: reconcile new highlight with current list           */
/* ------------------------------------------------------------ */
function mergeAndReconcileHighlights(editor, current, incoming) {
  const toAdd = [];
  const toRemoveIds = [];

  // first pass: merge same‑color touching highlights into `incoming`
  current.forEach((h) => {
    const merged = mergeRanges(editor, h, incoming);
    if (merged) {
      incoming = merged;
      toRemoveIds.push(h.id);
    }
  });

  // second pass: split any different‑colored highlight that overlaps `incoming`
  current.forEach((h) => {
    if (h.color !== incoming.color && rangesIntersect(editor, h, incoming)) {
      toRemoveIds.push(h.id);
      const pieces = splitHighlight(editor, h, incoming);
      toAdd.push(...pieces);
    }
  });

  toAdd.push(incoming);
  return { toAdd, toRemoveIds };
}

/* ------------------------------------------------------------ */
/*  main hook                                                   */
/* ------------------------------------------------------------ */

export function useHighlightHandler(tabId, currentColor = 'yellow') {
  const [editor] = useLexicalComposerContext();
  const {
    highlightsByTab = {},
    addHighlight,
    removeHighlightsByIds,
  } = useHighlightContext() || {};

  /* ------------------ add / update highlight ----------------- */
  const handleHighlight = useCallback(() => {
    if (!editor || !tabId) return;

    editor.update(
      () => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || sel.isCollapsed()) return;

        let incoming = serializeRange(sel, currentColor);
        if (!incoming) return;
        incoming.id = `hl-${nanoid(8)}`;

        const current = highlightsByTab[tabId] || [];
        const { toAdd, toRemoveIds } = mergeAndReconcileHighlights(
          editor,
          current,
          incoming,
        );

        if (toRemoveIds.length) removeHighlightsByIds(tabId, toRemoveIds);
        toAdd.forEach((r) => addHighlight(tabId, { ...r, id: r.id || `hl-${nanoid(8)}` }));
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
  const handleRemoveHighlight = useCallback(() => {
    if (!editor || !tabId) return;

    editor.update(
      () => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || sel.isCollapsed()) return;

        const removal = serializeRange(sel, currentColor);
        if (!removal) return;

        const current = highlightsByTab[tabId] || [];
        const idsToRemove = [];
        const additions = [];

        current.forEach((h) => {
          if (containsEntireHighlight(editor, removal, h)) {
            idsToRemove.push(h.id);
          } else if (rangesIntersect(editor, h, removal)) {
            idsToRemove.push(h.id);
            additions.push(...splitHighlight(editor, h, removal));
          }
        });

        if (idsToRemove.length) removeHighlightsByIds(tabId, idsToRemove);
        additions.forEach((r) => addHighlight(tabId, { ...r, id: `hl-${nanoid(8)}` }));
        $setSelection(null);
      },
      { tag: 'RemoveHighlight' },
    );
  }, [
    editor,
    tabId,
    currentColor,
    highlightsByTab,
    addHighlight,
    removeHighlightsByIds,
  ]);

  return { handleHighlight, handleRemoveHighlight };
}
