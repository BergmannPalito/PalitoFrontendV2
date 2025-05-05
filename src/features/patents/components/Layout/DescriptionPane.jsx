// src/features/patents/components/Layout/DescriptionPane.jsx
import PropTypes from 'prop-types';
import clsx from 'clsx';
import LexicalDescriptionDisplay from './LexicalDescriptionDisplay';

export default function DescriptionPane({
  tabId,
  paragraphs,
  commentsVisible,
  /** NEW: whether this pane is currently the one on screen */
  isActive,
}) {
  return (
    <section
      className={clsx(
        'h-full overflow-y-auto relative transition-all duration-300 ease-in-out',
        commentsVisible ? 'basis-1/2' : 'basis-2/3',
        'border-r border-gray-200',
      )}
      data-testid="description-pane-scroll-container"
    >
      <LexicalDescriptionDisplay
        tabId={tabId}
        paragraphs={paragraphs}
        isActive={isActive} /* <-- pass down */
      />
    </section>
  );
}

DescriptionPane.propTypes = {
  tabId: PropTypes.string,
  paragraphs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string,
    }),
  ).isRequired,
  commentsVisible: PropTypes.bool.isRequired,
  isActive: PropTypes.bool, // NEW
};

DescriptionPane.defaultProps = {
  tabId: null,
  isActive: false,
};