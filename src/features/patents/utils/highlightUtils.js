// src/features/patents/utils/highlightUtils.js
import { $getNodeByKey, $createRangeSelection, $getRoot, $isTextNode } from 'lexical';
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

// serializeRange (No changes needed)
export function serializeRange(selection) {
    // ... (keep implementation from previous step)
    if (!selection || !selection.anchor || !selection.focus) {
        return null;
    }
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (!anchorNode || !focusNode) {
        console.warn("[Serialize] Attempted to serialize range with non-existent node.");
        return null;
    }
    const serialized = {
        id: nanoid(8),
        anchorKey: selection.anchor.key,
        anchorOffset: selection.anchor.offset,
        focusKey: selection.focus.key,
        focusOffset: selection.focus.offset,
    };
    return serialized;
}

// deserializeRange (Keep corrected clamping)
export function deserializeRange(serializedRange) {
    // ... (keep implementation from previous step)
    if (!serializedRange || !serializedRange.anchorKey || !serializedRange.focusKey) {
        console.warn("[Deserialize] Invalid serializedRange object provided.");
        return null;
    }
    try {
        const anchorNode = $getNodeByKey(serializedRange.anchorKey);
        const focusNode = $getNodeByKey(serializedRange.focusKey);

        if (anchorNode && focusNode && $isTextNode(anchorNode) && $isTextNode(focusNode)) {
            const anchorSize = anchorNode.getTextContentSize();
            const focusSize = focusNode.getTextContentSize();

            const clampedAnchorOffset = Math.min(serializedRange.anchorOffset, anchorSize);
            const clampedFocusOffset = Math.min(serializedRange.focusOffset, focusSize);

            if (clampedAnchorOffset !== serializedRange.anchorOffset || clampedFocusOffset !== serializedRange.focusOffset) {
                 console.warn(`[Deserialize] Clamping offsets for range ${serializedRange.id}:`, {
                    originalAnchor: serializedRange.anchorOffset, clampedAnchor: clampedAnchorOffset, anchorSize,
                    originalFocus: serializedRange.focusOffset, clampedFocus: clampedFocusOffset, focusSize,
                 });
            }

            const rangeSelection = $createRangeSelection();
            rangeSelection.anchor.set(serializedRange.anchorKey, clampedAnchorOffset, 'text');
            rangeSelection.focus.set(serializedRange.focusKey, clampedFocusOffset, 'text');

            return rangeSelection;

        } else {
            if (!anchorNode || !focusNode) console.warn(`[Deserialize] Skipping highlight because node not found:`, serializedRange);
            else console.warn(`[Deserialize] Skipping highlight because node type is not TextNode:`, { anchorNode, focusNode });
            return null;
        }
    } catch (error) {
        console.error("[Deserialize] Error deserializing range:", { serializedRange, error });
    }
    return null;
}

// --- MODIFIED: rangesIntersect with internal try...catch ---
export function rangesIntersect(rangeA, rangeB) {
    if (!rangeA || !rangeB) return false;
    // console.log("[Intersect] Checking:", rangeA, rangeB); // DEBUG

    try {
        // Attempt deserialization first
        const selectionA = deserializeRange(rangeA);
        const selectionB = deserializeRange(rangeB);

        // Check BOTH selections are valid immediately after deserialization
        if (selectionA && selectionB) {
            // --- Wrap the potentially problematic calls ---
            try {
                 const intersects = selectionA.is(selectionB) || selectionA.intersects(selectionB);
                 // console.log(`[Intersect] Deserialization check result: ${intersects}`); // DEBUG
                 return intersects;
            } catch (methodError) {
                 // Log specifically if .is() or .intersects() fails on valid-looking objects
                 console.error("[Intersect] Error calling .is() or .intersects()", { rangeA, rangeB, selectionA_type: typeof selectionA, selectionB_type: typeof selectionB, error: methodError });
                 return false; // Assume no intersection if methods fail
            }
            // --- End Wrap ---
        } else {
            // console.log("[Intersect] Deserialization failed for one or both ranges. Returning false."); // DEBUG
            return false; // Return false if deserialization failed for either
        }

    } catch (e) {
        // Catch errors during the initial deserializeRange calls themselves
        console.error("[Intersect] Outer error during range intersection check", { rangeA, rangeB, error: e });
    }
    // console.log("[Intersect] Returning false (error or failed deserialization)"); // DEBUG
    return false; // Default to false if any error occurs
}
// --- END MODIFIED ---


// clearAllHighlights (No changes needed)
export function clearAllHighlights() {
    // ... (keep implementation from previous step)
    const root = $getRoot();
    if (!root) return;
    const textNodes = root.getAllTextNodes();
    textNodes.forEach(textNode => {
        if (textNode.isAttached() && textNode.hasFormat('highlight')) {
            try {
                const writableNode = textNode.getWritable();
                const nodeSelection = writableNode.select(0, writableNode.getTextContentSize());
                nodeSelection.formatText('highlight');
            } catch (error) {
                 console.warn(`[ClearAll] Error clearing highlight on node ${textNode.getKey()}:`, error);
            }
        }
    });
}


// applyHighlightsFromRanges (No changes needed)
export function applyHighlightsFromRanges(highlightsArray) {
    // ... (keep implementation from previous step)
    clearAllHighlights();
    if (!Array.isArray(highlightsArray)) {
        return;
    }
    highlightsArray.forEach(savedRange => {
        const selection = deserializeRange(savedRange);
        if (selection && !selection.isCollapsed()) {
           try {
               selection.formatText('highlight');
           } catch(error) {
                console.warn(`[ApplyHighlights] Error applying formatText for range ${savedRange.id}:`, error);
           }
        }
    });
}