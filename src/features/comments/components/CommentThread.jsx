// src/features/comments/components/CommentThread.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import CommentCard from './CommentCard';
import CommentInput from './CommentInput';

const CommentThread = ({ thread }) => {
  const { dispatch, setActiveThreadId, activeThreadId } = useComments();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const main = thread.comments[0];
  const isNew = main.text === '' && thread.id === activeThreadId;

  // When a new thread becomes active and has an empty main comment, open the input
  useEffect(() => {
    if (isNew) {
      setShowReplyInput(true);
    }
  }, [isNew]);

  const submitMainComment = (text) => {
    dispatch({
      type: 'EDIT_COMMENT_OR_REPLY',
      payload: {
        threadId: thread.id,
        commentOrReplyId: main.id,
        newText: text,
      },
    });
    setShowReplyInput(false);
  };

  const submitReply = (text) => {
    dispatch({
      type: 'ADD_REPLY',
      payload: {
        threadId: thread.id,
        text,
        author: 'Current User',
      },
    });
    setShowReplyInput(false);
  };

  return (
    <div
      id={`comment-thread-${thread.id}`}
      className={`absolute inset-x-1 mb-4 p-3 border rounded-lg shadow-sm overflow-hidden ${
        activeThreadId === thread.id
          ? 'border-emerald-500 ring-2 ring-emerald-300'
          : 'border-gray-200'
      } bg-gray-50`}
      style={{ top: `${thread.position?.top || 0}px` }}
      onClick={() => setActiveThreadId(thread.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((v) => !v);
          }}
          className="text-xs font-medium flex items-center"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="ml-1 truncate max-w-[120px]">
            “{thread.textSnippet.slice(0, 30)}…”
          </span>
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Main comment or input */}
          {showReplyInput && isNew ? (
            <CommentInput
              onSubmit={submitMainComment}
              onCancel={() => setShowReplyInput(false)}
              placeholder="Add your comment…"
              submitLabel="Comment"
              showCancel
              autoFocus
            />
          ) : (
            <CommentCard item={main} threadId={thread.id} />
          )}

          {/* Existing replies */}
          {main.replies.map((r) => (
            <CommentCard key={r.id} item={r} threadId={thread.id} isReply />
          ))}

          {/* Reply input */}
          {!showReplyInput && !isNew && (
            <button
              type="button"
              onClick={() => setShowReplyInput(true)}
              className="mt-2 text-xs text-emerald-600 hover:underline"
            >
              Reply to thread
            </button>
          )}

          {showReplyInput && !isNew && (
            <CommentInput
              onSubmit={submitReply}
              onCancel={() => setShowReplyInput(false)}
              placeholder="Add a reply…"
              submitLabel="Reply"
              showCancel
              autoFocus
            />
          )}
        </>
      )}
    </div>
  );
};

CommentThread.propTypes = {
  thread: PropTypes.shape({
    id: PropTypes.string.isRequired,
    textSnippet: PropTypes.string,
    comments: PropTypes.array.isRequired,
    position: PropTypes.object,
  }).isRequired,
};

export default CommentThread;