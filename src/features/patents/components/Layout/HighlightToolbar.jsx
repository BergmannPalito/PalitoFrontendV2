import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { Highlighter, Trash2, Palette } from 'lucide-react';
import clsx from 'clsx';
import { colorToBgClass } from '../../utils/highlightColorMap';

export default function HighlightToolbar({
  position,
  isTextSelected,
  isHighlightSelected,
  onHighlight,
  onRemoveHighlight,
  currentColor,
  onColorChange,
  palette,
}) {
  const toolbarRef = React.useRef(null);
  const [showPalette, setShowPalette] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (!position || (!isTextSelected && !isHighlightSelected)) return null;

  const togglePalette = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPalette((s) => !s);
  };

  const pickColor = (c) => {
    onColorChange(c);
    setShowPalette(false);
  };

  return createPortal(
    <div
      ref={toolbarRef}
      data-no-dnd="true"
      onMouseDown={handleMouseDown}
      className="absolute z-[100] p-1 bg-white rounded-md shadow-lg border border-gray-200 flex items-center gap-1 select-none"
      style={{ top: position.top, left: position.left }}
    >
      {/* palette toggle */}
      <button
        type="button"
        onClick={togglePalette}
        className={clsx(
          'h-6 w-6 rounded-full border',
          colorToBgClass[currentColor] || colorToBgClass.yellow,
        )}
        title="Choose highlight color"
      >
        <Palette size={12} className="mx-auto" />
      </button>

      {showPalette && (
        <div className="absolute top-full left-0 mt-1 grid grid-cols-5 gap-1 p-1 bg-white border shadow rounded">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pickColor(c)}
              className={`h-5 w-5 rounded-full border ${colorToBgClass[c]}`}
              title={c}
            />
          ))}
        </div>
      )}

      {/* highlight button */}
      <button
        type="button"
        onClick={onHighlight}
        disabled={!isTextSelected}
        className={clsx(
          'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded',
          'focus:outline-none focus:ring-1',
          !isTextSelected
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-100 text-gray-800',
        )}
        title="Highlight selection"
      >
        <Highlighter size={16} />
        Highlight
      </button>

      {/* remove button */}
      {isHighlightSelected && (
        <button
          type="button"
          onClick={onRemoveHighlight}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded hover:bg-gray-100 text-gray-800"
          title="Remove highlight"
        >
          <Trash2 size={16} />
          Remove
        </button>
      )}
    </div>,
    document.body,
  );
}

HighlightToolbar.propTypes = {
  position: PropTypes.shape({ top: PropTypes.number, left: PropTypes.number }),
  isTextSelected: PropTypes.bool.isRequired,
  isHighlightSelected: PropTypes.bool.isRequired,
  onHighlight: PropTypes.func.isRequired,
  onRemoveHighlight: PropTypes.func.isRequired,
  currentColor: PropTypes.string.isRequired,
  onColorChange: PropTypes.func.isRequired,
  palette: PropTypes.arrayOf(PropTypes.string).isRequired,
};

HighlightToolbar.defaultProps = { position: null };