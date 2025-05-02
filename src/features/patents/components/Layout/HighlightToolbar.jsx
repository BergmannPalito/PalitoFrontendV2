// src/features/patents/components/Layout/HighlightToolbar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
// --- Import necessary icons ---
import { Highlighter, Trash2 } from 'lucide-react';
import clsx from 'clsx';

export default function HighlightToolbar({
  editor,
  position, // Receives { top, left } - Assuming left is used based on previous state
  isTextSelected,
  // --- Receive new props ---
  isHighlightSelected, // Boolean: is the selected text currently highlighted?
  onHighlight,
  onRemoveHighlight, // Function to call for removing highlight
  // --- End new props ---
}) {
  const toolbarRef = React.useRef(null);

  // Prevent mousedown on toolbar from deselecting text
  const handleMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // --- Determine if the toolbar should be shown at all ---
  // Show if there's a valid position AND either text is selected (for Add)
  // OR highlighted text is selected (for Remove)
  const showToolbar = position && (isTextSelected || isHighlightSelected);

  // --- Render null if toolbar shouldn't be shown ---
  if (!showToolbar) {
     return null;
  }

  // --- Handlers for button clicks ---
  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTextSelected && onHighlight) {
        onHighlight();
    }
  };

  const handleRemoveClick = (e) => {
     e.preventDefault();
     e.stopPropagation();
     // Only call remove if highlighted text is actually selected
     if (isHighlightSelected && onRemoveHighlight) {
         onRemoveHighlight();
     }
   };
  // --- End Handlers ---


  return createPortal(
    <div
      ref={toolbarRef}
      data-no-dnd="true" // Keep for compatibility if needed
      className={clsx(
        "absolute z-[100] p-1 bg-white rounded-md shadow-lg border border-gray-200 flex items-center gap-1", // Use higher z-index
        'select-none' // Prevent text selection of the toolbar itself
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`, // Using left positioning
        visibility: 'visible', // Visibility is now controlled by the conditional render above
      }}
      onMouseDown={handleMouseDown} // Prevent deselect on click
    >
        {/* --- Add Highlight Button --- */}
        {/* Always show this button if text is selected, disable if not */}
        <button
            type="button"
            onClick={handleAddClick}
            title="Highlight Selection"
            disabled={!isTextSelected} // Disable if no text is selected
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'hover:bg-yellow-100 text-yellow-700', // Highlight styling
              !isTextSelected && 'opacity-50 cursor-not-allowed', // Disabled style
              'select-none'
            )}
        >
            <Highlighter size={16} />
            <span>Highlight</span>
        </button>

        {/* --- NEW: Remove Highlight Button --- */}
        {/* Only render this button if highlighted text is selected */}
        {isHighlightSelected && (
            <button
                type="button"
                onClick={handleRemoveClick}
                title="Remove Highlight from Selection"
                className={clsx(
                    'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-1 focus:ring-red-500',
                    'hover:bg-red-100 text-red-600', // Remove styling
                    'select-none'
                )}
             >
                <Trash2 size={16} />
                <span>Remove</span>
            </button>
        )}
        {/* --- END NEW BUTTON --- */}

    </div>,
    document.body
  );
}

HighlightToolbar.propTypes = {
  editor: PropTypes.object, // Lexical editor instance (optional)
  position: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number, // Expect left positioning
  }),
  isTextSelected: PropTypes.bool.isRequired,
  // --- Add PropTypes for new props ---
  isHighlightSelected: PropTypes.bool.isRequired,
  onHighlight: PropTypes.func.isRequired,
  onRemoveHighlight: PropTypes.func.isRequired,
  // --- End ---
};

HighlightToolbar.defaultProps = {
    position: null, // Default position to null
    editor: null,
    // --- Add defaults ---
    isHighlightSelected: false,
    // --- End ---
};