// src/features/patents/components/Layout/DescriptionPane.jsx
import PropTypes from 'prop-types';
import clsx from 'clsx';
import LexicalDescriptionDisplay from '../../../editor/components/LexicalEditorWrapper';

export default function DescriptionPane({
  tabId,
  paragraphs,
  commentsVisible, // This prop influences the width of DescriptionPane
  isActive,
  showCommentsPaneForThisEditor, // NEW: To control rendering of portalled sidebar
}) {
  return (
    <section
      className={clsx(
        'h-full overflow-y-auto relative transition-all duration-300 ease-in-out',
        // Width of DescriptionPane adjusts based on whether comments sidebar is globally visible
        commentsVisible ? 'basis-1/2' : 'basis-2/3', 
        'border-r border-gray-200',
      )}
      data-testid="description-pane-scroll-container"
    >
      <LexicalDescriptionDisplay
        tabId={tabId}
        paragraphs={paragraphs}
        isActive={isActive}
        showCommentsPaneForThisEditor={showCommentsPaneForThisEditor} // Pass down
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
  isActive: PropTypes.bool,
  showCommentsPaneForThisEditor: PropTypes.bool, // NEW
};

DescriptionPane.defaultProps = {
  tabId: null,
  isActive: false,
  showCommentsPaneForThisEditor: false, // Default to false
};