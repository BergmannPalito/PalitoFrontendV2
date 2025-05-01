// src/features/patents/components/Layout/FiguresContent.jsx
// No changes needed from the previous version provided.
// It correctly renders the grid and calls the onFigureSelect prop.

import PropTypes from 'prop-types';

export default function FiguresContent({ patent, onFigureSelect }) {
    const figuresList = Array.isArray(patent?.figures) ? patent.figures : [];

    return (
        <>
            {figuresList.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                    {figuresList.map((figure) => (
                        <button
                            key={figure.id}
                            type="button"
                            onClick={() => onFigureSelect(figure)}
                            className="block border border-gray-200 shadow-sm bg-white p-1 rounded hover:shadow-md hover:ring-2 hover:ring-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition duration-150 ease-in-out"
                            aria-label={`View details for ${figure.caption || figure.id}`}
                        >
                            {figure.image ? (
                                <div className="w-full h-48 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={figure.image}
                                        alt={figure.caption || `Figure ${figure.id}`}
                                        className="max-w-full max-h-full object-contain pointer-events-none"
                                        loading="lazy"
                                    />
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
                                    Image not available
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 text-center">No figures found for this patent.</p>
            )}
        </>
    );
}

FiguresContent.propTypes = {
    patent: PropTypes.shape({
        patentNr: PropTypes.string,
        figures: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            caption: PropTypes.string,
            image: PropTypes.string,
            page: PropTypes.number,
        })),
    }),
    onFigureSelect: PropTypes.func.isRequired,
};

FiguresContent.defaultProps = {
    patent: {
        patentNr: '',
        figures: [],
    },
};