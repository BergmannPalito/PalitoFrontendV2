// src/features/patents/components/Layout/DescriptionPane.jsx
import PropTypes from 'prop-types';
import clsx from 'clsx';
import LexicalDescriptionDisplay from './LexicalDescriptionDisplay';
// Removed useRef import

export default function DescriptionPane({ tabId, paragraphs, commentsVisible }) {
  // Removed ref creation: const scrollContainerRef = useRef(null);

  return (
    <section
      // Removed ref attachment
      className={clsx(
        'h-full overflow-y-auto relative transition-all duration-300 ease-in-out',
        commentsVisible ? 'basis-1/2' : 'basis-2/3',
         "border-r border-gray-200"
      )}
      data-testid="description-pane-scroll-container"
    >
      {/* Do not pass the ref down anymore */}
      <LexicalDescriptionDisplay
        tabId={tabId}
        paragraphs={paragraphs}
        // scrollContainerRef={scrollContainerRef} // Removed prop
      />
    </section>
  );
}

DescriptionPane.propTypes = {
  tabId: PropTypes.string,
  paragraphs: PropTypes.arrayOf(
      PropTypes.shape({
          id: PropTypes.string.isRequired,
          // section: PropTypes.string,
          text: PropTypes.string,
      })
  ).isRequired,
  commentsVisible: PropTypes.bool.isRequired,
};

DescriptionPane.defaultProps = {
    tabId: null,
    paragraphs: [],
};