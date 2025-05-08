// src/features/editor/components/LexicalEditorCore.jsx
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

// Lexical Core Components & Plugins
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'; // Keep if needed by other logic here eventually
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

// Your Custom Application Plugins & Components
import InitialContentPlugin from '../plugins/InitialContentPlugin';
import ApplyInitialHighlightsPlugin from '../../highlights/plugins/ApplyInitialHighlightsPlugin';
import HighlightToolbarPlugin from '../plugins/EditorToolbarPlugin';
import HighlightOverlayPlugin from '../../highlights/plugins/HighlightOverlayPlugin';
import CommentSidebar from '@/features/comments/components/CommentSidebar'; // Import CommentSidebar for Portal
import CommentsPlugin from '@/features/comments/plugins/CommentsPlugin'; // Import the new CommentsPlugin

// Fallback component for Lexical errors
function EditorErrorFallback({ onError, error }) {
  onError(error); // You might want to log this error to a reporting service
  console.error('Lexical Rendering Error caught by Boundary:', error);
  return <div className="p-4 text-red-600">Error rendering editor content. Please check console.</div>;
}
EditorErrorFallback.propTypes = {
  onError: PropTypes.func.isRequired,
  error: PropTypes.instanceOf(Error),
};

/**
 * LexicalEditorCore sets up the main editor instance within a LexicalComposer context.
 * It includes standard plugins, application-specific plugins (like highlights, comments),
 * and manages rendering the CommentSidebar into a portal target when active.
 */
export default function LexicalEditorCore({
  tabId, // Identifier for the current document/tab
  paragraphs, // Initial content for the editor
  isActive, // Whether this editor instance corresponds to the currently active tab
  showCommentsPaneForThisEditor, // Whether the comments sidebar area is globally visible for this active editor
}) {
  // Ref for the div containing the ContentEditable element and highlight overlays
  const editorInnerDivRef = useRef(null);
  // State to hold the DOM node for the portal target
  const [portalTargetNode, setPortalTargetNode] = useState(null);

  // Effect to find the portal target DOM node when conditions are right
  useEffect(() => {
    // We only need the portal target if this editor is active AND the comment pane is supposed to be shown
    if (isActive && showCommentsPaneForThisEditor && typeof window !== 'undefined') {
      const target = document.getElementById('comment-sidebar-portal-target');
      setPortalTargetNode(target);
      // Log if target found or not for debugging
      // console.log(`[LexicalEditorCore ${tabId}] Portal target search: ${target ? 'Found' : 'Not Found'}`);
    } else {
      // If conditions aren't met, ensure we don't hold a reference to the target
      setPortalTargetNode(null);
    }
    // Dependencies: Re-run when the editor becomes active/inactive or the global comment visibility changes
  }, [isActive, showCommentsPaneForThisEditor, tabId]); // Added tabId for logging context


  return (
    // This outer div holds the ContentEditable and the HighlightOverlayPlugin relies on its relative positioning
    <div
      ref={editorInnerDivRef}
      className="relative prose max-w-none p-4 lg:p-6 h-full overflow-y-auto" // Ensure scrolling is handled here
      data-testid="lexical-editor-core"
      key={`editor-core-${tabId || 'no-tab'}`} // Key ensures component re-mount if tabId changes, resetting state
    >
      <LexicalErrorBoundary
        fallback={(error) => <EditorErrorFallback onError={() => {}} error={error} />}
      >
        {/* Core Rich Text Editing Setup */}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none focus:outline-none h-full caret-black" // Ensure h-full if container handles height
              aria-label="Patent Description"
            />
          }
          placeholder={null} // No placeholder for read-only display usually
          ErrorBoundary={LexicalErrorBoundary} // Can use the same boundary again
        />
        {/* Standard Plugins */}
        <HistoryPlugin /> {/* Might not be strictly needed for read-only, but harmless */}

        {/* Custom Application Plugins */}
        <InitialContentPlugin paragraphs={paragraphs} />
        {/* ApplyInitialHighlightsPlugin might depend on content being loaded */}
        <ApplyInitialHighlightsPlugin tabId={tabId} paragraphs={paragraphs} />

        {/* Plugins that interact with selection/UI */}
        <HighlightToolbarPlugin editorInnerDivRef={editorInnerDivRef} tabId={tabId} />
        <HighlightOverlayPlugin editorInnerDivRef={editorInnerDivRef} tabId={tabId} isActive={isActive} />

        {/* NEW: Comments Plugin - Handles comment creation logic */}
        {/* Render only if tabId is available, as it relies on it */}
        {tabId && <CommentsPlugin tabId={tabId} />}

        {/* Portal for Comment Sidebar */}
        {/* Render CommentSidebar via Portal if:
            - This editor is active
            - The global comment pane is visible for this editor
            - The portal target DOM node has been found
            - A valid tabId exists
        */}
        {isActive && showCommentsPaneForThisEditor && portalTargetNode && tabId && (
          createPortal(<CommentSidebar tabId={tabId} />, portalTargetNode)
        )}
      </LexicalErrorBoundary>
    </div>
  );
}

// PropTypes
LexicalEditorCore.propTypes = {
  tabId: PropTypes.string,
  paragraphs: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  showCommentsPaneForThisEditor: PropTypes.bool,
};

// Default Props
LexicalEditorCore.defaultProps = {
  tabId: null,
  isActive: false,
  showCommentsPaneForThisEditor: false,
};