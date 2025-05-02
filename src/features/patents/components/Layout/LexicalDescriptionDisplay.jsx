// src/features/patents/components/Layout/LexicalDescriptionDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';

// Lexical Imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TextNode, ParagraphNode } from 'lexical'; // Import necessary nodes

// Local Imports
import LexicalEditorCore from './LexicalEditorCore'; // Import the refactored core component
import { editorTheme } from '../../config/lexicalConfig'; // Import theme configuration

// Simple Error Boundary Wrapper (can stay here or move to shared utils)
function LexicalErrorBoundaryComponent(error) {
    console.error("[Lexical Error]", error);
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
        onError: (error) => { console.error("Lexical initialConfig onError:", error); },
        editable: false, // The editor content is not directly editable by the user
        editorState: null, // Initialize with null state
        nodes: [
            TextNode,       // Register required nodes
            ParagraphNode,
            // Add other nodes if needed (e.g., LinkNode, ListNode)
        ],
    };

    return (
        <LexicalComposer initialConfig={initialConfig} key={composerKey}>
            {/* Provide a top-level error boundary for the editor */}
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