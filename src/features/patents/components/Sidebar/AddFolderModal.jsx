import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal/Modal';
import { nanoid } from 'nanoid';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';

export default function AddFolderModal({ open, onClose }) {
  const { addFolder } = usePatentWorkspace();
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addFolder(nanoid(), name.trim());
    onClose();
    setName('');
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Create new folder</h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
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
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}

AddFolderModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};