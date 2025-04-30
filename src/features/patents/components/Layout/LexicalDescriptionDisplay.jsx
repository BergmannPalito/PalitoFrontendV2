// src/features/patents/components/Layout/LexicalDescriptionDisplay.jsx
import PropTypes from 'prop-types';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
// --- CORRECTED IMPORT: Use named import for LexicalErrorBoundary ---
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
// --- End Correction ---
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// Basic Theme (can be customized)
const editorTheme = {
  // Theme styling goes here if needed, e.g., for specific nodes
  // paragraph: 'my-paragraph-class',
  text: {
      // Example: Make bold text use Tailwind classes
      // bold: 'font-bold',
  },
};

// Error Handler Component
function LexicalErrorBoundaryComponent(error) {
  console.error("[Lexical Error]", error);
  // Render the error inside the LexicalErrorBoundary itself
  // It expects the error object as a prop.
  return <LexicalErrorBoundary error={error} />;
}

// Plugin to initialize editor content from paragraphs prop
function InitialContentPlugin({ paragraphs }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear(); // Clear existing content

      if (paragraphs && paragraphs.length > 0) {
        paragraphs.forEach(para => {
          const paragraphNode = $createParagraphNode();
          // Add paragraph ID as a data attribute (optional, might be useful later)
          // You might need a custom node or decorator for more complex data binding
          // For simplicity, we just add the text for now.
          paragraphNode.append($createTextNode(para.text || '')); // Ensure text is not undefined
          root.append(paragraphNode);
        });
      } else {
        // Handle empty state
        const paragraphNode = $createParagraphNode();
        paragraphNode.append($createTextNode('No description available.'));
        root.append(paragraphNode);
      }

      // Make the editor non-editable after setting initial state
      // editor.setEditable(false); // SetEditable happens in LexicalComposer config now

    });
    // Run only when paragraphs data changes
  }, [editor, paragraphs]);

  return null; // This plugin doesn't render anything
}

InitialContentPlugin.propTypes = {
  paragraphs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
};


// The main component using LexicalComposer
export default function LexicalDescriptionDisplay({ paragraphs }) {

  const initialConfig = {
    namespace: 'PatentDescriptionEditor',
    theme: editorTheme,
    onError: (error) => { // Pass error to the boundary component function
        console.error("Lexical initialConfig onError:", error);
        // We don't render the component here directly,
        // LexicalErrorBoundary used in RichTextPlugin handles the UI
    },
    editable: false, // Make the editor read-only
    editorState: null, // Let the plugin handle initial state
    nodes: [
        // Add necessary nodes if you use more than basic text/paragraphs
        // e.g., HeadingNode, ListNode, ListItemNode from @lexical/rich-text
    ],
  };

  // Use a key based on the first paragraph ID (or a timestamp) to force
  // re-initialization when the patent data changes significantly.
  // This helps if the InitialContentPlugin doesn't robustly handle updates.
  const composerKey = paragraphs?.[0]?.id || Date.now();

  return (
    <LexicalComposer initialConfig={initialConfig} key={composerKey}>
      <div className="relative prose max-w-none p-4 lg:p-6"> {/* Maintain padding from DescriptionPane */}
        <RichTextPlugin
          contentEditable={
             // Apply Tailwind prose styles for basic formatting
            <ContentEditable className="outline-none focus:outline-none" />
           }
          placeholder={null} // No placeholder needed for read-only display
          // --- Use the imported LexicalErrorBoundary correctly ---
          ErrorBoundary={LexicalErrorBoundary}
          // --- End Usage Correction ---
        />
        {/* HistoryPlugin is usually for editable editors, might not be strictly necessary here */}
        <HistoryPlugin />
        {/* Custom plugin to load the initial paragraphs */}
        <InitialContentPlugin paragraphs={paragraphs} />
      </div>
    </LexicalComposer>
  );
}

LexicalDescriptionDisplay.propTypes = {
  paragraphs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      section: PropTypes.string,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
};

// Add defaultProps
LexicalDescriptionDisplay.defaultProps = {
    paragraphs: [],
};