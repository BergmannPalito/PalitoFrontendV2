// src/features/patents/components/Layout/FiguresContent.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
    ArrowLeft,
    ZoomIn,
    ZoomOut,
    RotateCw,
    FlipHorizontal,
    RefreshCcw
} from 'lucide-react';

export default function FiguresContent({ patent }) {
    const figuresList = Array.isArray(patent?.figures) ? patent.figures : [];

    // State for Detailed View and Transformations
    const [selectedFigure, setSelectedFigure] = useState(null);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (selectedFigure) {
            setScale(1);
            setRotation(0);
            setIsFlipped(false);
        }
    }, [selectedFigure]);

    // Handlers
    const showDetailedFigure = (figure) => setSelectedFigure(figure);
    const showFigureGrid = () => setSelectedFigure(null);
    const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.2));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const handleMirror = () => setIsFlipped(prev => !prev);
    const handleReset = () => {
        setScale(1);
        setRotation(0);
        setIsFlipped(false);
    };

    return (
        // Container for figures content, padding/scrolling handled by parent Tab.Panel
        <div className="relative h-full"> {/* Needed for positioning controls/back button */}
            {selectedFigure ? (
                // --- Detailed Figure View ---
                <>
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={showFigureGrid}
                        className="absolute top-0 left-0 z-20 mb-3 inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-1 bg-white/70 hover:bg-white shadow"
                        aria-label="Back to figures grid"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>

                    {/* Transformation Controls */}
                    <div className="absolute top-1/2 right-2 z-20 -translate-y-1/2 flex flex-col gap-1 bg-white rounded shadow-lg border border-gray-200 p-1">
                         <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><ZoomIn size={18} /></button>
                         <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><ZoomOut size={18} /></button>
                         <button onClick={handleRotate} title="Rotate 90° CW" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><RotateCw size={18} /></button>
                         <button onClick={handleMirror} title="Mirror Horizontal" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><FlipHorizontal size={18} /></button>
                         <button onClick={handleReset} title="Reset View" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><RefreshCcw size={18} /></button>
                    </div>

                    {/* Image Display Area */}
                    <div className="pt-10 h-full flex justify-center items-center overflow-hidden">
                        {selectedFigure.image ? (
                            <img
                                src={selectedFigure.image}
                                alt={`Detailed view of ${selectedFigure.caption || selectedFigure.id}`}
                                className="max-w-full max-h-full object-contain transition-transform duration-200 ease-in-out"
                                style={{
                                    transform: `scale(${scale}) rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
                                    transformOrigin: 'center center',
                                }}
                            />
                        ) : (
                            <div className="h-64 flex items-center justify-center bg-gray-100 text-gray-500">
                                Image not available
                            </div>
                        )}
                    </div>
                     {/* Optional Title */}
                      <h3 className="text-center text-xs font-medium text-gray-500 mt-2">
                         {patent?.patentNr} - {selectedFigure.caption || selectedFigure.id}
                      </h3>
                </>
                // --- End Detailed Figure View ---

            ) : (
                // --- Figure Grid View ---
                <>
                    {figuresList.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            {figuresList.map((figure) => (
                                <button
                                    key={figure.id}
                                    type="button"
                                    onClick={() => showDetailedFigure(figure)}
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
                // --- End Figure Grid View ---
            )}
        </div>
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
};

FiguresContent.defaultProps = {
    patent: {
        patentNr: '',
        figures: [],
    },
};