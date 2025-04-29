import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal/Modal';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';

export default function RenameFolderModal({ folderId, initialName, open, onClose }) {
  const { renameFolder } = usePatentWorkspace();
  const [name, setName] = useState(initialName);

  const handleSubmit = (e) => {
    e.preventDefault();
    renameFolder(folderId, name.trim() || initialName);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Rename folder</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-100 px-4 py-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded bg-emerald px-4 py-1 text-white"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

RenameFolderModal.propTypes = {
  folderId: PropTypes.string,
  initialName: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};