// src/features/patents/utils/highlightUtils.js
import { $getNodeByKey, $createRangeSelection, $isTextNode, $isRangeSelection } from 'lexical';
import { nanoid } from 'nanoid';

// HighlightRange typedef (unchanged)
/**
 * @typedef {object} HighlightRange
 * @property {string} id - Unique ID for the highlight.
 * @property {string} anchorKey - Lexical node key for the selection anchor.
 * @property {number} anchorOffset - Offset within the anchor node.
 * @property {string} focusKey - Lexical node key for the selection focus.
 * @property {number} focusOffset - Offset within the focus node.
 */

// --- serializeRange --- (Unchanged)
export function serializeRange(selection) {
    // console.log("[Serialize] Attempting to serialize selection:", selection); // Reduce noise
    if (!$isRangeSelection(selection)) {
        console.warn("[Serialize] Input is not a RangeSelection:", selection);
        return null;
    }
    if (!selection.anchor || !selection.focus) {
         console.warn("[Serialize] Selection missing anchor or focus.");
        return null;
    }
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    if (!anchorNode || !focusNode) {
        console.warn("[Serialize] Attempted to serialize range with non-existent anchor/focus node.");
        return null;
    }

    const serialized = {
        id: nanoid(8), // Generate a temporary ID for comparison if needed, or use null
        anchorKey: selection.anchor.key,
        anchorOffset: selection.anchor.offset,
        focusKey: selection.focus.key,
        focusOffset: selection.focus.offset,
    };
    // console.log("[Serialize] Successfully serialized:", serialized); // Reduce noise
    return serialized;
}
// --- END serializeRange ---

// --- deserializeRange (No clamping) --- (Unchanged)
export function deserializeRange(serializedRange) {
    // console.log("[Deserialize] Attempting to deserialize range:", serializedRange); // Reduce noise
    if (!serializedRange || !serializedRange.anchorKey || !serializedRange.focusKey) {
        console.warn("[Deserialize] Invalid serializedRange object provided.");
        return null;
    }
    try {
        const anchorNode = $getNodeByKey(serializedRange.anchorKey);
        const focusNode = $getNodeByKey(serializedRange.focusKey);

        if (anchorNode && focusNode) {
            const anchorIsText = $isTextNode(anchorNode);
            const focusIsText = $isTextNode(focusNode);
            const anchorType = anchorIsText ? 'text' : 'element';
            const focusType = focusIsText ? 'text' : 'element';

            const rangeSelection = $createRangeSelection();

            const anchorOffsetToSet = serializedRange.anchorOffset;
            const focusOffsetToSet = serializedRange.focusOffset;
            // console.log(`[Deserialize] Using original offsets: Anchor=${anchorOffsetToSet}, Focus=${focusOffsetToSet}`); // Reduce noise

            rangeSelection.anchor.set(serializedRange.anchorKey, anchorOffsetToSet, anchorType);
            rangeSelection.focus.set(serializedRange.focusKey, focusOffsetToSet, focusType);

            // console.log(`[Deserialize] Selection STATE JUST BEFORE RETURN: Anchor(key=${rangeSelection.anchor.key}, off=${rangeSelection.anchor.offset}), Focus(key=${rangeSelection.focus.key}, off=${rangeSelection.focus.offset})`); // Reduce noise

            if (!$isRangeSelection(rangeSelection)) {
                 console.error("[Deserialize] Failed to create a valid RangeSelection object.", rangeSelection);
                 return null;
            }
            return rangeSelection;

        } else {
            // console.warn(`[Deserialize] Skipping highlight because node not found: AnchorKey=${serializedRange.anchorKey}, FocusKey=${serializedRange.focusKey}`); // Reduce noise
            return null;
        }
    } catch (error) {
        console.error("[Deserialize] Error deserializing range:", { serializedRange, error });
    }
    return null;
}
// --- END deserializeRange ---

// --- RESTORED: rangesIntersect ---
// Compares two serialized range objects by deserializing them
export function rangesIntersect(rangeA, rangeB) {
    // console.log("[Intersect] Checking intersection between:", rangeA, "AND", rangeB); // Reduce noise
    if (!rangeA || !rangeB) return false;
    try {
        // Deserialize both input ranges (which are serialized objects)
        const selectionA = deserializeRange(rangeA);
        const selectionB = deserializeRange(rangeB);

        if (!$isRangeSelection(selectionA)) {
            // console.warn("[Intersect] Deserialized selectionA is invalid."); // Reduce noise
             return false;
        }
        if (!$isRangeSelection(selectionB)) {
            // console.warn("[Intersect] Deserialized selectionB is invalid."); // Reduce noise
            return false;
        }

        // Now perform the intersection check on the two valid RangeSelection objects
        try {
             // Check if methods exist before calling
             if (typeof selectionA.intersects !== 'function' || typeof selectionB.intersects !== 'function') {
                  console.error("[Intersect] Deserialized selection missing intersects method!", { selectionA, selectionB });
                  return false;
             }
             // Perform check
             const intersects = selectionA.is(selectionB) || selectionA.intersects(selectionB);
             // console.log(`[Intersect] Result: ${intersects}`); // Reduce noise
             return intersects;
        } catch (methodError) {
             console.error("[Intersect] Error calling .is() or .intersects()", { error: methodError });
             return false;
        }
    } catch (e) {
        console.error("[Intersect] Outer error during deserialization or check", { error: e });
    }
    return false;
}
// --- END RESTORED ---


// --- applyInitialHighlights --- (Unchanged)
export function applyInitialHighlights(highlightsArray) {
    console.log("[InitialApply] Applying initial highlights from array:", highlightsArray);
    if (!Array.isArray(highlightsArray)) {
        console.warn("[InitialApply] Input is not an array:", highlightsArray);
        return;
    }

    highlightsArray.forEach((savedRange, index) => {
        const selection = deserializeRange(savedRange);
        if (
            selection &&
            $isRangeSelection(selection) &&
            (selection.anchor.key !== selection.focus.key || selection.anchor.offset !== selection.focus.offset)
           )
        {
           try {
                selection.formatText('highlight');
           } catch(error) {
                console.warn(`[InitialApply #${index}] Error applying formatText for range ${savedRange.id}. Content may have changed.`, { error, savedRange });
           }
        } else {
             const reason = !selection ? "selection is null" :
                           !$isRangeSelection(selection) ? "not a RangeSelection" :
                           "selection appears collapsed (anchor/focus identical)";
             console.warn(`[InitialApply #${index}] Skipped - ${reason}.`);
        }
    });
     console.log("[InitialApply] Finished applying initial highlights.");
}
// --- END applyInitialHighlights ---

// --- REMOVED: clearAllHighlights ---