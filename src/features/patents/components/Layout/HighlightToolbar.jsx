// src/features/patents/components/Layout/HighlightToolbar.jsx
// VERSION REVERTED to use LEFT positioning

import React from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { Highlighter } from 'lucide-react';
import clsx from 'clsx';

export default function HighlightToolbar({
  editor,
  showToolbar,
  position, // Receives { top, left }
  isTextSelected,
  onHighlight,
}) {
  const toolbarRef = React.useRef(null);

  const handleMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // console.log('[HighlightToolbar] handleMouseDown: Target:', event.target);
  };

  // Log props (optional, can be removed if not debugging visibility)
  // console.log('[HighlightToolbar] Rendering. Props:', { showToolbar, position, isTextSelected });

  // Check if position is valid (using left now)
  const isPositionValid = typeof position?.top === 'number' && typeof position?.left === 'number';
  // console.log('[HighlightToolbar] Calculated isPositionValid (using left):', isPositionValid);

  // Render null if visibility conditions aren't met
  if (!showToolbar || !isPositionValid) {
     // console.log('[HighlightToolbar] Rendering null.');
     return null;
  }

  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log('[HighlightToolbar] handleButtonClick triggered.');
    if (isTextSelected && onHighlight) {
        onHighlight();
    }
  };

  const buttonIcon = <Highlighter size={16} />;
  const buttonText = 'Highlight';
  const buttonClass = 'hover:bg-yellow-100 text-yellow-700';

  return createPortal(
    <div
      ref={toolbarRef}
      data-no-dnd="true" // Keep this
      className={clsx(
        "absolute z-50 p-1 bg-white rounded-md shadow-lg border border-gray-200 flex items-center gap-1",
        'select-none'
      )}
      style={{
        top: `${position.top}px`,
        // --- Revert to using 'left' property ---
        left: `${position.left}px`,
        // right: undefined, // Ensure right is not used
        // ---
        // visibility: 'visible', // Visibility handled by conditional render
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        type="button"
        onClick={handleButtonClick}
        title={buttonText}
        disabled={!isTextSelected}
        className={clsx(
          'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-1 focus:ring-emerald-500',
          buttonClass,
          !isTextSelected && 'opacity-50 cursor-not-allowed',
          'select-none'
        )}
      >
        {buttonIcon}
        <span>{buttonText}</span>
      </button>
    </div>,
    document.body
  );
}

// PropTypes reverted to expect left
HighlightToolbar.propTypes = {
  editor: PropTypes.object,
  showToolbar: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number,
    // Expect left, right is optional/ignored
    left: PropTypes.number,
    right: PropTypes.number,
  }),
  isTextSelected: PropTypes.bool.isRequired,
  onHighlight: PropTypes.func.isRequired,
};

// DefaultProps reverted
HighlightToolbar.defaultProps = {
    position: { top: 0, left: 0 }, // Default back to left: 0
    editor: null,
};