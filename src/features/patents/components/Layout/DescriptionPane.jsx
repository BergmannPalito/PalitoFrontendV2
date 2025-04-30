// src/features/patents/components/Layout/DescriptionPane.jsx
import PropTypes from 'prop-types';
import clsx from 'clsx';
import LexicalDescriptionDisplay from './LexicalDescriptionDisplay'; // Import the Lexical component

export default function DescriptionPane({ paragraphs, commentsVisible }) {

  return (
    <section
      className={clsx(
        'h-full overflow-y-auto relative transition-all duration-300 ease-in-out',
        // Widths based on comments visibility
        commentsVisible ? 'basis-1/2' : 'basis-2/3',
        // --- REMOVED THE GREEN SEPARATOR CLASSES ---
        // "after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-1 after:bg-emerald-500"
        // --- End Removal ---
        // Add a standard border instead if desired, or leave as is for no line
         "border-r border-gray-200" // Example: Add a subtle gray border to the right
      )}
    >
      {/* Render the Lexical component */}
      <LexicalDescriptionDisplay paragraphs={paragraphs} />
    </section>
  );
}

DescriptionPane.propTypes = {
  paragraphs: PropTypes.arrayOf(
      PropTypes.shape({
          id: PropTypes.string.isRequired,
          section: PropTypes.string,
          text: PropTypes.string.isRequired,
      })
  ).isRequired,
  commentsVisible: PropTypes.bool.isRequired,
};

DescriptionPane.defaultProps = {
    paragraphs: [],
};