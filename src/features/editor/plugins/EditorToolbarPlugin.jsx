// features/patents/components/Layout/plugins/HighlightToolbarPlugin.jsx
import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { useToolbar } from '../hooks/useToolbar';
import { useHighlightHandler } from '../../highlights/hooks/useHighlightHandler';
import HighlightToolbar from '../components/EditorToolbar';
import { COLOR_LIST } from '../../highlights/utils/highlightColorMap';

export default function HighlightToolbarPlugin({ editorInnerDivRef, tabId }) {
  const [editor] = useLexicalComposerContext();

  /* ---------- keep last‑chosen color in state (default: yellow) ---------- */
  const [currentColor, setCurrentColor] = useState('yellow');

  /* ---------- selection / positioning logic ---------- */
  const {
    showToolbar,
    toolbarPosition,
    isTextSelected,
    isHighlightedTextSelected,
  } = useToolbar(editorInnerDivRef, tabId);

  /* ---------- highlight handlers that use the CURRENT color ---------- */
  const { handleHighlight, handleRemoveHighlight } = useHighlightHandler(
    tabId,
    currentColor,
  );

  /* ---------- callbacks passed down ---------- */
  const onHighlight = useCallback(() => {
    handleHighlight();
  }, [handleHighlight]);

  const onRemoveHighlight = useCallback(() => {
    handleRemoveHighlight();
  }, [handleRemoveHighlight]);

  const onColorChange = useCallback((newColor) => {
    setCurrentColor(newColor);                // triggers re‑render immediately
  }, []);

  /* ---------- render ---------- */
  return (
    <>
      {showToolbar &&
        document.body &&
        createPortal(
          <HighlightToolbar
            editor={editor}
            position={toolbarPosition}
            isTextSelected={isTextSelected}
            isHighlightSelected={isHighlightedTextSelected}
            onHighlight={onHighlight}
            onRemoveHighlight={onRemoveHighlight}
            currentColor={currentColor}
            onColorChange={onColorChange}
            palette={COLOR_LIST}
          />,
          document.body,
        )}
    </>
  );
}

HighlightToolbarPlugin.propTypes = {
  editorInnerDivRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
  tabId: PropTypes.string,
};