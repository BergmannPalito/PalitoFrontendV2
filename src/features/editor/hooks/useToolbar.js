// src/features/patents/hooks/useToolbar.js
import { useState, useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

import { useHighlightContext } from '../../highlights/context/HighlightContext';
import { serializeRange, rangesIntersect } from '../../highlights/utils/highlightUtils';

export function useToolbar(editorInnerDivRef, tabId) {
  const [editor] = useLexicalComposerContext();
  const { highlightsByTab = {} } = useHighlightContext() || {};

  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [isHighlightedTextSelected, setIsHighlightedTextSelected] = useState(false);

  const updateToolbar = useCallback(() => {
    if (!editor || !editorInnerDivRef.current || !tabId) {
      setShowToolbar(false);
      return;
    }

    const currentHighlights = highlightsByTab[tabId] || [];

    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSel = window.getSelection();
      const valid = $isRangeSelection(selection) && !selection.isCollapsed();
      setIsTextSelected(valid);

      let highlightSelected = false;
      if (valid) {
        const serialized = serializeRange(selection);
        if (serialized) {
          for (const h of currentHighlights) {
            // 🔸 pass editor as first arg
            if (rangesIntersect(editor, h, serialized)) {
              highlightSelected = true;
              break;
            }
          }
        }
      }
      setIsHighlightedTextSelected(highlightSelected);

      if (valid && nativeSel?.rangeCount) {
        const domRange = nativeSel.getRangeAt(0);
        if (!editorInnerDivRef.current.contains(domRange.commonAncestorContainer)) {
          setShowToolbar(false);
          return;
        }
        const rect = domRange.getBoundingClientRect();
        if (rect.width || rect.height) {
          const top = rect.top + window.scrollY - 46; // 36 + 10 offset
          const left = rect.left + window.scrollX + rect.width / 2 - 90; // 180/2
          setToolbarPosition({ top, left: Math.max(5, left) });
          setShowToolbar(true);
        } else setShowToolbar(false);
      } else setShowToolbar(false);
    });
  }, [editor, editorInnerDivRef, tabId, highlightsByTab]);

  useEffect(() => {
    if (!editor) return undefined;
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => editorState.read(updateToolbar)),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, () => {
        updateToolbar();
        return false;
      }, COMMAND_PRIORITY_LOW),
    );
    return () => unregister();
  }, [editor, updateToolbar]);

  const hideToolbar = useCallback(() => setShowToolbar(false), []);

  return { showToolbar, toolbarPosition, isTextSelected, isHighlightedTextSelected, hideToolbar };
}
