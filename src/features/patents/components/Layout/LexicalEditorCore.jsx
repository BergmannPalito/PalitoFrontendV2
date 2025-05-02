// src/features/patents/components/Layout/LexicalEditorCore.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

// Lexical Imports
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    SELECTION_CHANGE_COMMAND,
    $setSelection,
    $isTextNode,
} from 'lexical';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

// Context and Utils
import { useHighlightContext } from '../../context/HighlightContext';
import {
    serializeRange,
    deserializeRange,
    rangesIntersect, // Use the restored utility
    applyInitialHighlights,
} from '../../utils/highlightUtils'; // Updated imports

// Components
import HighlightToolbar from './HighlightToolbar';
import InitialContentPlugin from './InitialContentPlugin';

export default function LexicalEditorCore({ tabId, paragraphs }) {
    const [editor] = useLexicalComposerContext();
    const editorInnerDivRef = useRef(null);
    const { highlightsByTab, addHighlight, removeHighlightsByIds } = useHighlightContext();
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [isTextSelected, setIsTextSelected] = useState(false);
    const [isHighlightedTextSelected, setIsHighlightedTextSelected] = useState(false);

    // Effect for INITIAL highlight application (Unchanged)
    useEffect(() => {
        if (!editor || !tabId) return;
        const initialHighlights = highlightsByTab[tabId] || [];
        if (initialHighlights.length > 0) {
            console.log(`[Effect InitialApply] Tab ${tabId} - Applying ${initialHighlights.length} initial highlights.`);
            editor.update(() => {
                applyInitialHighlights(initialHighlights);
            }, { tag: `InitialApply-${tabId}` });
        } else {
             console.log(`[Effect InitialApply] Tab ${tabId} - No initial highlights in context.`);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, tabId]);

    // Toolbar update logic (Unchanged)
    const updateToolbar = useCallback(() => {
        // ... (keep existing logic)
        if (!editor || !editorInnerDivRef.current) {
            setShowToolbar(false);
            return;
        }
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            const nativeSelection = window.getSelection();
            const hasActiveRangeSelection = $isRangeSelection(selection) && !selection.isCollapsed();
            setIsTextSelected(hasActiveRangeSelection);
            let highlightSelected = false;
            if (hasActiveRangeSelection) {
                const nodes = selection.getNodes();
                for (const node of nodes) {
                    if ($isTextNode(node) && node.getLatest().hasFormat('highlight')) {
                        highlightSelected = true;
                        break;
                    }
                }
            }
            setIsHighlightedTextSelected(highlightSelected);
            if (hasActiveRangeSelection && nativeSelection?.rangeCount > 0) {
                const domRange = nativeSelection.getRangeAt(0);
                 if (!editorInnerDivRef.current || !editorInnerDivRef.current.contains(domRange.commonAncestorContainer)) {
                     setShowToolbar(false); return;
                 }
                const rect = domRange.getBoundingClientRect();
                if (rect.width > 0 || rect.height > 0) {
                    const horizontalOffset = 8, estimatedToolbarHeight = 30, scrollX = window.scrollX, scrollY = window.scrollY;
                    const viewportTop = rect.top + (rect.height / 2) - (estimatedToolbarHeight / 2);
                    const viewportLeft = rect.right + horizontalOffset;
                    const absoluteTop = viewportTop + scrollY;
                    const absoluteLeft = viewportLeft + scrollX;
                    if (!isNaN(absoluteTop) && !isNaN(absoluteLeft)) {
                        setToolbarPosition({ top: absoluteTop, left: absoluteLeft });
                        setShowToolbar(true);
                    } else { setShowToolbar(false); }
                } else { setShowToolbar(false); }
            } else { setShowToolbar(false); }
        });
    }, [editor]);

    // Listeners for toolbar update (Unchanged)
    useEffect(() => {
        if (!editor) return;
        const listeners = [
            editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { updateToolbar(); return false; }, COMMAND_PRIORITY_LOW),
            editor.registerUpdateListener(({ editorState }) => { editorState.read(updateToolbar); })
        ];
        return () => { listeners.forEach(unregister => unregister()); };
    }, [editor, updateToolbar]);

    // Highlight handler (Unchanged)
    const handleHighlight = useCallback(() => {
        // ... (keep existing logic)
        if (!editor || !tabId) return;
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                const serializedRange = serializeRange(selection);
                if (!serializedRange) { console.error(`[handleHighlight ${tabId}] Failed to serialize range.`); return; }
                selection.formatText('highlight');
                addHighlight(tabId, serializedRange);
                $setSelection(null);
            }
        }, {
            tag: 'HandleHighlight',
            onUpdate: () => {
                try { window.getSelection()?.removeAllRanges(); } catch (error) { console.error(`[handleHighlight onUpdate] Error clearing native selection:`, error); }
                setShowToolbar(false);
            }
        });
    }, [editor, tabId, addHighlight]);

    // --- MODIFIED: Remove Highlight handler (Use serialized region for intersect check) ---
    const handleRemoveHighlight = useCallback(() => {
         console.log(`[handleRemoveHighlight ${tabId}] Initiated.`);
        if (!editor || !tabId || !highlightsByTab[tabId]) {
             console.warn(`[handleRemoveHighlight ${tabId}] Skipping - invalid state.`);
             return;
        }
        const currentStoredHighlights = highlightsByTab[tabId] || [];
        let idsToRemove = [];
        // Store serialized region *outside* update if possible, or right at start
        let serializedRemovalRegion = null;

        editor.update(() => {
            // Get the initial user selection
            const initialSelection = $getSelection();
            console.log(`[handleRemoveHighlight ${tabId}] Initial user selection:`, initialSelection);

            if ($isRangeSelection(initialSelection) && !initialSelection.isCollapsed()) {
                 console.log(`[handleRemoveHighlight ${tabId}] Initial selection is valid RangeSelection.`);

                 // --- FIX: Serialize the initial selection region ---
                 serializedRemovalRegion = serializeRange(initialSelection);
                 if (!serializedRemovalRegion) {
                     console.error(`[handleRemoveHighlight ${tabId}] Failed to serialize the initial selection region! Aborting removal logic.`);
                     return; // Exit update if serialization fails
                 }
                 console.log(`[handleRemoveHighlight ${tabId}] Serialized initial removal region:`, serializedRemovalRegion);
                 // --- End Fix ---

                 // Step 1: Explicitly remove visual format from selected nodes
                 const selectedNodes = initialSelection.getNodes();
                 let formatRemoved = false;
                 console.log(`[handleRemoveHighlight ${tabId}] Iterating ${selectedNodes.length} nodes in initial selection to remove format.`);
                 selectedNodes.forEach(node => {
                     const latestNode = node.getLatest();
                     if ($isTextNode(latestNode) && latestNode.hasFormat('highlight')) {
                         try {
                             const writableNode = latestNode.getWritable();
                             writableNode.setFormat(0); // Clear format
                             formatRemoved = true;
                         } catch (error) {
                              console.warn(`[handleRemoveHighlight ${tabId}] Error removing format from node ${latestNode.getKey()}:`, error);
                         }
                     }
                 });
                 console.log(`[handleRemoveHighlight ${tabId}] Finished iterating nodes. Format removed visually: ${formatRemoved}`);

                 // Step 2: Find which stored highlights intersect with the *original serialized region*
                 console.log(`[handleRemoveHighlight ${tabId}] Checking intersection against ${currentStoredHighlights.length} stored highlights using the *serialized* removal region.`);
                 currentStoredHighlights.forEach((storedHighlight, index) => {
                     // --- FIX: Use rangesIntersect utility function ---
                     if (rangesIntersect(storedHighlight, serializedRemovalRegion)) {
                          console.log(`[handleRemoveHighlight ${tabId} #${index}] Serialized removal region INTERSECTS with stored ID ${storedHighlight.id}. Adding to remove list.`);
                          idsToRemove.push(storedHighlight.id);
                     } else {
                          // console.log(`[handleRemoveHighlight ${tabId} #${index}] No intersection with stored ID ${storedHighlight.id}.`); // Reduce noise
                     }
                     // --- End Fix ---
                 });

                 // Step 3: Clear editor selection AFTER processing
                 $setSelection(null);
                 console.log(`[handleRemoveHighlight ${tabId}] Cleared editor selection.`);
            } else {
                 console.warn(`[handleRemoveHighlight ${tabId}] Skipping - initial selection not valid or collapsed.`);
            }
        }, {
            tag: 'HandleRemoveHighlight',
            onUpdate: () => {
                 // Step 4: Update context AFTER the main update logic
                 console.log(`[handleRemoveHighlight ${tabId} onUpdate] IDs to remove from context:`, idsToRemove);
                if (idsToRemove.length > 0) {
                    const uniqueIdsToRemove = [...new Set(idsToRemove)];
                    if(uniqueIdsToRemove.length !== idsToRemove.length) {
                        console.warn(`[handleRemoveHighlight ${tabId} onUpdate] Duplicate IDs found in remove list.`);
                    }
                    removeHighlightsByIds(tabId, uniqueIdsToRemove);
                    console.log(`[handleRemoveHighlight ${tabId} onUpdate] Dispatched removeHighlightsByIds with unique IDs:`, uniqueIdsToRemove);
                } else {
                      console.log(`[handleRemoveHighlight ${tabId} onUpdate] No stored highlights intersected with the original removal region. No context update needed.`);
                }
                 console.log(`[handleRemoveHighlight ${tabId} onUpdate] Clearing native selection and hiding toolbar.`);
                try { window.getSelection()?.removeAllRanges(); } catch (error) { console.error(`[handleRemoveHighlight ${tabId} onUpdate] Error clearing native selection:`, error); }
                 setShowToolbar(false);
            }
        });
    }, [editor, tabId, highlightsByTab, removeHighlightsByIds]);
    // --- END MODIFIED ---

    // Render the editor core (Unchanged)
    return (
        <div ref={editorInnerDivRef} className="relative prose max-w-none p-4 lg:p-6 h-full" data-testid="lexical-editor-core" key={`editor-core-${tabId || 'no-tab'}`}>
            <RichTextPlugin
                contentEditable={<ContentEditable className="outline-none focus:outline-none h-full caret-transparent" aria-label="Patent Description"/>}
                placeholder={null}
                ErrorBoundary={(error) => { console.error("Lexical RichTextPlugin ErrorBoundary:", error); return <div>Error rendering content.</div>; }}
            />
            <HistoryPlugin />
            <InitialContentPlugin paragraphs={paragraphs} />
             {showToolbar && createPortal(
                <HighlightToolbar
                    editor={editor}
                    position={toolbarPosition}
                    isTextSelected={isTextSelected}
                    isHighlightSelected={isHighlightedTextSelected}
                    onHighlight={handleHighlight}
                    onRemoveHighlight={handleRemoveHighlight}
                />,
                document.body
            )}
        </div>
    );
}

LexicalEditorCore.propTypes = {
    tabId: PropTypes.string,
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
};