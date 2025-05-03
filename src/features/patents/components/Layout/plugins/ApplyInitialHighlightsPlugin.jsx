// src/features/patents/components/Layout/plugins/ApplyInitialHighlightsPlugin.jsx
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
// import { useHighlightContext } from '../../../context/HighlightContext';
// import { applyInitialHighlights } from '../../../utils/highlightUtils'; // Likely remove usage
// import {$getRoot} from 'lexical';

// NOTE: This plugin's role changes significantly with Decorator Nodes.
// If highlights are saved *within* the editor state JSON, this plugin
// might not be needed to re-apply them. If ranges are stored externally
// and need to be applied *after* initial content load, this plugin
// needs to be rewritten to insert HighlightSpanNodes based on those ranges.

// For now, let's make it do nothing or just log, assuming highlights
// are handled by loading the editor state itself.
export default function ApplyInitialHighlightsPlugin({ tabId, paragraphs }) {
    const [editor] = useLexicalComposerContext();
    // const { highlightsByTab = {} } = useHighlightContext() || {};
    const appliedRef = useRef({});

    useEffect(() => {
        // console.log(`[ApplyInitialHighlightsPlugin DECORATOR] Effect triggered for tabId: ${tabId}. No action taken by default.`);

        // --- Example of how you MIGHT implement applying from external ranges ---
        // THIS IS COMPLEX and requires careful range-to-node mapping
        /*
        if (!editor || !tabId || !paragraphs) return;
        const contentSignature = `${tabId}-${paragraphs.length}`;
        if (appliedRef.current[contentSignature]) return;

        const initialHighlights = highlightsByTab[tabId] || [];
        if (initialHighlights.length > 0) {
            console.log(`[ApplyInitialHighlightsPlugin DECORATOR] Found ${initialHighlights.length} ranges for ${tabId}. Applying nodes...`);
            editor.update(() => {
                if ($getRoot().getChildrenSize() > 0) {
                    initialHighlights.forEach(savedRange => {
                        const selection = deserializeRange(savedRange); // You still need deserializeRange
                        if (selection && $isRangeSelection(selection) && !selection.isCollapsed()) {
                           try {
                               // **** INSTEAD of formatText ****
                               // Find nodes in selection, split text nodes, insert HighlightSpanNode
                               selection.wrapNodes($createHighlightSpanNode(savedRange.id)); // Simplified attempt
                               console.log(`[ApplyInitialHighlightsPlugin DECORATOR] Applied node for ${savedRange.id}`);
                           } catch (e) {
                               console.error(`[ApplyInitialHighlightsPlugin DECORATOR] Failed to apply node for ${savedRange.id}`, e);
                           }
                        } else {
                             console.warn(`[ApplyInitialHighlightsPlugin DECORATOR] Could not deserialize or selection invalid for ${savedRange.id}`);
                        }
                    });
                    appliedRef.current[contentSignature] = true;
                } else {
                     console.warn(`[ApplyInitialHighlightsPlugin DECORATOR] Root empty during update for ${contentSignature}.`);
                }
            }, { tag: `InitialApplyNode-${tabId}` });
        } else {
            appliedRef.current[contentSignature] = true; // Mark as checked even if no highlights
        }
        */
       // --- End Example ---

    }, [editor, tabId, paragraphs/*, highlightsByTab */]); // Adjust dependencies based on implementation

    useEffect(() => {
        return () => { appliedRef.current = {}; }
    }, [tabId]);

    return null;
}

ApplyInitialHighlightsPlugin.propTypes = {
    tabId: PropTypes.string,
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
};