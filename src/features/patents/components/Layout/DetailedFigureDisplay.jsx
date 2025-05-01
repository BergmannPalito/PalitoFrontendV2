// src/features/patents/components/Layout/DetailedFigureDisplay.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
    X,
    ZoomIn,
    ZoomOut,
    RotateCw,
    FlipHorizontal,
    RefreshCcw
} from 'lucide-react';

const MIN_SCALE = 0.1;
const MAX_SCALE = 8;
const SCALE_STEP = 1.2;

// This component takes up the full space given to it by its parent (ClaimsPane)
// and handles the display and interaction for a single figure.
export default function DetailedFigureDisplay({ figure, onClose }) {
    // State for initial load phase to disable transition
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    // Image Dimensions State
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
    // Calculated Fit Scale State
    const [fitScale, setFitScale] = useState(1);

    // Transformation State
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Panning State
    const [isDragging, setIsDragging] = useState(false);
    const [startDragPos, setStartDragPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // --- Function to Calculate Fit Scale ---
    const calculateFitScale = useCallback(() => {
        if (containerRef.current && imgDimensions.width > 0 && imgDimensions.height > 0) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            if (containerWidth === 0 || containerHeight === 0) return 1;
            const scaleX = containerWidth / imgDimensions.width;
            const scaleY = containerHeight / imgDimensions.height;
            return Math.min(scaleX, scaleY, 1); // Fit scale, max 1
        }
        return 1;
    }, [imgDimensions.width, imgDimensions.height]); // Depend on image dimensions

    // --- Effect to Reset and Calculate Fit Scale ---
     useEffect(() => {
        // Reset when figure changes
        setIsInitialLoad(true);
        setRotation(0);
        setIsFlipped(false);
        setPosition({ x: 0, y: 0 });
        setScale(1); // Temporarily set scale to 1 before calculation

        if (imgDimensions.width > 0 && imgDimensions.height > 0) {
            const calculatedScale = calculateFitScale();
            setFitScale(calculatedScale);
            setScale(calculatedScale);
            // Defer setting initial load to false slightly
            requestAnimationFrame(() => setIsInitialLoad(false));
        } else {
             setFitScale(1); // Reset fit scale if no dimensions
        }
    }, [figure, imgDimensions.width, imgDimensions.height, calculateFitScale]); // Re-run if figure or dimensions change


     // --- Handler for image load ---
     const handleImageLoad = (event) => {
         setImgDimensions({
             width: event.target.naturalWidth,
             height: event.target.naturalHeight,
         });
         // The useEffect above will re-run with new dimensions
     };

    // --- Transformation Handlers ---
    const handleZoomIn = () => { setIsInitialLoad(false); setScale(prev => Math.min(prev * SCALE_STEP, MAX_SCALE)); };
    const handleZoomOut = () => { setIsInitialLoad(false); setScale(prev => Math.max(prev / SCALE_STEP, MIN_SCALE)); };
    const handleRotate = () => { setIsInitialLoad(false); setRotation(prev => (prev + 90) % 360); };
    const handleMirror = () => { setIsInitialLoad(false); setIsFlipped(prev => !prev); };
    const handleReset = () => {
        setIsInitialLoad(false);
        setScale(fitScale); // Reset scale to the calculated FIT scale
        setRotation(0);
        setIsFlipped(false);
        setPosition({ x: 0, y: 0 });
    };

    // --- Panning Handlers ---
    const handleMouseDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        setIsInitialLoad(false);
        setIsDragging(true);
        setStartDragPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({ x: e.clientX - startDragPos.x, y: e.clientY - startDragPos.y });
    };
    const handleMouseUpOrLeave = (e) => {
        if (isDragging) {
            e.preventDefault();
            setIsDragging(false);
            if (containerRef.current) containerRef.current.style.cursor = 'grab';
        }
    };
    useEffect(() => { // Window listeners for smooth dragging
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUpOrLeave);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUpOrLeave);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUpOrLeave);
        };
    }, [isDragging, handleMouseMove, handleMouseUpOrLeave]);

    if (!figure) return null; // Should be handled by parent

    // --- Define image style conditionally ---
    const imageStyle = {
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) ${isFlipped ? 'scaleX(-1)' : 'scaleX(1)'}`,
        transformOrigin: 'center center',
        transition: !isDragging && !isInitialLoad ? 'transform 0.1s ease-out' : 'none',
        visibility: imgDimensions.width > 0 && scale > 0 ? 'visible' : 'hidden',
    };

    return (
        // --- Container takes full space, uses flex for centering image initially ---
        <div
            ref={containerRef}
            className="w-full h-full relative overflow-hidden bg-gray-100 cursor-grab select-none flex justify-center items-center"
            onMouseDown={handleMouseDown}
        >
             {/* Controls (Top Right Corner, relative to this container) */}
             <div className="absolute top-2 right-2 z-20 flex flex-col items-center gap-1 bg-white/80 rounded-md shadow-lg border border-gray-200 p-1 backdrop-blur-sm">
                 <button onClick={handleZoomIn} title="Zoom In" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><ZoomIn size={18} /></button>
                 <button onClick={handleZoomOut} title="Zoom Out" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><ZoomOut size={18} /></button>
                 <button onClick={handleRotate} title="Rotate 90° CW" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><RotateCw size={18} /></button>
                 <button onClick={handleMirror} title="Mirror Horizontal" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><FlipHorizontal size={18} /></button>
                 <button onClick={handleReset} title="Reset View" className="p-1.5 rounded hover:bg-gray-100 text-gray-600 hover:text-black focus:outline-none focus:ring-1 focus:ring-emerald-500"><RefreshCcw size={18} /></button>
                 <div className="h-px w-full bg-gray-200 my-0.5"></div>
                 {/* Call the onClose prop passed from ClaimsPane */}
                 <button onClick={onClose} title="Close Detail View" className="p-1.5 rounded hover:bg-red-100 text-red-600 hover:text-red-800 focus:outline-none focus:ring-1 focus:ring-red-500"><X size={18} /></button>
             </div>

             {/* Image (Absolutely positioned for panning within the flex container) */}
            {figure.image ? (
                <img
                    onLoad={handleImageLoad}
                    src={figure.image}
                    alt={figure.caption || `Figure ${figure.id}`}
                    className="max-w-none max-h-none absolute object-contain pointer-events-none"
                    style={imageStyle}
                    draggable="false"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">Image not available</div>
            )}
        </div>
    );
}

DetailedFigureDisplay.propTypes = {
    figure: PropTypes.shape({
        id: PropTypes.string.isRequired,
        caption: PropTypes.string,
        image: PropTypes.string,
        page: PropTypes.number,
    }).isRequired,
    onClose: PropTypes.func.isRequired, // Function to call to go back to tabs
};