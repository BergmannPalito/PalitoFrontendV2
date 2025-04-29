// src/features/patents/components/Layout/CommentCard.jsx
import { useState, useRef, Fragment } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { formatDistanceToNow } from 'date-fns';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical, ChevronUp, ChevronDown, Edit, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useComments } from '@/features/patents/hooks/useComments';

// Helper function for relative time
const formatRelativeTime = (date) => {
    // Ensure date is valid before formatting
    if (!date || isNaN(new Date(date).getTime())) {
        return 'Invalid date';
    }
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: false })
            .replace('about ', '').replace('less than a minute', '0m')
            .replace(' minutes', 'm').replace(' minute', 'm')
            .replace(' hours', 'h').replace(' hour', 'h');
    } catch (error) {
        console.error("Error formatting date:", error, date);
        return 'Error time';
    }
};


// Receive 'level' prop to determine nesting depth
export default function CommentCard({ comment, level }) {
    const [isRepliesExpanded, setIsRepliesExpanded] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    // State for Reply Input
    const [replyText, setReplyText] = useState('');
    const [showReplyButtons, setShowReplyButtons] = useState(false);

    // Get context actions
    const { deleteComment, editComment, addReply } = useComments();

    // Ref for the reply section (input + buttons) to handle blur correctly
    const replySectionRef = useRef(null);

    // Click outside handler
    const cardRef = useClickOutside(() => {
        if (isEditing) {
            setIsEditing(false);
            setEditText(comment.text); // Reset edit text on clicking outside
        }
        // If clicking outside while replying, reset reply state
        if (isReplying) {
            setIsReplying(false);
            setShowReplyButtons(false);
            setReplyText('');
        }
    });

    // --- Derived state ---
    const timestamp = comment.timestamp ? new Date(comment.timestamp) : null;
    const relativeTime = timestamp ? formatRelativeTime(timestamp) : 'No date';
    const hasReplies = comment.replies && comment.replies.length > 0;
    const replyCount = comment.replies?.length || 0;
    const ChevronIcon = isRepliesExpanded ? ChevronUp : ChevronDown;

    // --- Handlers ---
    const toggleReplies = () => {
        if (hasReplies) setIsRepliesExpanded(!isRepliesExpanded);
    };

    const handleActivateReplying = () => {
        // Only allow activating reply for top-level comments (level 0) and if not editing
        if (!isEditing && level === 0) {
            setIsReplying(true);
        }
    };

    // Delete handler (no confirmation)
    const handleDelete = () => {
        console.log('Attempting delete (no confirmation):', comment.id);
        deleteComment(comment.id);
    };

    // Edit handler
    const handleEdit = () => {
        setEditText(comment.text); // Start edit with current text
        setIsEditing(true);
        setIsReplying(false); // Close reply input when editing
        setIsRepliesExpanded(false); // Close replies when editing
    };

    // Save handler
    const handleSaveEdit = () => {
        if (editText.trim() === '') return; // Optional: Prevent empty save
        if (editText !== comment.text) {
            editComment(comment.id, editText);
        }
        setIsEditing(false);
    };

    // Cancel handler
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditText(comment.text); // Reset text on cancel
    };

    // --- Reply Input Handlers ---
    const handleReplyInputFocus = () => {
        setShowReplyButtons(true);
    };

    // Blur handler with timeout
    const handleReplyInputBlur = () => {
         setTimeout(() => {
             // Check if focus is still within the reply section
             if (replySectionRef.current && !replySectionRef.current.contains(document.activeElement)) {
                 setShowReplyButtons(false);
             }
         }, 100); // Small delay
    };

    // Cancel Reply handler
    const handleCancelReply = () => {
        setShowReplyButtons(false);
        setReplyText('');
        setIsReplying(false); // Hide input completely on cancel
    };

    // Post Reply handler
    const handlePostReply = () => {
        if (replyText.trim()) {
            console.log(`Posting reply to ${comment.id}: ${replyText}`);
            addReply(comment.id, replyText); // Use parent comment ID
            setReplyText('');
            setShowReplyButtons(false);
            setIsReplying(false); // Hide input after posting
            // Expand replies after adding one
            if (!isRepliesExpanded && hasReplies) {
                 setIsRepliesExpanded(true);
            } else if (!isRepliesExpanded && !hasReplies) {
                 // Need a slight delay for state update if it was the first reply
                 setTimeout(() => setIsRepliesExpanded(true), 50);
            }
        }
    };
    // --- End Handlers ---


    return (
        <div
            ref={cardRef}
            onClick={handleActivateReplying}
            // Only add cursor-pointer if it's a top-level comment (replyable) and not editing
            className={clsx(
                "rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-150",
                !isEditing && level === 0 && "cursor-pointer hover:shadow-md",
                isEditing && "ring-2 ring-emerald-300 shadow-md"
            )}
        >
            {/* --- Header Section --- */}
            <div className="mb-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                {/* Timestamp */}
                <span className="text-xs font-medium text-gray-500">{relativeTime}</span>
                {/* Action Icons container */}
                <div className="flex items-center gap-1">
                    {/* Chevron for replies (Only show if has replies and NOT editing) */}
                    {hasReplies && !isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleReplies(); }}
                            className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
                            aria-expanded={isRepliesExpanded}
                            aria-label={isRepliesExpanded ? 'Collapse replies' : 'Expand replies'}
                        >
                            <ChevronIcon size={16} />
                        </button>
                    )}
                    {/* Actions Menu (...) */}
                    <Menu as="div" className="relative inline-block text-left">
                        <div>
                            <Menu.Button
                                className="text-gray-400 hover:text-gray-600 p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                onClick={(e) => e.stopPropagation()} // Prevent card click
                            >
                                <MoreVertical size={16} />
                            </Menu.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 z-20 mt-1 w-28 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    {/* Menu Items using correct structure */}
                                    <Menu.Item>
                                        {({ active, close }) => (
                                            <button onClick={() => { handleEdit(); close(); }} className={clsx('group flex w-full items-center px-3 py-1 text-xs', active ? 'bg-gray-100 text-gray-900' : 'text-gray-700')}>
                                                <Edit className="mr-2 h-3.5 w-3.5 text-gray-500" aria-hidden="true" /> Edit
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active, close }) => (
                                            <button onClick={() => { handleDelete(); close(); }} className={clsx('group flex w-full items-center px-3 py-1 text-xs', active ? 'bg-red-100 text-red-700' : 'text-red-600')}>
                                                <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" aria-hidden="true" /> Delete
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>

            {/* --- Body Section (Comment Text OR Edit Area) --- */}
            {isEditing ? (
                // Edit State UI
                <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                        value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
                        className="w-full rounded border border-emerald-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                        autoFocus
                    />
                    <div className="mt-1.5 flex justify-end gap-2">
                        <button onClick={handleCancelEdit} className="rounded px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                        <button onClick={handleSaveEdit} className="rounded px-2 py-0.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">Save</button>
                    </div>
                </div>
            ) : (
                 // Default State UI (Comment Text + Replies Link)
                <>
                    <p className="mb-2 text-sm text-gray-800 break-words">{comment.text}</p>
                    {hasReplies && (
                        <button onClick={(e) => { e.stopPropagation(); toggleReplies(); }} className="mb-3 text-xs font-medium text-emerald-600 hover:underline" aria-expanded={isRepliesExpanded}>
                            Replies {replyCount}
                        </button>
                    )}
                </>
            )}

            {/* --- Replies Section (Conditional) --- */}
            {/* Show only if expanded AND has replies AND NOT editing */}
            {isRepliesExpanded && hasReplies && !isEditing && (
                <div className="ml-3 mt-2 space-y-3 border-l-2 border-gray-200 pl-4 pt-1" onClick={(e) => e.stopPropagation()}>
                    {comment.replies.map((reply) => (
                        // Recursively render CommentCard, passing incremented level
                        <CommentCard key={reply.id} comment={reply} level={level + 1} />
                    ))}
                </div>
            )}

            {/* --- Reply Input Section (Conditional) --- */}
            {/* Show only if isReplying is active AND NOT editing AND level is 0 */}
            {isReplying && !isEditing && level === 0 && (
                // Attach ref to this container for blur handling
                <div ref={replySectionRef} className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="text" placeholder="Add a reply"
                        className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        value={replyText} onChange={(e) => setReplyText(e.target.value)}
                        onFocus={handleReplyInputFocus} onBlur={handleReplyInputBlur}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostReply();} }} // Handle Enter key
                    />
                    {/* Conditional Reply/Cancel Buttons */}
                    {showReplyButtons && (
                        <div className="mt-1.5 flex justify-end gap-2">
                            <button onClick={handleCancelReply} className="rounded px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                            <button onClick={handlePostReply} className="rounded px-2 py-0.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50" disabled={!replyText.trim()} >Reply</button>
                        </div>
                    )}
                </div>
            )}
        </div> // End main card div
    );
}

// PropTypes including level
CommentCard.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    replies: PropTypes.array,
  }).isRequired,
  level: PropTypes.number.isRequired, // Make level required
};