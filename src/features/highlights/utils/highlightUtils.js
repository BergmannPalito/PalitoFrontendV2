/* eslint-disable no-console */
import {
    $getNodeByKey,
    $createRangeSelection,
    $isTextNode,
    $isRangeSelection,
  } from 'lexical';
  import { createDOMRange } from '@lexical/selection';



/* -------------------------------------------------------------- */
/*  Runtime helper: extract {editor, a, b} from any call pattern   */
/* -------------------------------------------------------------- */
function parseArgs(fnName, args) {
      if (args.length === 3) {
        const [editor, a, b] = args;
        return { editor, a, b };
      }
      if (args.length === 2) {
        console.warn(
          `[highlightUtils] ${fnName} called without 'editor' — ` +
          'please update the call site to pass it in.  Falling back to no‑op.',
        );
        return { editor: null, a: args[0], b: args[1] };
      }
      throw new Error(`[highlightUtils] ${fnName} received wrong arg count`);
    }
  /* -------------------------------------------------------------------------- */
  /*  Point helpers                                                             */
  /* -------------------------------------------------------------------------- */
  
  /**
   * Compare two (key, offset) points in DOM order.
   * Returns -1 if A < B, 0 if equal, 1 if A > B.
   */
  export function comparePoints(
    editor,
    { key: keyA, offset: offA },
    { key: keyB, offset: offB },
  ) {
    if (keyA === keyB && offA === offB) return 0;
    const nodeA = $getNodeByKey(keyA);
    const nodeB = $getNodeByKey(keyB);
    if (!nodeA || !nodeB) return 0;
  
    const rangeA = createDOMRange(editor, nodeA, offA, nodeA, offA);
    const rangeB = createDOMRange(editor, nodeB, offB, nodeB, offB);
    if (!rangeA || !rangeB) return 0;
  
    return rangeA.compareBoundaryPoints(Range.START_TO_START, rangeB);
  }
  
  /** normalises a serialized range => {startKey, startOffset, endKey, endOffset} */
  export function normaliseRange(editor, r) {
    if (!r) return null;
    return comparePoints(
      editor,
      { key: r.anchorKey, offset: r.anchorOffset },
      { key: r.focusKey, offset: r.focusOffset },
    ) <= 0
      ? {
          startKey: r.anchorKey,
          startOffset: r.anchorOffset,
          endKey: r.focusKey,
          endOffset: r.focusOffset,
        }
      : {
          startKey: r.focusKey,
          startOffset: r.focusOffset,
          endKey: r.anchorKey,
          endOffset: r.anchorOffset,
        };
  }
  
  /* -------------------------------------------------------------------------- */
  /*  Basic serialise / deserialise                                             */
  /* -------------------------------------------------------------------------- */
  
  export function serializeRange(selection, color = 'yellow') {
    if (!$isRangeSelection(selection) || selection.isCollapsed()) return null;
    return {
      anchorKey: selection.anchor.key,
      anchorOffset: selection.anchor.offset,
      focusKey: selection.focus.key,
      focusOffset: selection.focus.offset,
      color,
    };
  }
  
  export function deserializeRange(serialized) {
    if (!serialized) return null;
    try {
      const { anchorKey, anchorOffset, focusKey, focusOffset } = serialized;
      const sel = $createRangeSelection();
      sel.anchor.set(anchorKey, anchorOffset, 'text');
      sel.focus.set(focusKey, focusOffset, 'text');
      return sel;
    } catch {
      return null;
    }
  }
  
  /* -------------------------------------------------------------------------- */
  /*  Intersection / containment helpers                                        */
  /* -------------------------------------------------------------------------- */
  
  export function rangesIntersect(...rawArgs) {
    const { editor, a, b } = parseArgs('rangesIntersect', rawArgs);
    if (!editor) return false;
    const A = normaliseRange(editor, a);                  // <- bail if no editor
    const B = normaliseRange(editor, b);
    if (!A || !B) return false;
  
    return (
      comparePoints(editor, { key: A.endKey, offset: A.endOffset }, { key: B.startKey, offset: B.startOffset }) >=
        0 &&
      comparePoints(editor, { key: B.endKey, offset: B.endOffset }, { key: A.startKey, offset: A.startOffset }) >=
        0
    );
  }
  
  export function containsEntireHighlight(...rawArgs) {
    const { editor, a: container, b: test } = parseArgs('containsEntireHighlight', rawArgs);
    if (!editor) return false;
  
    const C = normaliseRange(editor, container);
    const T = normaliseRange(editor, test);
    if (!C || !T) return false;
  
    return (
      comparePoints(editor, { key: C.startKey, offset: C.startOffset }, { key: T.startKey, offset: T.startOffset }) <= 0 &&
      comparePoints(editor, { key: C.endKey, offset: C.endOffset }, { key: T.endKey, offset: T.endOffset }) >= 0
    );
  }
  
  /* -------------------------------------------------------------------------- */
  /*  Split A by removing overlap with B                                        */
  /* -------------------------------------------------------------------------- */
  
  export function splitHighlight(...rawArgs) {
    const { editor, a: original, b: removal } = parseArgs('splitHighlight', rawArgs);
    if (!editor) return [];
  
    const orig = normaliseRange(editor, original);
    const cut  = normaliseRange(editor, removal);
    if (!orig || !cut || !rangesIntersect(editor, orig, cut)) return [];
  
    const segs = [];
  
    // before‑segment
    if (
      comparePoints(editor, { key: cut.startKey, offset: cut.startOffset }, { key: orig.startKey, offset: orig.startOffset }) > 0
    ) {
      segs.push({
        anchorKey: orig.startKey,
        anchorOffset: orig.startOffset,
        focusKey: cut.startKey,
        focusOffset: cut.startOffset,
        color: original.color,
      });
    }
  
    // after‑segment
    if (
      comparePoints(editor, { key: orig.endKey, offset: orig.endOffset }, { key: cut.endKey, offset: cut.endOffset }) > 0
    ) {
      segs.push({
        anchorKey: cut.endKey,
        anchorOffset: cut.endOffset,
        focusKey: orig.endKey,
        focusOffset: orig.endOffset,
        color: original.color,
      });
    }
  
    return segs;
  }
  

  export function mergeRanges(...rawArgs) {
    const { editor, a: A, b: B } = parseArgs('mergeRanges', rawArgs);
    if (!editor) return null;
  
    if (A.color !== B.color) return null;
  
    const a = normaliseRange(editor, A);
    const b = normaliseRange(editor, B);
    if (!a || !b) return null;
  
    const touchOrOverlap =
      comparePoints(editor, { key: b.startKey, offset: b.startOffset }, { key: a.endKey, offset: a.endOffset }) <= 0 &&
      comparePoints(editor, { key: a.startKey, offset: a.startOffset }, { key: b.endKey, offset: b.endOffset }) <= 0;
  
    if (!touchOrOverlap) return null;
  
    const startEarlier =
      comparePoints(editor, { key: a.startKey, offset: a.startOffset }, { key: b.startKey, offset: b.startOffset }) <= 0
        ? a
        : b;
  
    const endLater =
      comparePoints(editor, { key: a.endKey, offset: a.endOffset }, { key: b.endKey, offset: b.endOffset }) >= 0
        ? a
        : b;
  
    return {
      anchorKey: startEarlier.startKey,
      anchorOffset: startEarlier.startOffset,
      focusKey: endLater.endKey,
      focusOffset: endLater.endOffset,
      color: A.color, // same as B.color
    };
  }

// --- applyInitialHighlights --- (Keep Logging)
export function applyInitialHighlights(highlightsArray) {
    console.log("[InitialApply] Applying initial highlights from array:", highlightsArray);
    if (!Array.isArray(highlightsArray)) {
        console.warn("[InitialApply] Input is not an array:", highlightsArray);
        return;
    }

    highlightsArray.forEach((savedRange, index) => {
        console.log(`[InitialApply #${index}] Processing savedRange:`, JSON.stringify(savedRange));
        if (!savedRange || typeof savedRange.id !== 'string') {
            console.warn(`[InitialApply #${index}] Skipping invalid highlight entry:`, savedRange);
            return;
        }
        const selection = deserializeRange(savedRange); // Calls the robust version
        console.log(`[InitialApply #${index}] Deserialized selection result:`, selection);

        if (selection && $isRangeSelection(selection) && !selection.isCollapsed()) {
           try {
                const nodes = selection.getNodes();
                let needsFormat = false;
                for (const node of nodes) {
                     // Ensure node is still valid and check latest state
                    const latestNode = node?.getLatest ? node.getLatest() : null;
                    if (latestNode && $isTextNode(latestNode) && !latestNode.hasFormat('highlight')) {
                        needsFormat = true;
                        break;
                    }
                }
                if (needsFormat) {
                    console.log(`[InitialApply #${index}] Formatting text for range ${savedRange.id}.`);
                    selection.formatText('highlight');
                } else {
                     console.log(`[InitialApply #${index}] Text for range ${savedRange.id} already formatted or no suitable TextNodes found. Skipping formatText.`);
                }
           } catch(error) {
                console.warn(`[InitialApply #${index}] Error applying formatText for range ${savedRange.id}.`, { error, savedRange });
           }
        } else {
             const reason = !selection ? "selection deserialize failed" :
                           !$isRangeSelection(selection) ? "not a RangeSelection" :
                           selection.isCollapsed() ? "selection collapsed" : "unknown";
             console.warn(`[InitialApply #${index}] Skipped applying highlight ${savedRange.id} - ${reason}.`);
        }
    });
     console.log("[InitialApply] Finished applying initial highlights.");
}
