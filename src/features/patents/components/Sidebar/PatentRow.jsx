import PropTypes from 'prop-types';
import { HiDotsVertical } from 'react-icons/hi';
import { Menu } from '@headlessui/react';
import { CopyIcon } from '@/assets/icons/custom';
import RenameTabModal from '../TabWorkspace/RenameTabModal';
import { useState } from 'react';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';

/* ↓ NEW NAME ↓ */
export default function PatentRow({ folderId, patent }) {
  const { removePatentFromFolder } = usePatentWorkspace();
  const [renameOpen, setRenameOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 truncate py-1 hover:bg-white">
        <CopyIcon />
        <span className="mr-auto truncate">{patent.name}</span>

        <Menu as="div" className="relative">
          <Menu.Button className="rounded p-1 hover:bg-gray-100">
            <HiDotsVertical size={14} />
          </Menu.Button>
          <Menu.Items className="absolute right-0 z-40 mt-1 w-28 rounded-md bg-white shadow">
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
                  onClick={() => removePatentFromFolder(folderId, patent.id)}
                  className={`block w-full px-3 py-1 text-left text-red-600 ${
                    active ? 'bg-gray-100' : ''
                  }`}
                >
                  Remove
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>

      {renameOpen && (
        <RenameTabModal
          tabId={patent.id}
          initialName={patent.name}
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
        />
      )}
    </>
  );
}

PatentRow.propTypes = {
  folderId: PropTypes.string.isRequired,
  patent: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
    .isRequired,
};
