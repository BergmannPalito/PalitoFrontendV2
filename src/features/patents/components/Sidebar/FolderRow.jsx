// src/features/patents/components/Sidebar/FolderRow.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Disclosure, Menu } from '@headlessui/react';
import { CopyIcon } from '@/assets/icons/custom';
import { HiDotsVertical } from 'react-icons/hi';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { useDroppable } from '@dnd-kit/core';

import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
import RenameFolderModal from './RenameFolderModal';
import PatentRow from './PatentRow'; // ← single-patent row with “Rename / Remove”

export default function FolderRow({ folder }) {
  const { sidebarCollapsed, deleteFolder } = usePatentWorkspace();

  /* make the whole folder row a droppable target for patents */
  const { setNodeRef, isOver } = useDroppable({
    id: folder.id,
    data: { type: 'folder' },
  });

  const [renameOpen, setRenameOpen] = useState(false);

  return (
    <>
      <Disclosure
        as="div"
        className="w-full"
        ref={setNodeRef}
      >
        {({ open }) => (
          <>
            {/* ───── HEADER ROW ───── */}
            <div className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-white">
              {/* folder icon — click toggles */}
              <Disclosure.Button as="div" className="flex-none cursor-pointer">
                <CopyIcon />
              </Disclosure.Button>

              {/* folder name (wraps) */}
              <Disclosure.Button
                as="span"
                className="min-w-0 flex-grow break-words text-left cursor-pointer"
              >
                {folder.name}
              </Disclosure.Button>

              {/* arrow + ⋮ actions */}
              <div className="flex flex-none gap-1">
                <Disclosure.Button as="div" className="cursor-pointer">
                  <MdKeyboardArrowDown
                    size={18}
                    className={`text-gray-500 transition-transform ${
                      open ? '' : 'rotate-180'
                    }`}
                  />
                </Disclosure.Button>

                {!sidebarCollapsed && (
                  <Menu as="div" className="relative">
                    <Menu.Button
                      className="rounded p-1 hover:bg-gray-100"
                      title="Folder actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HiDotsVertical size={16} />
                    </Menu.Button>

                    <Menu.Items className="absolute right-0 z-40 mt-1 w-32 rounded-md bg-white shadow-md">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => setRenameOpen(true)}
                            className={`block w-full px-3 py-1 text-left ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            Rename
                          </button>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            type="button"
                            onClick={() => deleteFolder(folder.id)}
                            className={`block w-full px-3 py-1 text-left text-red-600 ${
                              active ? 'bg-gray-100' : ''
                            }`}
                          >
                            Delete
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                )}
              </div>

              {/* small visual cue while dragging over */}
              {isOver && (
                <span className="ml-1 rounded-full bg-emerald-500 px-1.5 text-[10px] text-white">
                  drop
                </span>
              )}
            </div>

            {/* ───── PATENT LIST ───── */}
            <Disclosure.Panel className="pl-6">
              {folder.patents.map((p) => (
                <PatentRow key={p.id} folderId={folder.id} patent={p} />
              ))}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      {/* rename folder modal */}
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
    patents: PropTypes.array.isRequired,
  }).isRequired,
};
