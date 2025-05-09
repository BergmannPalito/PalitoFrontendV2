import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Edit3, Trash2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useComments } from '../hooks/useComments';
import { CommentIcon } from './CommentIcon';

const CommentCard = ({ item, threadId, isReply = false }) => {
  const { dispatch } = useComments();
  const [isEditing, setIsEditing] = useState(false);

  const formattedTime = () => {
    try {
      return formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (isEditing) {
    return (
      <CommentIcon
        initialText={item.text}
        onSubmit={(txt) =>
          dispatch({
            type: 'EDIT_COMMENT_OR_REPLY',
            payload: { threadId, commentOrReplyId: item.id, newText: txt },
          })
        }
        onCancel={() => setIsEditing(false)}
        submitLabel="Save"
        showCancel
        autoFocus
      />
    );
  }

  return (
    <div
      className={`p-3 ${isReply ? 'ml-4 pl-4 border-l border-gray-200' : 'bg-white'} rounded-md my-2`}
    >
      <div className="text-xs text-gray-500 mb-1">
        <strong>{item.author}</strong> · {formattedTime()}
      </div>
      <p className="text-sm whitespace-pre-wrap break-words">{item.text}</p>
      <div className="mt-2 flex space-x-3">
        {!isReply && (
          <button
            type="button"
            className="text-xs text-emerald-600 hover:underline flex items-center"
          >
            <MessageSquare size={14} className="mr-1" />
            Reply
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-gray-600 hover:underline flex items-center"
        >
          <Edit3 size={14} className="mr-1" />
          Edit
        </button>
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'DELETE_COMMENT_OR_REPLY',
              payload: { threadId, commentOrReplyId: item.id },
            })
          }
          className="text-xs text-red-500 hover:underline flex items-center"
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
};

CommentCard.propTypes = {
  item: PropTypes.object.isRequired,
  threadId: PropTypes.string.isRequired,
  isReply: PropTypes.bool,
};

export default CommentCard;