// src/features/patents/components/Layout/LexicalDescriptionDisplay.jsx
import PropTypes from 'prop-types';
import {
    $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $isTextNode,
    COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND, TextNode, $isElementNode,
    ParagraphNode, $setSelection
} from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useCallback, useRef } from 'react';
import { mergeRegister } from '@lexical/utils';

// Import Context Hook & Correct Actions
import { useHighlightContext } from '../../context/HighlightContext';
// Import Utils
import {
    serializeRange,
    rangesIntersect,
    clearAllHighlights,
    applyHighlightsFromRanges
} from '../../utils/highlightUtils';
import HighlightToolbar from './HighlightToolbar';

// Basic Theme
const editorTheme = {
    text: { highlight: 'highlight' },
};

// Error Handler Component
function LexicalErrorBoundaryComponent(error) {
    console.error("[Lexical Error]", error);
    return <LexicalErrorBoundary error={error} />;
}

// Initial Content Plugin
function InitialContentPlugin({ paragraphs }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        if (editor) {
            editor.update(() => {
                const root = $getRoot();
                root.clear();
                if (paragraphs && paragraphs.length > 0) {
                    paragraphs.forEach(para => {
                        const paragraphNode = $createParagraphNode();
                        const textContent = String(para.text ?? '');
                        paragraphNode.append($createTextNode(textContent));
                        root.append(paragraphNode);
                    });
                } else {
                    const paragraphNode = $createParagraphNode();
                    paragraphNode.append($createTextNode('No description available.'));
                    root.append(paragraphNode);
                }
            }, { tag: 'InitialContentPlugin' });
        }
    }, [editor, paragraphs]);
    return null;
}
InitialContentPlugin.propTypes = {
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
};


// --- Inner Component using Context ---
// Remove scrollContainerRef prop
function LexicalEditorWithHighlighting({ tabId, paragraphs }) {
    const [editor] = useLexicalComposerContext();
    // Ref for the inner div (still useful for containment check)
    const editorInnerDivRef = useRef(null);

    const { highlightsByTab, addHighlight, removeHighlightsByIds } = useHighlightContext();
    const currentTabHighlights = tabId ? (highlightsByTab[tabId] || []) : [];

    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [isTextSelected, setIsTextSelected] = useState(false);

    // Apply highlights (no change needed)
    useEffect(() => {
       // ... (logic remains the same) ...
        if (editor && tabId) {
             const timer = setTimeout(() => {
                 editor.update(() => {
                     applyHighlightsFromRanges(currentTabHighlights);
                 }, { tag: 'ApplyHighlightsEffect' });
             }, 50);
             return () => clearTimeout(timer);
        } else if (editor) {
            editor.update(() => { clearAllHighlights(); }, { tag: 'ClearHighlightsEffect' });
        }
    }, [tabId, editor]);


    // Update toolbar - *** VIEWPORT + WINDOW SCROLL CALCULATION ***
    const updateToolbar = useCallback(() => {
        // Only need editor and inner div ref now
        if (!editor || !editorInnerDivRef?.current) {
            setShowToolbar(false);
            return;
        }

        const selection = $getSelection();
        const hasActiveSelection = $isRangeSelection(selection) && !selection.isCollapsed();
        setIsTextSelected(hasActiveSelection);

        if (hasActiveSelection) {
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
                const domRange = domSelection.getRangeAt(0);
                 // Use editorInnerDivRef to check if selection is inside the editor's div
                if (!editorInnerDivRef.current.contains(domRange.commonAncestorContainer)) {
                    setShowToolbar(false); return;
                }

                const rect = domRange.getBoundingClientRect(); // Selection bounds (relative to viewport)

                if (rect.width > 0 || rect.height > 0) {
                    // --- Viewport + Window Scroll Calculation ---
                    const horizontalOffset = 8;
                    const estimatedToolbarHeight = 30; // Adjust if needed

                    const scrollX = window.scrollX; // Window horizontal scroll offset
                    const scrollY = window.scrollY; // Window vertical scroll offset

                    // Calculate absolute position in the document
                    const absoluteLeft = rect.right + scrollX + horizontalOffset;
                    const absoluteTop = rect.top + scrollY + (rect.height / 2) - (estimatedToolbarHeight / 2);
                    // --- End Calculation ---

                    if (!isNaN(absoluteTop) && !isNaN(absoluteLeft)) {
                        setToolbarPosition({ top: absoluteTop, left: absoluteLeft });
                        setShowToolbar(true);
                    } else {
                        console.warn("Invalid toolbar position calculated", { absoluteTop, absoluteLeft });
                        setShowToolbar(false);
                    }

                } else {
                    setShowToolbar(false);
                }
            } else {
                setShowToolbar(false);
            }
        } else {
            setShowToolbar(false);
        }
    // Dependencies updated
    }, [editor, editorInnerDivRef]);


    // Register listener (no change needed)
    useEffect(() => {
        if (!editor) return;
        return mergeRegister(
            editor.registerCommand( SELECTION_CHANGE_COMMAND, () => { editor.getEditorState().read(updateToolbar); return false; }, COMMAND_PRIORITY_LOW ),
            editor.registerUpdateListener(({ editorState }) => { editorState.read(updateToolbar); })
        );
    }, [editor, updateToolbar]);


    // handleHighlight (Using the SIMPLE logic)
    const handleHighlight = useCallback(() => {
        // ... (Keep the simple implementation) ...
        console.log("[Action] handleHighlight triggered (SIMPLE approach)");
        if (!editor || !tabId) return;
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                const serializedRange = serializeRange(selection);
                if (!serializedRange) { console.error("[Action] handleHighlight: Failed to serialize range."); return; }
                console.log("[Action] handleHighlight: Serialized range:", serializedRange);
                console.log("[Action] handleHighlight: Applying visual format...");
                selection.formatText('highlight');
                console.log("[Action] handleHighlight: Visual format applied.");
                 console.log("[Action] handleHighlight: Updating context state...");
                 addHighlight(tabId, serializedRange);
                 console.log("[Action] handleHighlight: Context state updated.");
            } else {
                console.log("[Action] handleHighlight: Invalid selection.");
            }
        }, { tag: 'HandleHighlightSimple' });
        setShowToolbar(false);
    }, [editor, tabId, addHighlight]);


    // handleRemoveHighlight (Using the SIMPLE logic)
    const handleRemoveHighlight = useCallback(() => {
       // ... (Keep the simple implementation) ...
       console.log("[Action] handleRemoveHighlight triggered (SIMPLE approach)");
       if (!editor || !tabId) return;
       const highlightsBeforeUpdate = highlightsByTab[tabId] || [];
       let intersectingIds = [];
       editor.update(() => {
           const selection = $getSelection();
           if ($isRangeSelection(selection) && !selection.isCollapsed()) {
                const selectionRange = serializeRange(selection);
                if (!selectionRange) { console.error("[Action] handleRemoveHighlight: Failed to serialize selection range."); return; }
                console.log("[Action] handleRemoveHighlight: Serialized selection range:", selectionRange);
                intersectingIds = highlightsBeforeUpdate
                   .filter(existingRange => rangesIntersect(existingRange, selectionRange))
                   .map(range => range.id);
                console.log("[Action] handleRemoveHighlight: Intersecting IDs found:", intersectingIds);
                console.log("[Action] handleRemoveHighlight: Removing visual format...");
                selection.formatText('highlight'); // Toggle format OFF
                console.log("[Action] handleRemoveHighlight: Visual format removed.");
                 if (intersectingIds.length > 0) {
                    console.log("[Action] handleRemoveHighlight: Updating context state...");
                    removeHighlightsByIds(tabId, intersectingIds);
                    console.log("[Action] handleRemoveHighlight: Context state updated.");
                } else {
                    console.log("[Action] handleRemoveHighlight: No intersecting highlights found in state to remove.");
                }
           } else {
               console.log("[Action] handleRemoveHighlight: Invalid selection.");
           }
       }, { tag: 'HandleRemoveHighlightSimple' });
       setShowToolbar(false);
    }, [editor, tabId, removeHighlightsByIds, highlightsByTab]);


    // Render - Attach editorInnerDivRef here
    return (
        // This ref is still useful for the containment check
        <div ref={editorInnerDivRef} className="relative prose max-w-none p-4 lg:p-6 h-full" key={tabId || 'no-tab-outer'}>
            <RichTextPlugin
                contentEditable={<ContentEditable className="outline-none focus:outline-none h-full caret-transparent" />}
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundaryComponent}
            />
            <HistoryPlugin />
            <InitialContentPlugin paragraphs={paragraphs} />
            <HighlightToolbar
               editor={editor}
               showToolbar={showToolbar}
               position={toolbarPosition} // Pass the corrected absolute position
               isTextSelected={isTextSelected}
               onHighlight={handleHighlight}
            />
        </div>
    );
}
// Update prop types for the inner component (remove scrollContainerRef)
LexicalEditorWithHighlighting.propTypes = {
    tabId: PropTypes.string,
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
    // scrollContainerRef is removed
};
LexicalEditorWithHighlighting.defaultProps = {
    tabId: null,
    paragraphs: [],
    // scrollContainerRef: null, // Removed
};


// --- Outer Component: Sets up the Composer ---
// Remove scrollContainerRef prop
export default function LexicalDescriptionDisplay({ tabId, paragraphs }) {
    const composerKey = `lexical-display-${tabId || 'no-tab'}`;
    const initialConfig = {
        namespace: `PatentDescriptionEditor_${tabId || 'no_tab'}`,
        theme: editorTheme,
        onError: (error) => { console.error("Lexical initialConfig onError:", error); },
        editable: false,
        editorState: null,
        nodes: [TextNode, ParagraphNode],
    };

    return (
        <LexicalComposer initialConfig={initialConfig} key={composerKey}>
            {/* Do not pass scrollContainerRef down anymore */}
            <LexicalEditorWithHighlighting
                tabId={tabId}
                paragraphs={paragraphs}
             />
        </LexicalComposer>
    );
}
// Update prop types for the outer component (remove scrollContainerRef)
LexicalDescriptionDisplay.propTypes = {
    tabId: PropTypes.string,
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
    // scrollContainerRef: PropTypes.oneOfType([ ... ]), // Removed
};
LexicalDescriptionDisplay.defaultProps = {
    tabId: null,
    paragraphs: [],
    // scrollContainerRef: null, // Removed
};