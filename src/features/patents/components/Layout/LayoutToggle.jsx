// src/features/patents/components/Layout/LayoutToggle.jsx
import PropTypes from 'prop-types';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function LayoutToggle({ commentsVisible, toggleComments }) {
  const Icon = commentsVisible ? Minimize2 : Maximize2;
  const title = commentsVisible ? 'Hide comments (2 columns)' : 'Show comments (3 columns)';

  return (
    <button
      type="button"
      onClick={toggleComments}
      title={title}
      className="p-1 text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded"
      aria-label={title}
    >
      <Icon size={18} strokeWidth={2.5} />
    </button>
  );
}

LayoutToggle.propTypes = {
  commentsVisible: PropTypes.bool.isRequired,
  toggleComments: PropTypes.func.isRequired,
};