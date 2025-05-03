import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useToolbar } from '../../../hooks/useToolbar';
import { useHighlightHandler } from '../../../hooks/useHighlightHandler';
import HighlightToolbar from '../HighlightToolbar';

export default function HighlightToolbarPlugin({ editorInnerDivRef, tabId }) {
    const [editor] = useLexicalComposerContext();

    const {
        showToolbar,
        toolbarPosition,
        isTextSelected,
        isHighlightedTextSelected,
        // hideToolbar // We might not need hideToolbar explicitly now
    } = useToolbar(editorInnerDivRef, tabId);

    const { handleHighlight, handleRemoveHighlight } = useHighlightHandler(tabId);

     // --- REMOVED requestAnimationFrame(hideToolbar) ---
     // The toolbar should hide automatically when selection changes.
     const onHighlight = useCallback(() => {
         console.log("[HighlightToolbarPlugin] onHighlight triggered");
         handleHighlight();
         // Let selection change hide the toolbar naturally
     }, [handleHighlight]);

     const onRemoveHighlight = useCallback(() => {
         console.log("[HighlightToolbarPlugin] onRemoveHighlight triggered");
         handleRemoveHighlight();
         // Let selection change hide the toolbar naturally
     }, [handleRemoveHighlight]);
     // --- END REMOVAL ---


    return (
        <>
            {showToolbar && document.body && createPortal(
                <HighlightToolbar
                    editor={editor}
                    position={toolbarPosition}
                    isTextSelected={isTextSelected}
                    isHighlightSelected={isHighlightedTextSelected}
                    onHighlight={onHighlight}
                    onRemoveHighlight={onRemoveHighlight}
                />,
                document.body
            )}
        </>
    );
}

HighlightToolbarPlugin.propTypes = {
     editorInnerDivRef: PropTypes.oneOfType([
         PropTypes.func,
         PropTypes.shape({ current: PropTypes.instanceOf(Element) })
     ]).isRequired,
    tabId: PropTypes.string,
};