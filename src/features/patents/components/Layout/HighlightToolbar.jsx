// src/features/patents/components/Layout/HighlightToolbar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { Highlighter } from 'lucide-react'; // Only need Highlighter icon now
import clsx from 'clsx';

export default function HighlightToolbar({
  editor, // The Lexical editor instance
  showToolbar, // Boolean to control visibility
  position, // { top, left } object for positioning
  isTextSelected, // Is there a non-collapsed selection?
  onHighlight, // Function to call to add highlight
}) {
  const toolbarRef = React.useRef(null);

  // Prevent clicks inside the toolbar from affecting the editor selection (mousedown)
  const handleMouseDown = (event) => {
    event.preventDefault();
  };

  if (!showToolbar || !position) {
    return null;
  }

  // Handle the button click
  const handleButtonClick = (e) => { // Accept the event object 'e'
    // --- FIX: Prevent default click behavior ---
    e.preventDefault();
    // --- END FIX ---
    if (isTextSelected && onHighlight) { // Ensure text is still selected and handler exists
        onHighlight();
    }
  };

  const buttonIcon = <Highlighter size={16} />;
  const buttonText = 'Highlight';
  const buttonClass = 'hover:bg-yellow-100 text-yellow-700';

  return createPortal(
    <div
      ref={toolbarRef}
      className="absolute z-50 p-1 bg-white rounded-md shadow-lg border border-gray-200 flex items-center gap-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        visibility: position.top === 0 && position.left === 0 ? 'hidden' : 'visible',
      }}
      onMouseDown={handleMouseDown} // Prevent editor focus loss/selection change on mousedown
    >
      <button
        type="button"
        onClick={handleButtonClick} // Use the handler which now prevents default
        title={buttonText}
        disabled={!isTextSelected} // Disable if no text is selected
        className={clsx(
          'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-1 focus:ring-emerald-500',
          buttonClass,
          !isTextSelected && 'opacity-50 cursor-not-allowed' // Style disabled state
        )}
      >
        {buttonIcon}
        <span>{buttonText}</span>
      </button>
    </div>,
    document.body // Render the toolbar in the body
  );
}

HighlightToolbar.propTypes = {
  editor: PropTypes.object,
  showToolbar: PropTypes.bool.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
  }),
  isTextSelected: PropTypes.bool.isRequired,
  onHighlight: PropTypes.func.isRequired,
};

HighlightToolbar.defaultProps = {
    position: null,
    editor: null,
};