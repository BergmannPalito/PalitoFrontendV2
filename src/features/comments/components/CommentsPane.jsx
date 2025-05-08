// src/features/comments/components/CommentsPane.jsx
import React from 'react';
import PropTypes from 'prop-types';
import CommentSidebar from './CommentSidebar'; // Correctly import CommentSidebar

export default function CommentsPane({ tabId }) { // Expect tabId as a prop
  if (!tabId) {
    // Optionally handle the case where tabId is not yet available
    // or it's a state where comments are not applicable.
    return (
      <aside className="w-80 h-full border-l border-gray-200 bg-slate-50 p-4 overflow-hidden relative">
        <h2 className="text-lg font-semibold mb-4">Comments</h2>
        <p className="text-sm text-gray-500">Select a document to see comments.</p>
      </aside>
    );
  }

  return <CommentSidebar tabId={tabId} />;
}

CommentsPane.propTypes = {
  tabId: PropTypes.string, // tabId is now a prop
};