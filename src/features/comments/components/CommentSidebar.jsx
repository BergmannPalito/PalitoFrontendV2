// src/features/comments/components/CommentSidebar.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useComments } from '../hooks/useComments';
import CommentThread from './CommentThread';
import { getRectsForSavedRange } from '../../highlights/utils/highlightOverlayHelpers';

const CommentSidebar = ({ tabId }) => {
  const [editor] = useLexicalComposerContext();
  const { threads, dispatch, activeThreadId } = useComments(); // Added activeThreadId for logging if needed elsewhere
  const sidebarRef = useRef(null);

  // STEP 5: Ensure the Sidebar sees the new thread
  //console.log('[Sidebar] threads for tabId=', tabId, threads.filter(t => t.tabId === tabId));


  /* ➜ position calculation + collision-avoidance (4 px gap) */
  useEffect(() => {
    if (!editor || !sidebarRef.current) return;
    const sbRect = sidebarRef.current.getBoundingClientRect();
    const candidates = [];

    threads
      .filter((t) => t.tabId === tabId)
      .forEach((t) => {
        editor.getEditorState().read(() => {
          const rects = getRectsForSavedRange(editor, t.textRange);
          if (rects.length) {
            const midY = rects[0].top + rects[0].height / 2;
            const relTop = midY - sbRect.top;
            candidates.push({ id: t.id, rawTop: relTop });
          }
        });
      });

    /* simple collision fix */
    const GAP = 4;
    candidates.sort((a, b) => a.rawTop - b.rawTop);
    let last = -Infinity;
    candidates.forEach(({ id, rawTop }) => {
      const el = document.getElementById(`comment-thread-${id}`);
      let height = el?.offsetHeight;
      if (!height || height === 0) {
          console.warn(`[CommentSidebar] Could not determine height for thread ${id}. Using minimum fallback.`);
          height = 50;
      }
      
      const top = Math.max(rawTop, last + GAP);
      last = top + (height || 0);
      dispatch({
        type: 'SET_THREAD_POSITION',
        payload: { threadId: id, position: { top, left: 0 } }, // Assuming left is always 0 for sidebar
      });
    });
  }, [threads, editor, dispatch, tabId]);

  const tabThreads = threads.filter((t) => t.tabId === tabId);

  return (
    <aside
      ref={sidebarRef}
      className="w-80 h-full border-l border-gray-200 bg-slate-50 p-4 overflow-hidden relative" // Changed to overflow-hidden as threads are absolutely positioned
    >
      <h2 className="text-lg font-semibold mb-4">Comments ({tabThreads.length})</h2>

      {tabThreads.length === 0 ? (
        <p className="text-sm text-gray-500">
          No comments. Select text and click “Comment”.
        </p>
      ) : (
        <div className="relative h-full"> {/* Added h-full to ensure relative positioning context fills the sidebar */}
          {tabThreads.map((t) => (
            <CommentThread key={t.id} thread={t} />
          ))}
        </div>
      )}
    </aside>
  );
};

CommentSidebar.propTypes = {
  tabId: PropTypes.string.isRequired,
};

export default CommentSidebar;