// src/features/patents/components/TabWorkspace/SearchPatentModal.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@/components/Modal/Modal';
import { mockSearch } from '@/features/patents/services/mockSearch';

export default function SearchPatentModal({ open, onClose, onSuccess }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const example1 = 'EP1626661B1';
  const example2 = 'EP1626661B1'.replace(/\d/, ' -'); // faux bad example

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await mockSearch(query.trim());
      onSuccess(data);
      onClose();
    } catch {
      setError('Patent not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} widthClass="max-w-lg">
      <h2 className="mb-6 text-center text-2xl font-semibold">Search for a patent</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* input */}
        <div className="flex rounded border bg-white px-3 py-2 shadow-sm">
          <span className="mr-2 mt-[2px] text-gray-500">🔍</span>
          <input
            autoFocus
            className="flex-1 outline-none"
            placeholder="Search patent by publication number. Please use the format EP1626661B1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* examples */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            className="rounded-full border px-4 py-1 text-sm hover:bg-gray-100"
            onClick={() => setQuery(example2)}
          >
            <span className="mr-1 text-red-600">👎</span>
            {example2}
          </button>
          <button
            type="button"
            className="rounded-full border px-4 py-1 text-sm hover:bg-gray-100"
            onClick={() => setQuery(example1)}
          >
            <span className="mr-1 text-green-600">👍</span>
            {example1}
          </button>
        </div>

        {error && <p className="text-center text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded bg-emerald px-6 py-1 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

SearchPatentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};