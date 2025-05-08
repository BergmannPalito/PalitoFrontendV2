// src/features/editor/components/EditorToolbar.jsx

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Highlighter, Trash2, Palette } from 'lucide-react';
import { CommentIcon } from '../../../assets/icons/custom/CommentIcon';

export default function HighlightToolbar({
  editor,
  position,
  isTextSelected,
  isHighlightSelected,
  onHighlight,
  onRemoveHighlight,
  onComment,
  currentColor,
  onColorChange,
  palette,
  canComment,
}) {
  const toolbarRef = useRef(null);
  const [showPalette, setShowPalette] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Only render when we have a position, and either text is selected or a highlight is selected
  if (!position || (!isTextSelected && !isHighlightSelected)) {
    return null;
  }

  const togglePalette = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPalette((v) => !v);
  };

  const pickColor = (c) => {
    onColorChange(c);
    setShowPalette(false);
  };

  return createPortal(
    <div
      ref={toolbarRef}
      onMouseDown={handleMouseDown}
      className="absolute z-[100] p-1 bg-white rounded-md shadow-lg border border-gray-200 flex items-center gap-1 select-none"
      style={{ top: position.top, left: position.left }}
      data-no-dnd="true"
    >
      {/* Color palette toggle */}
      {(isTextSelected || isHighlightSelected) && (
        <button
          type="button"
          onClick={togglePalette}
          className={clsx(
            'h-6 w-6 rounded-full border flex items-center justify-center',
            `bg-${currentColor}-300/40`
          )}
          title="Choose highlight color"
        >
          <Palette size={12} className="text-gray-700" />
        </button>
      )}

      {showPalette && (
        <div className="absolute top-full left-0 mt-1 grid grid-cols-5 gap-1 p-1 bg-white border shadow rounded z-10">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pickColor(c)}
              className={`h-5 w-5 rounded-full border bg-${c}-300/40`}
              title={c}
            />
          ))}
        </div>
      )}

      {/* Highlight button */}
      {(isTextSelected || isHighlightSelected) && (
        <button
          type="button"
          onClick={() => editor.update(onHighlight)}
          disabled={!isTextSelected}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-1',
            isTextSelected
              ? 'hover:bg-gray-100 text-gray-700'
              : 'opacity-50 cursor-not-allowed'
          )}
          title="Highlight selection"
        >
          <Highlighter size={16} />
          Highlight
        </button>
      )}

      {/* Remove highlight button */}
      {isHighlightSelected && (
        <button
          type="button"
          onClick={() => editor.update(onRemoveHighlight)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-gray-100 text-gray-700"
          title="Remove highlight"
        >
          <Trash2 size={16} />
          Remove
        </button>
      )}

      {/* Comment button */}
      {isTextSelected && canComment && (
        <button
          type="button"
          onClick={onComment}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-gray-100 text-gray-700"
          title="Add comment"
        >
          <CommentIcon className="h-4 w-4" />
          Comment
        </button>
      )}
    </div>,
    document.body
  );
}

HighlightToolbar.propTypes = {
  editor: PropTypes.object,
  position: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
  }),
  isTextSelected: PropTypes.bool.isRequired,
  isHighlightSelected: PropTypes.bool.isRequired,
  onHighlight: PropTypes.func.isRequired,
  onRemoveHighlight: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  currentColor: PropTypes.string.isRequired,
  onColorChange: PropTypes.func.isRequired,
  palette: PropTypes.arrayOf(PropTypes.string).isRequired,
  canComment: PropTypes.bool,
};

HighlightToolbar.defaultProps = {
  editor: null,
  position: null,
  canComment: true,
};