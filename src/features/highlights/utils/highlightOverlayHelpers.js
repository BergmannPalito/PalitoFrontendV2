import { $isRangeSelection } from 'lexical';
import {
  createDOMRange,
  createRectsFromDOMRange,
} from '@lexical/selection';

import { deserializeRange } from './highlightUtils';

/**
 * Returns an array of DOMRects (one per visual line fragment) for a
 * serialized highlight stored in HighlightContext.
 */
export function getRectsForSavedRange(editor, savedRange) {
  let rects = [];

  editor.getEditorState().read(() => {
    const selection = deserializeRange(savedRange);
    if (!selection || !$isRangeSelection(selection) || selection.isCollapsed()) {
      return;
    }

    const domRange = createDOMRange(
      editor,
      selection.anchor.getNode(),
      selection.anchor.offset,
      selection.focus.getNode(),
      selection.focus.offset,
    );
    if (!domRange) return;

    rects = createRectsFromDOMRange(editor, domRange);
  });

  return rects;
}
