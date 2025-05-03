// src/features/patents/components/Layout/LexicalDescriptionDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';

// Lexical Imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TextNode, ParagraphNode } from 'lexical'; // Import necessary CORE nodes

// Local Imports
import LexicalEditorCore from './LexicalEditorCore'; // Import the refactored core component
import { editorTheme } from '../../config/lexicalConfig'; // Import theme configuration
// --- REMOVE the import for the custom node ---
// import { HighlightSpanNode } from '../../nodes/HighlightSpanNode.jsx'; // DELETE THIS LINE
// --- End Removal ---

// Simple Error Boundary Wrapper (can stay here or move to shared utils)
function LexicalErrorBoundaryComponent(error) {
    // Log the actual error object caught by the boundary
    console.error("[LexicalDescriptionDisplay ErrorBoundary Caught]", error);
    // Also log the error passed to the fallback component for clarity
    // console.error("[Lexical Error Fallback Prop]", fallbackErrorProp); // fallbackErrorProp is the argument name
    return <div>Lexical Error! Check console.</div>;
}

// Outer component responsible for setting up the Lexical Composer context
export default function LexicalDescriptionDisplay({ tabId, paragraphs }) {
    // Unique key ensures the composer remounts when the tab changes, resetting state correctly
    const composerKey = `lexical-display-${tabId || 'no-tab'}`;

    // Configuration for the Lexical Composer instance
    const initialConfig = {
        namespace: `PatentDescriptionEditor_${tabId || 'no_tab'}`,
        theme: editorTheme, // Use imported theme
        // Make sure the onError here is catching errors originating from Lexical itself
        onError: (error, editor) => {
            console.error("Lexical initialConfig onError:", error);
            // You might want additional reporting here
        },
        editable: false, // The editor content is not directly editable by the user
        editorState: null, // Initialize with null state
        nodes: [
            // Only include CORE nodes or other nodes you *are* using
            TextNode,
            ParagraphNode,
            // --- REMOVE the custom Node from registration ---
            // HighlightSpanNode, // DELETE THIS LINE
            // --- End Removal ---
        ],
    };

    return (
        <LexicalComposer initialConfig={initialConfig} key={composerKey}>
            {/* Use the custom fallback component for the boundary */}
            <LexicalErrorBoundary fallback={LexicalErrorBoundaryComponent}>
                {/* Render the core editor logic component */}
                <LexicalEditorCore
                    tabId={tabId}
                    paragraphs={paragraphs}
                />
            </LexicalErrorBoundary>
        </LexicalComposer>
    );
}

LexicalDescriptionDisplay.propTypes = {
    tabId: PropTypes.string,
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
};

LexicalDescriptionDisplay.defaultProps = {
    tabId: null,
    paragraphs: [],
};