// src/features/patents/context/CommentsContext.jsx
import { createContext, useReducer, useContext } from 'react';
import PropTypes from 'prop-types';

// --- Initial Mock Data ---
const initialCommentsData = [
    {
        id: 'c1', text: 'This description seems quite detailed regarding the manufacturing process.',
        timestamp: new Date(Date.now() - 1000 * 60 * 100).toISOString(), replies: [
            { id: 'r1', text: 'Agreed, especially section [0045].', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), replies: [] },
        ],
    },
    { id: 'c2', text: 'Is claim 3 supported by the examples provided?', timestamp: new Date(Date.now() - 1000 * 60 * 62).toISOString(), replies: [] },
    { id: 'c3', text: 'Placeholder comment added just now.', timestamp: new Date(Date.now() - 1000 * 30).toISOString(), replies: [] },
    { id: 'c4', text: 'Could we verify the citation for reference [X]?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), replies: [] },
    { id: 'c5', text: 'The wording in claim 1 seems a bit ambiguous around the term "substantially".', timestamp: new Date(Date.now() - 1000 * 60 * 150).toISOString(), replies: [
            { id: 'r2', text: 'Maybe we can suggest alternative phrasing in our feedback.', timestamp: new Date(Date.now() - 1000 * 60 * 145).toISOString(), replies: [] },
        ],
    },
    { id: 'c6', text: 'Figure 2 is helpful for understanding the assembly.', timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(), replies: [] },
    { id: 'c7', text: 'Comparing this to patent Y reveals some interesting overlaps in the method.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), replies: [] },
    { id: 'c8', text: 'Initial thoughts: seems novel, but need to check prior art more closely.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), replies: [] },
];
// --- End Initial Data ---

const CommentsContext = createContext();

// --- Recursive Helper Functions for Reducer ---
// Helper to delete a comment/reply by ID from a list
const deleteCommentRecursive = (comments, idToDelete) => {
    // Use map and filter in combination to handle immutable update correctly
    return comments
        .filter(comment => comment.id !== idToDelete) // Filter out the top-level match
        .map(comment => {
            if (comment.replies && comment.replies.length > 0) {
                // If comment has replies, recursively try to delete within them
                const updatedReplies = deleteCommentRecursive(comment.replies, idToDelete);
                // Return comment with potentially updated replies
                return { ...comment, replies: updatedReplies };
            }
            // If no replies or no match found within replies, return comment as is
            return comment;
        });
};


// Helper to edit a comment/reply by ID in a list
const editCommentRecursive = (comments, idToEdit, newText) => {
    return comments.map(comment => {
        if (comment.id === idToEdit) {
            // Found the comment, return a new object with updated text
            return { ...comment, text: newText };
        }
        if (comment.replies && comment.replies.length > 0) {
            // Recursively process replies
            const updatedReplies = editCommentRecursive(comment.replies, idToEdit, newText);
             // Return comment with potentially updated replies
            return { ...comment, replies: updatedReplies };
        }
        // Return unchanged comment
        return comment;
    });
};

// Helper for Adding Reply
const addReplyRecursive = (comments, parentId, newReply) => {
    return comments.map(comment => {
        if (comment.id === parentId) {
            // Found the parent, add the reply
            return {
                ...comment,
                // Ensure replies array exists, then add new reply
                replies: [...(comment.replies || []), newReply]
            };
        }
        if (comment.replies && comment.replies.length > 0) {
            // Recursively check replies
            const updatedReplies = addReplyRecursive(comment.replies, parentId, newReply);
            // Return comment with potentially updated replies
            return { ...comment, replies: updatedReplies };
        }
        // Return unchanged comment
        return comment;
    });
};
// --- End Recursive Helpers ---


// --- Reducer Function ---
function commentsReducer(state, action) {
    switch (action.type) {
        case 'LOAD_COMMENTS':
            return { ...state, comments: action.payload };
        case 'ADD_COMMENT':
            // TODO: Implement adding top-level comment
            return state;
        case 'DELETE_COMMENT': {
             console.log('Reducer: DELETE_COMMENT', action.payload.id);
             const updatedComments = deleteCommentRecursive(state.comments, action.payload.id);
             return { ...state, comments: updatedComments };
        }
        case 'EDIT_COMMENT': {
            console.log('Reducer: EDIT_COMMENT', action.payload.id, action.payload.newText);
            const updatedComments = editCommentRecursive(state.comments, action.payload.id, action.payload.newText);
            return { ...state, comments: updatedComments };
        }
        case 'ADD_REPLY': {
            const { parentId, text } = action.payload;
            if (!text?.trim()) return state; // Don't add empty replies

            const newReply = {
                id: `r-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Simple unique ID
                text: text,
                timestamp: new Date().toISOString(),
                replies: [] // New replies start with empty replies array
            };
            console.log('Reducer: ADD_REPLY to parent', parentId, newReply);
            const updatedComments = addReplyRecursive(state.comments, parentId, newReply);
            return { ...state, comments: updatedComments };
        }
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

// --- Provider Component ---
export function CommentsProvider({ children }) {
    const initialState = {
        comments: initialCommentsData, // Use mock data
        isLoading: false,
        error: null,
    };

    const [state, dispatch] = useReducer(commentsReducer, initialState);

    // Prepare value for context consumers
    const value = {
        comments: state.comments,
        isLoading: state.isLoading,
        error: state.error,
        // --- Action dispatchers ---
        deleteComment: (id) => dispatch({ type: 'DELETE_COMMENT', payload: { id } }),
        editComment: (id, newText) => dispatch({ type: 'EDIT_COMMENT', payload: { id, newText } }),
        addReply: (parentId, text) => dispatch({ type: 'ADD_REPLY', payload: { parentId, text } }),
        // addComment: (...)
    };

    return (
        <CommentsContext.Provider value={value}>
            {children}
        </CommentsContext.Provider>
    );
}

CommentsProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

// --- Custom Hook ---
export const useComments = () => {
    const context = useContext(CommentsContext);
    if (context === undefined) {
        throw new Error('useComments must be used within a CommentsProvider');
    }
    return context;
};