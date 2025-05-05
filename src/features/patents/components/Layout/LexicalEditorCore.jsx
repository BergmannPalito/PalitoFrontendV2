// src/features/patents/components/Layout/LexicalEditorCore.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';

import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import InitialContentPlugin from './InitialContentPlugin';
import ApplyInitialHighlightsPlugin from './plugins/ApplyInitialHighlightsPlugin';
import HighlightToolbarPlugin from './plugins/HighlightToolbarPlugin';
import HighlightOverlayPlugin from './plugins/HighlightOverlayPlugin';

function EditorErrorFallback({ onError, error }) {
  onError(error);
  // eslint-disable-next-line no-console
  console.error('Lexical Rendering Error caught by Boundary:', error);
  return <div>Error rendering content. Check console.</div>;
}
EditorErrorFallback.propTypes = {
  onError: PropTypes.func.isRequired,
  error: PropTypes.instanceOf(Error),
};

export default function LexicalEditorCore({
  tabId,
  paragraphs,
  isActive, // NEW
}) {
  const editorInnerDivRef = useRef(null);

  return (
    <div
      ref={editorInnerDivRef}
      className="relative prose max-w-none p-4 lg:p-6 h-full overflow-y-auto"
      data-testid="lexical-editor-core"
      key={`editor-core-${tabId || 'no-tab'}`}
    >
      <LexicalErrorBoundary
        fallback={(error) => <EditorErrorFallback onError={() => {}} error={error} />}
      >
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none focus:outline-none h-full caret-black"
              aria-label="Patent Description"
            />
          }
          placeholder={null}
        />
        <HistoryPlugin />

        {/* custom plugins */}
        <InitialContentPlugin paragraphs={paragraphs} />
        <ApplyInitialHighlightsPlugin tabId={tabId} paragraphs={paragraphs} />
        <HighlightToolbarPlugin
          editorInnerDivRef={editorInnerDivRef}
          tabId={tabId}
        />
        <HighlightOverlayPlugin
          editorInnerDivRef={editorInnerDivRef}
          tabId={tabId}
          isActive={isActive} /* <-- NEW */
        />
      </LexicalErrorBoundary>
    </div>
  );
}

LexicalEditorCore.propTypes = {
  tabId: PropTypes.string,
  paragraphs: PropTypes.array.isRequired,
  isActive: PropTypes.bool, // NEW
};

LexicalEditorCore.defaultProps = {
  tabId: null,
  isActive: false,
};