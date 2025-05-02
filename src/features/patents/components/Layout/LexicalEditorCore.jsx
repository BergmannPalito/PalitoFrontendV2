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
    $setSelection
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
    rangesIntersect,
    clearAllHighlights,
    applyHighlightsFromRanges
} from '../../utils/highlightUtils'; // Adjust path if needed

// Components
import HighlightToolbar from './HighlightToolbar'; // Adjust path if needed
import InitialContentPlugin from './InitialContentPlugin'; // Adjust path if needed

// This is the core component rendering the editor and handling interactions
export default function LexicalEditorCore({ tabId, paragraphs }) {
    const [editor] = useLexicalComposerContext();
    const editorInnerDivRef = useRef(null);
    const { highlightsByTab, addHighlight, removeHighlightsByIds } = useHighlightContext();
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [isTextSelected, setIsTextSelected] = useState(false);

    // --- DEBUG: Mouseup listener (can be kept or removed) ---
    useEffect(() => {
        const editorDiv = editorInnerDivRef.current;
        if (!editorDiv || !editor) return;
        const handleMouseUp = (event) => { if (editorDiv.contains(event.target)) { /* console.log... */ } };
        document.addEventListener('mouseup', handleMouseUp, true);
        return () => document.removeEventListener('mouseup', handleMouseUp, true);
    }, [editor]);
    // --- END DEBUG ---

    // Effect to apply highlights
    useEffect(() => {
        if (!editor || !tabId) { if(editor) { editor.update(clearAllHighlights, { tag: 'ClearHighlightsOnNoTab' }); } return; }
        const highlightsToApply = highlightsByTab[tabId] || [];
        editor.update(() => { clearAllHighlights(); applyHighlightsFromRanges(highlightsToApply); }, { tag: 'ApplyHighlightsOnTabChange' });
    }, [editor, tabId]); // Keep dependencies simple

    // Toolbar update logic
    const updateToolbar = useCallback(() => {
        if (!editor || !editorInnerDivRef.current) { setShowToolbar(false); return; }
        const selection = $getSelection();
        const nativeSelection = window.getSelection();
        const hasActiveSelection = $isRangeSelection(selection) && !selection.isCollapsed();
        setIsTextSelected(hasActiveSelection);
        if (hasActiveSelection && nativeSelection?.rangeCount > 0) {
            const domRange = nativeSelection.getRangeAt(0);
            if (!editorInnerDivRef.current.contains(domRange.commonAncestorContainer)) { setShowToolbar(false); return; }
            const rect = domRange.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                const horizontalOffset = 8, estimatedToolbarHeight = 30, scrollX = window.scrollX, scrollY = window.scrollY;
                const absoluteLeft = rect.right + scrollX + horizontalOffset;
                const absoluteTop = rect.top + scrollY + (rect.height / 2) - (estimatedToolbarHeight / 2);
                if (!isNaN(absoluteTop) && !isNaN(absoluteLeft)) { setToolbarPosition({ top: absoluteTop, left: absoluteLeft }); setShowToolbar(true); } else { setShowToolbar(false); }
            } else { setShowToolbar(false); }
        } else { setShowToolbar(false); }
    }, [editor]);

    // Listeners for toolbar update
    useEffect(() => {
        if (!editor) return;
        const update = () => editor.getEditorState().read(updateToolbar);
        return mergeRegister(
            editor.registerCommand(SELECTION_CHANGE_COMMAND, () => { update(); return false; }, COMMAND_PRIORITY_LOW),
            editor.registerUpdateListener(({ editorState }) => editorState.read(update))
        );
    }, [editor, updateToolbar]);

    // Highlight handler
    const handleHighlight = useCallback(() => {
        if (!editor || !tabId) return;
        console.log('[handleHighlight] Initiated.');

        editor.update(() => {
            console.log('[handleHighlight Update] Inside editor.update.');
            const selection = $getSelection();
            console.log('[handleHighlight Update] Selection before format:', selection);
            if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                const serializedRange = serializeRange(selection);
                if (!serializedRange) { console.error("Failed to serialize range."); return; }
                selection.formatText('highlight');
                console.log('[handleHighlight Update] Text formatted.');
                addHighlight(tabId, serializedRange);
                console.log('[handleHighlight Update] About to clear selection.');
                $setSelection(null); // Clear Lexical selection
                const selectionAfterClear = $getSelection();
                console.log('[handleHighlight Update] Selection after $setSelection(null):', selectionAfterClear);
                console.log("[Action] handleHighlight: Applied, updated context, and cleared selection.");
            } else {
                console.log('[handleHighlight Update] No range selection or collapsed.');
            }
        }, {
            tag: 'HandleHighlight',
            onUpdate: () => {
                console.log("[onUpdate] Starting after highlight update.");
                setShowToolbar(false); // Hide toolbar first
                console.log("[onUpdate] Toolbar hidden.");

                // --- FIX: Clear NATIVE browser selection AFTER Lexical update ---
                try {
                    const nativeSelection = window.getSelection();
                    if (nativeSelection) {
                        // Check if there's still a selection range visible to the browser
                        if (nativeSelection.rangeCount > 0 && nativeSelection.toString().length > 0) {
                            console.log("[onUpdate] Native selection detected, attempting removeAllRanges(). Length:", nativeSelection.toString().length);
                            nativeSelection.removeAllRanges(); // Force clear the browser's selection
                             console.log("[onUpdate] Cleared native browser selection ranges. Range count now:", window.getSelection()?.rangeCount);
                        } else {
                            console.log("[onUpdate] No significant native selection detected to clear.");
                        }
                    } else {
                         console.log("[onUpdate] window.getSelection() returned null.");
                    }
                } catch (error) {
                    console.error("[onUpdate] Error clearing native selection:", error);
                }
                // --- END FIX ---
            }
        });

    }, [editor, tabId, addHighlight]);

    // Remove highlight handler (similar native selection clear)
    const handleRemoveHighlight = useCallback(() => {
       if (!editor || !tabId) return;
       console.log('[handleRemoveHighlight] Initiated.');
       const highlightsBeforeUpdate = highlightsByTab[tabId] || [];
       let intersectingIds = [];

       editor.update(() => {
           // ... (logic to find intersectingIds and remove format) ...
            $setSelection(null); // Clear Lexical selection
       }, {
            tag: 'HandleRemoveHighlight',
             onUpdate: () => {
                console.log("[onUpdate] Starting after remove highlight update.");
                setShowToolbar(false);
                 console.log("[onUpdate] Toolbar hidden.");
                // --- FIX: Clear NATIVE browser selection AFTER Lexical update ---
                try {
                    const nativeSelection = window.getSelection();
                    if (nativeSelection) {
                         if (nativeSelection.rangeCount > 0 && nativeSelection.toString().length > 0) {
                             console.log("[onUpdate] Native selection detected, attempting removeAllRanges(). Length:", nativeSelection.toString().length);
                             nativeSelection.removeAllRanges();
                              console.log("[onUpdate] Cleared native browser selection ranges. Range count now:", window.getSelection()?.rangeCount);
                         } else {
                             console.log("[onUpdate] No significant native selection detected to clear.");
                         }
                    } else {
                          console.log("[onUpdate] window.getSelection() returned null.");
                    }
                } catch (error) {
                    console.error("[onUpdate] Error clearing native selection:", error);
                }
                // --- END FIX ---
            }
       });
    }, [editor, tabId, removeHighlightsByIds, highlightsByTab]);

    // Render the editor core
    return (
        <div ref={editorInnerDivRef} className="relative prose max-w-none p-4 lg:p-6 h-full" data-testid="lexical-editor-core" key={`editor-core-${tabId || 'no-tab'}`}>
            <RichTextPlugin
                contentEditable={<ContentEditable className="outline-none focus:outline-none h-full caret-transparent" aria-label="Patent Description"/>}
                placeholder={null}
                ErrorBoundary={() => null}
            />
            <HistoryPlugin />
            <InitialContentPlugin paragraphs={paragraphs} />
            <HighlightToolbar
               editor={editor}
               showToolbar={showToolbar}
               position={toolbarPosition}
               isTextSelected={isTextSelected}
               onHighlight={handleHighlight}
            />
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