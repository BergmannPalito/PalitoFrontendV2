// src/features/comments/context/CommentsContext.jsx

import React, {
    createContext,
    useReducer,
    useContext,
    useEffect,
    useRef,
  } from 'react';
  import { nanoid } from 'nanoid';
  import { useHighlightContext } from '../../highlights/context/HighlightContext';
  
  const CommentsContext = createContext();
  
  const initialState = {
    threads: [],
    activeThreadId: null,
  };
  
  function commentsReducer(state, action) {
    switch (action.type) {
      case 'ADD_COMMENT': {
        // STEP 3: Confirm dispatch reaches the reducer
        console.log('[CommentContext] ADD_COMMENT payload:', action.payload);
        const {
          tabId,
          textRange,
          textSnippet,
          text,
          author,
          originalHighlight,
        } = action.payload;
        const newId = `thread-${nanoid(7)}`;
        const newThread = {
          id: newId,
          tabId,
          textRange,
          textSnippet,
          comments: [
            {
              id: nanoid(),
              text,
              author,
              timestamp: new Date().toISOString(),
              replies: [],
            },
          ],
          originalHighlight,
          position: null,
        };
        return {
          ...state,
          threads: [...state.threads, newThread],
          // **set this thread active so the sidebar knows to show its input**
          activeThreadId: newId,
        };
      }
  
      case 'SET_ACTIVE_THREAD':
        return { ...state, activeThreadId: action.payload };
  
      case 'SET_THREAD_POSITION':
        return {
          ...state,
          threads: state.threads.map((t) =>
            t.id === action.payload.threadId
              ? { ...t, position: action.payload.position }
              : t
          ),
        };
  
      case 'ADD_REPLY':
        return {
          ...state,
          threads: state.threads.map((t) =>
            t.id === action.payload.threadId
              ? {
                  ...t,
                  comments: [
                    {
                      ...t.comments[0],
                      replies: [
                        ...t.comments[0].replies,
                        {
                          id: `reply-${nanoid(7)}`,
                          parentId: t.comments[0].id,
                          text: action.payload.text,
                          author: action.payload.author,
                          timestamp: new Date().toISOString(),
                        },
                      ],
                    },
                  ],
                }
              : t
          ),
        };
  
      case 'EDIT_COMMENT_OR_REPLY':
        return {
          ...state,
          threads: state.threads.map((t) =>
            t.id !== action.payload.threadId
              ? t
              : {
                  ...t,
                  comments: t.comments.map((c) => {
                    if (c.id === action.payload.commentOrReplyId) {
                      return { ...c, text: action.payload.newText };
                    }
                    return {
                      ...c,
                      replies: c.replies.map((r) =>
                        r.id === action.payload.commentOrReplyId
                          ? { ...r, text: action.payload.newText }
                          : r
                      ),
                    };
                  }),
                }
          ),
        };
  
      case 'DELETE_COMMENT_OR_REPLY':
        return {
          ...state,
          threads: state.threads
            .map((t) => {
              if (t.id !== action.payload.threadId) return t;
              if (t.comments[0].id === action.payload.commentOrReplyId) {
                return null;
              }
              return {
                ...t,
                comments: t.comments.map((c) => ({
                  ...c,
                  replies: c.replies.filter(
                    (r) => r.id !== action.payload.commentOrReplyId
                  ),
                })),
              };
            })
            .filter(Boolean),
        };
  
      default:
        return state;
    }
  }
  
  export const CommentsProvider = ({ children }) => {
    const [state, dispatch] = useReducer(commentsReducer, initialState);
    const { addHighlight } = useHighlightContext();
    const prevRef = useRef([]);
  
    // restore any overwritten highlights when threads are deleted
    useEffect(() => {
      const removed = prevRef.current.filter(
        (p) => !state.threads.some((t) => t.id === p.id)
      );
      removed.forEach((t) => {
        if (t.originalHighlight) {
          addHighlight(t.tabId, t.originalHighlight);
        }
      });
      prevRef.current = state.threads;
    }, [state.threads, addHighlight]);
  
    const setActiveThreadId = (id) =>
      dispatch({ type: 'SET_ACTIVE_THREAD', payload: id });
  
    return (
      <CommentsContext.Provider
        value={{ ...state, dispatch, setActiveThreadId }}
      >
        {children}
      </CommentsContext.Provider>
    );
  };
  
  export const useComments = () => {
    const ctx = useContext(CommentsContext);
    if (!ctx) throw new Error('useComments must be inside CommentsProvider');
    return ctx;
  };