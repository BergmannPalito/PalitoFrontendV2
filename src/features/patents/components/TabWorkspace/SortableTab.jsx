import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react';
import { MdDragIndicator } from 'react-icons/md';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';

/**
 * Sortable wrapper that:
 *   • makes ONLY the grip button the drag handle
 *   • lets the entire wrapper follow the pointer even when
 *     it leaves the <Tab.List> overflow area
 */
export default function SortableTab({ id, name, onRename }) {
  /* dnd-kit wiring */
  const {
    setNodeRef,            // attach to wrapper <div>
    transform,
    transition,
    listeners,             // spread ONLY on grip button
    attributes,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity : isDragging ? 0.5 : 1,
  };

  return (
    /* draggable wrapper — NOT a <button/> so no nesting violation */
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* real Headless-UI tab */}
      <Tab
        className={({ selected }) =>
          clsx(
            'relative flex shrink-0 items-center gap-1 px-3 py-1.5 whitespace-nowrap text-sm',
            selected
              ? 'border-b-2 border-emerald font-medium text-black'
              : 'text-gray-500',
          )
        }
      >
        {/* grip = drag handle */}
        <button
          {...listeners}
          type="button"
          title="Drag to reorder / drop on folder"
          className="mr-1 cursor-grab text-gray-400 active:cursor-grabbing"
        >
          <MdDragIndicator size={14} />
        </button>

        {/* label */}
        <span className="max-w-[120px] truncate">{name}</span>

        {/* rename pencil */}
        <button
          type="button"
          onClick={onRename}
          title="Rename tab"
          className="ml-1 text-xs text-gray-400 hover:text-gray-600"
        >
          ✎
        </button>
      </Tab>
    </div>
  );
}

SortableTab.propTypes = {
  id      : PropTypes.string.isRequired,
  name    : PropTypes.string.isRequired,
  onRename: PropTypes.func.isRequired,
};
