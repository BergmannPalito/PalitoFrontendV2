// src/features/comments/components/CommentInput.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const CommentInput = ({
  onSubmit,
  onCancel,
  initialText = '',
  placeholder = "Add a comment...",
  submitLabel = "Submit",
  showCancel = false,
  autoFocus = false,
  className = '',
}) => {
  const [text, setText] = useState(initialText);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText(''); // Clear input after submit
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setText(''); // Clear input on cancel
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm"
        rows="3"
        autoFocus={autoFocus}
        required
      />
      <div className="flex items-center justify-end space-x-2">
        {showCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          disabled={!text.trim()}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

CommentInput.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialText: PropTypes.string,
  placeholder: PropTypes.string,
  submitLabel: PropTypes.string,
  showCancel: PropTypes.bool,
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
};

export default CommentInput;