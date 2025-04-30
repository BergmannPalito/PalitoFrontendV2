// src/features/patents/components/TabWorkspace/SortableTab.jsx
import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react';
import { MdDragIndicator, MdClose } from 'react-icons/md';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

/**
 * Sortable wrapper that:
 * • Uses <span> for drag handle AND rename control to avoid nesting errors
 * • Hides the original element when dragging (DragOverlay will show a copy)
 * • Includes the close button internally
 * • FIX: Places controls *sibling* to the <Tab> element to avoid nesting
 */
export default function SortableTab({ id, name, onRename, onClose }) {
  /* dnd-kit wiring */
  const {
    setNodeRef,
    transform,
    transition,
    listeners, // Keep listeners for the handle
    attributes, // Apply attributes to the main draggable div
    isDragging,
    setActivatorNodeRef, // Apply activator ref to the handle span
  } = useSortable({
    id,
    data: {
        type: 'tab',
        tabId: id,
    }
   });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  // Handle keydown for rename span
  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onRename();
    }
  };

  // Handle keydown for close button
   const handleCloseKeyDown = (e) => {
     if (e.key === 'Enter' || e.key === ' ') {
       e.preventDefault();
       e.stopPropagation();
       onClose();
     }
   };


  return (
    /* draggable wrapper - main container for tab + controls */
    /* Apply attributes here, use group for hover effects */
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} // Spread attributes for dnd-kit here
      className="group relative flex items-center" // Use flex to align Tab and controls div
    >
      {/* Headless-UI tab (renders as button) */}
      {/* Now contains ONLY the handle and label */}
      <Tab
        // Remove attributes and listeners from here if they are on the outer div
        className={({ selected }) =>
          clsx(
            'relative flex shrink-0 items-center gap-1 pl-1 pr-3 py-1.5 whitespace-nowrap text-sm transition-colors duration-150 ease-in-out', // Adjusted padding
            selected
              ? 'border-b-2 border-emerald-600 font-medium text-gray-900'
              : 'text-gray-500 hover:text-gray-700',
          )
        }
        // Prevent click propagation if needed, especially if outer div has listeners
        onClick={(e) => { if (isDragging) e.preventDefault(); }}
      >
        {/* Drag Handle (span) - Apply listeners and activator ref here */}
        <span
          ref={setActivatorNodeRef}
          {...listeners} // Listeners specifically for the handle
          role="button"
          tabIndex={0}
          title="Drag to reorder / drop on folder"
          aria-label="Drag tab"
          className={clsx(
            "p-1 mr-1 text-gray-400 active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded", // Added padding to handle
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
          onMouseDown={(e) => e.preventDefault()}
        >
          <MdDragIndicator size={14} />
        </span>

        {/* label */}
        <span className="max-w-[120px] truncate pointer-events-none">{name}</span>

      </Tab>

      {/* --- Controls Container - SIBLING to the <Tab> --- */}
      {/* This div contains the rename/close controls */}
      {/* Position it relative to the flex container, control visibility with group-hover */}
      <div className={clsx(
           "flex items-center pl-0 pr-1", // Adjust padding/margin as needed
           // Make controls visible on group hover/focus-within on the outer div
           "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 ease-in-out"
       )}>
          {/* Rename Control (span) */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
                e.stopPropagation(); // Prevent potential outer div listeners
                onRename();
            }}
            onKeyDown={handleRenameKeyDown}
            title="Rename tab"
            aria-label={`Rename tab ${name}`}
            className="text-xs text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded p-0.5 cursor-pointer"
          >
            ✎
          </span>

          {/* Close button */}
          <button
              type="button"
              onClick={(e) => {
                  e.stopPropagation(); // Prevent potential outer div listeners
                  onClose();
              }}
              onKeyDown={handleCloseKeyDown}
              title="Close tab (Ctrl+W)"
              aria-label={`Close tab ${name}`}
              // Adjust spacing/styling as needed
              className={clsx(
                  "ml-1 p-0.5 rounded-full text-gray-400", // Reduced margin slightly
                  "hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-red-500"
              )}
          >
              <MdClose size={14} />
          </button>
      </div>
      {/* --- End Controls Container --- */}

    </div> // End main draggable div
  );
}

SortableTab.propTypes = {
  id      : PropTypes.string.isRequired,
  name    : PropTypes.string.isRequired,
  onRename: PropTypes.func.isRequired,
  onClose : PropTypes.func.isRequired,
};