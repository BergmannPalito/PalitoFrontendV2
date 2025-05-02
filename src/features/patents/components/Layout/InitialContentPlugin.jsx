// src/features/patents/components/Layout/InitialContentPlugin.jsx
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';

// This plugin sets the initial content of the editor based on the paragraphs prop.
export default function InitialContentPlugin({ paragraphs }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editor.update(() => {
            const root = $getRoot();
            root.clear(); // Clear any existing content

            if (paragraphs && paragraphs.length > 0) {
                paragraphs.forEach(para => {
                    const paragraphNode = $createParagraphNode();
                    // Handle potentially undefined text safely
                    const textContent = typeof para.text === 'string' ? para.text : '';
                    paragraphNode.append($createTextNode(textContent));
                    root.append(paragraphNode); // Append the new paragraph
                });
            } else {
                // Provide a fallback if no paragraphs are provided
                const paragraphNode = $createParagraphNode();
                paragraphNode.append($createTextNode('No description available.'));
                root.append(paragraphNode);
            }
        }, { tag: 'InitialContentPlugin' }); // Tag for debugging history

    // Re-run this effect only if the editor instance changes or
    // if the paragraphs array reference itself changes.
    }, [editor, paragraphs]);

    return null; // This plugin doesn't render anything itself
}

InitialContentPlugin.propTypes = {
    paragraphs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string,
        })
    ).isRequired,
};