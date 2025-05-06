// src/features/patents/pages/HomePagePatentView.jsx
import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  rectIntersection,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { MdDragIndicator } from 'react-icons/md';
import clsx from 'clsx';

import { HighlightProvider } from '../context/HighlightContext';      // ← FIRST
import { PatentWorkspaceProvider, usePatentWorkspace } from '../context/PatentWorkspaceContext';
import { CommentsProvider } from '@/features/comments/context/CommentsContext';

import Sidebar from '../components/Sidebar/Sidebar';
import TabWorkspace from '../components/TabWorkspace/TabWorkspace';

/* ─────────────────────────────────────────────────────────── */
/*                    DRAG‑OVERLAY TAB ITEM                    */
/* ─────────────────────────────────────────────────────────── */
function TabOverlayItem({ name }) {
  return (
    <div
      className={clsx(
        'relative flex shrink-0 items-center gap-1 px-3 py-1.5 whitespace-nowrap text-sm',
        'bg-white rounded shadow-lg border border-gray-300',
        'font-medium text-gray-900 cursor-grabbing',
      )}
    >
      <span className="mr-1 text-gray-400 cursor-grabbing">
        <MdDragIndicator size={14} />
      </span>
      <span className="max-w-[120px] truncate">{name}</span>
    </div>
  );
}
TabOverlayItem.propTypes = { name: PropTypes.string.isRequired };

/* ─────────────────────────────────────────────────────────── */
/*                    PATENT‑VIEW LAYOUT                       */
/* ─────────────────────────────────────────────────────────── */
function PatentViewLayout() {
  const { openTabs, reorderTabs, addPatentToFolder, closeTab } =
    usePatentWorkspace();

  const [draggingTabId, setDraggingTabId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback(({ active }) => {
    if (active.data?.current?.type === 'tab') {
      setDraggingTabId(active.id);
    }
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      setDraggingTabId(null);
      if (!over || !active || active.id === over.id) return;

      const activeType = active.data?.current?.type;
      const overData = over.data?.current;

      /* tab dropped on folder = add to folder */
      if (activeType === 'tab' && overData?.type === 'folder') {
        const patent = openTabs.find((t) => t.id === active.id);
        if (patent) addPatentToFolder(overData.folderId, { id: patent.id, name: patent.name });
        return;
      }

      /* reorder tabs */
      if (activeType === 'tab' && overData?.type === 'tab') {
        const from = openTabs.findIndex((t) => t.id === active.id);
        const to = openTabs.findIndex((t) => t.id === over.id);
        if (from !== -1 && to !== -1 && from !== to) reorderTabs(from, to);
      }
    },
    [openTabs, addPatentToFolder, reorderTabs],
  );

  const draggingTab = draggingTabId
    ? openTabs.find((t) => t.id === draggingTabId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-white">
        <Sidebar />
        <TabWorkspace isDragging={!!draggingTab} />
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingTab ? <TabOverlayItem name={draggingTab.name} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*                MAIN PAGE EXPORT (providers)                 */
/* ─────────────────────────────────────────────────────────── */
export default function HomePagePatentView() {
  return (
    <HighlightProvider>                 {/* ← OUTERMOST */}
      <PatentWorkspaceProvider>         {/* ← needs highlight above */}
        <CommentsProvider>
          <PatentViewLayout />
        </CommentsProvider>
      </PatentWorkspaceProvider>
    </HighlightProvider>
  );
}
