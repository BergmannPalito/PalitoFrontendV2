// src/features/patents/components/Layout/LexicalDescriptionDisplay.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TextNode, ParagraphNode } from 'lexical';

import LexicalEditorCore from './LexicalEditorCore';
import { editorTheme } from '../../config/lexicalConfig';

function LexicalErrorBoundaryComponent(error) {
  // eslint-disable-next-line no-console
  console.error('[LexicalDescriptionDisplay ErrorBoundary]', error);
  return <div>Lexical Error! Check console.</div>;
}

export default function LexicalDescriptionDisplay({
  tabId,
  paragraphs,
  isActive, // NEW
}) {
  const composerKey = `lexical-display-${tabId || 'no-tab'}`;

  const initialConfig = {
    namespace: `PatentDescriptionEditor_${tabId || 'no_tab'}`,
    theme: editorTheme,
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Lexical initialConfig onError:', error);
    },
    editable: false,
    editorState: null,
    nodes: [TextNode, ParagraphNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig} key={composerKey}>
      <LexicalErrorBoundary fallback={LexicalErrorBoundaryComponent}>
        <LexicalEditorCore
          tabId={tabId}
          paragraphs={paragraphs}
          isActive={isActive} /* <-- pass down */
        />
      </LexicalErrorBoundary>
    </LexicalComposer>
  );
}

LexicalDescriptionDisplay.propTypes = {
  tabId: PropTypes.string,
  paragraphs: PropTypes.array.isRequired,
  isActive: PropTypes.bool, // NEW
};

LexicalDescriptionDisplay.defaultProps = {
  tabId: null,
  isActive: false,
};
