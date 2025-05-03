// src/features/patents/components/Layout/LexicalEditorCore.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';

// Lexical Imports
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'; // Use Lexical's boundary

// Local Imports
import InitialContentPlugin from './InitialContentPlugin';
// ApplyInitialHighlights should NOT apply formats anymore if using overlay
import ApplyInitialHighlightsPlugin from './plugins/ApplyInitialHighlightsPlugin';
import HighlightToolbarPlugin from './plugins/HighlightToolbarPlugin';
// --- Import the Overlay Plugin ---
import HighlightOverlayPlugin from './plugins/HighlightOverlayPlugin';
// --- End Import ---

// Simple fallback component for ErrorBoundary
function EditorErrorFallback({onError, error}){
    onError(error); // Call the passed error handler
    console.error("Lexical Rendering Error caught by Boundary:", error);
    return <div>Error rendering content. Check console.</div>;
}
EditorErrorFallback.propTypes = { onError: PropTypes.func.isRequired, error: PropTypes.instanceOf(Error) };


export default function LexicalEditorCore({ tabId, paragraphs }) {
    const editorInnerDivRef = useRef(null); // Ref for the scrolling container

    console.log(`[LexicalEditorCore] Rendering for tabId: ${tabId}`);

    const handleEditorError = (error) => {
        console.error(`LexicalEditorCore ErrorBoundary for tab ${tabId}:`, error);
    };

    return (
        // The ref goes on the scrollable container div
        <div ref={editorInnerDivRef} className="relative prose max-w-none p-4 lg:p-6 h-full overflow-y-auto" data-testid="lexical-editor-core" key={`editor-core-${tabId || 'no-tab'}`}>
             {/* Wrap standard plugins potentially causing render errors in boundary */}
             <LexicalErrorBoundary fallback={(error) => <EditorErrorFallback onError={handleEditorError} error={error}/>}>
                {/* Standard Lexical Plugins */}
                <RichTextPlugin
                    contentEditable={<ContentEditable className="outline-none focus:outline-none h-full caret-black" aria-label="Patent Description"/>}
                    placeholder={null} // No placeholder needed for display
                    // ErrorBoundary handled by the wrapper now
                />
                <HistoryPlugin />

                {/* Custom Application-Specific Plugins */}
                <InitialContentPlugin paragraphs={paragraphs} />
                {/* This plugin might just ensure context is ready, or could be removed if overlay handles initial render */}
                <ApplyInitialHighlightsPlugin tabId={tabId} paragraphs={paragraphs} />
                {/* Toolbar uses the ref to calculate position */}
                <HighlightToolbarPlugin editorInnerDivRef={editorInnerDivRef} tabId={tabId} />
                {/* --- Add the Overlay Plugin --- */}
                {/* Pass the same ref used by the toolbar */}
                <HighlightOverlayPlugin editorInnerDivRef={editorInnerDivRef} tabId={tabId} />
                {/* --- End Add Plugin --- */}
            </LexicalErrorBoundary>
        </div>
    );
}

// PropTypes remain the same
LexicalEditorCore.propTypes = {
    tabId: PropTypes.string,
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
};

LexicalEditorCore.defaultProps = {
  tabId: null,
  paragraphs: [],
};