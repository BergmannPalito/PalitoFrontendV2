// src/features/patents/components/Layout/DescriptionPane.jsx
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function DescriptionPane({ htmlContent, commentsVisible }) {
  // Helper for raw HTML
  const html = (str) => ({ __html: str || '<p>No description available.</p>' });

  return (
    <section
      className={clsx(
        'h-full overflow-y-auto relative transition-all duration-300 ease-in-out',
        // Widths based on comments visibility
        commentsVisible ? 'basis-1/2' : 'basis-2/3',
        // Separator styling - always targets the next sibling
        "after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-1 after:bg-emerald-500"
      )}
    >
      <div
        className="prose max-w-none p-4 lg:p-6" // Added padding
        dangerouslySetInnerHTML={html(htmlContent)}
      />
    </section>
  );
}

DescriptionPane.propTypes = {
  htmlContent: PropTypes.string,
  commentsVisible: PropTypes.bool.isRequired,
};