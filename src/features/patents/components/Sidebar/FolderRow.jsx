// src/features/patents/components/Sidebar/FolderRow.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Disclosure, Menu as HeadlessMenu } from '@headlessui/react'; // Renamed Menu import
import { CopyIcon } from '@/assets/icons/custom';
import { HiDotsVertical } from 'react-icons/hi';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { useDroppable } from '@dnd-kit/core';
import clsx from 'clsx';

import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
import RenameFolderModal from './RenameFolderModal';
import PatentRow from './PatentRow';

export default function FolderRow({ folder }) {
  const { sidebarCollapsed, deleteFolder } = usePatentWorkspace();

  const { setNodeRef, isOver, active } = useDroppable({
    id: folder.id,
    data: { type: 'folder', folderId: folder.id },
    accept: 'tab',
  });

  const [renameOpen, setRenameOpen] = useState(false);

  const isTabBeingDragged = active?.data?.current?.type === 'tab';
  const draggedTabId = active?.id;
  const shouldHighlight =
    isOver &&
    isTabBeingDragged &&
    draggedTabId &&
    !folder.patents.some(p => p.id === draggedTabId);


  return (
    <>
      <Disclosure
        as="div"
        className={clsx(
            "w-full transition-colors duration-150 ease-in-out rounded-lg",
            shouldHighlight ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-transparent'
        )}
        ref={setNodeRef}
      >
        {({ open }) => (
          <>
            {/* ───── HEADER ROW ───── */}
            <div className="flex items-center gap-2 px-2 py-1 hover:bg-white rounded-lg">
              <Disclosure.Button as="div" className="flex-none cursor-pointer p-1 rounded hover:bg-gray-100">
                <CopyIcon />
              </Disclosure.Button>

              <Disclosure.Button
                as="span"
                className="min-w-0 flex-grow break-words text-left cursor-pointer font-medium text-sm"
              >
                {folder.name}
              </Disclosure.Button>

              <div className="flex flex-none gap-1 items-center">
                <Disclosure.Button as="div" className="cursor-pointer p-0.5 rounded hover:bg-gray-100">
                  <MdKeyboardArrowDown
                    size={18}
                    className={clsx(
                        'text-gray-500 transition-transform duration-200',
                        open ? 'rotate-0' : '-rotate-90' // Keep arrow pointing right when closed
                    )}
                  />
                </Disclosure.Button>

                {!sidebarCollapsed && (
                  // Use alias HeadlessMenu to avoid conflict if needed
                  <HeadlessMenu as="div" className="relative">
                    <HeadlessMenu.Button
                      className="rounded p-1 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      title="Folder actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HiDotsVertical size={16} />
                    </HeadlessMenu.Button>

                    <HeadlessMenu.Items className="absolute right-0 z-50 mt-1 w-32 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"> {/* Increased z-index */}
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setRenameOpen(true); }}
                            className={clsx(
                              'block w-full px-3 py-1 text-left text-sm',
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            )}
                          >
                            Rename
                          </button>
                        )}
                      </HeadlessMenu.Item>

                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                            className={clsx(
                              'block w-full px-3 py-1 text-left text-sm',
                              active ? 'bg-red-100 text-red-700' : 'text-red-600'
                            )}
                          >
                            Delete
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </HeadlessMenu.Items>
                  </HeadlessMenu>
                )}
              </div>
            </div>

            {/* ───── PATENT LIST (Disclosure Panel) ───── */}
            {/* --- FIX: Add overflow-visible --- */}
            <Disclosure.Panel className="pl-6 pr-2 pb-1 pt-1 overflow-visible">
            {/* --- End Fix --- */}
              {folder.patents.length > 0 ? (
                folder.patents.map((p) => (
                  <PatentRow key={p.id} folderId={folder.id} patent={p} />
                ))
              ) : (
                <p className="text-xs text-gray-500 italic px-2 py-1">Folder is empty</p>
              )}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {renameOpen && (
        <RenameFolderModal
          folderId={folder.id}
          initialName={folder.name}
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
        />
      )}
    </>
  );
}

FolderRow.propTypes = {
  folder: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    patents: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
  }).isRequired,
};