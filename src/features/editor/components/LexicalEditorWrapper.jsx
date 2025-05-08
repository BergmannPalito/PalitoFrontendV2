// src/features/editor/components/LexicalEditorWrapper.jsx 
// (If you renamed it from LexicalDescriptionDisplay, adjust filename)
import React from 'react';
import PropTypes from 'prop-types';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TextNode, ParagraphNode } from 'lexical';

import LexicalEditorCore from './LexicalEditorCore';
import { editorTheme } from '../config/lexicalEditorConfig';

function LexicalErrorBoundaryComponent(error) {
  console.error('[LexicalWrapper ErrorBoundary]', error);
  return <div>Lexical Error! Check console.</div>;
}

export default function LexicalEditorWrapper({ // Renamed from LexicalDescriptionDisplay if that was the case
  tabId,
  paragraphs,
  isActive,
  showCommentsPaneForThisEditor, // NEW prop
}) {
  const composerKey = `lexical-display-${tabId || 'no-tab'}`;

  const initialConfig = {
    namespace: `PatentDescriptionEditor_${tabId || 'no_tab'}`,
    theme: editorTheme,
    onError: (error) => {
      console.error('Lexical initialConfig onError:', error);
    },
    editable: false,
    editorState: null,
    nodes: [TextNode, ParagraphNode], // Add any other custom nodes you use
  };

  return (
    <LexicalComposer initialConfig={initialConfig} key={composerKey}>
      <LexicalErrorBoundary fallback={LexicalErrorBoundaryComponent}>
        <LexicalEditorCore
          tabId={tabId}
          paragraphs={paragraphs}
          isActive={isActive}
          showCommentsPaneForThisEditor={showCommentsPaneForThisEditor} // Pass down
        />
      </LexicalErrorBoundary>
    </LexicalComposer>
  );
}

LexicalEditorWrapper.propTypes = {
  tabId: PropTypes.string,
  paragraphs: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  showCommentsPaneForThisEditor: PropTypes.bool, // NEW
};

LexicalEditorWrapper.defaultProps = {
  tabId: null,
  isActive: false,
  showCommentsPaneForThisEditor: false,
};