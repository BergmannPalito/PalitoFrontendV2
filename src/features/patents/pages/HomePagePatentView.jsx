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

import { PatentWorkspaceProvider, usePatentWorkspace } from '../context/PatentWorkspaceContext';
import { CommentsProvider } from '../context/CommentsContext';
// --- Import the new HighlightProvider ---
import { HighlightProvider } from '../context/HighlightContext';
// --- Import hook to clean up context on tab close ---
import { useHighlightContext } from '../context/HighlightContext';

import Sidebar from '../components/Sidebar/Sidebar';
import TabWorkspace from '../components/TabWorkspace/TabWorkspace';

// --- TabOverlayItem Component (unchanged) ---
function TabOverlayItem({ name }) {
    return (
        <div
           className={clsx(
                'relative flex shrink-0 items-center gap-1 px-3 py-1.5 whitespace-nowrap text-sm',
                'bg-white rounded shadow-lg border border-gray-300',
                'font-medium text-gray-900 cursor-grabbing'
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


// --- Inner component to access context ---
function PatentViewLayout() {
  // Access PatentWorkspaceContext as before
  const { openTabs, reorderTabs, addPatentToFolder, closeTab } = usePatentWorkspace();
  // --- Access HighlightContext to clean up on tab close ---
  const { removeTabHighlights } = useHighlightContext(); // Get cleanup function

  const [draggingTabId, setDraggingTabId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event) => {
      const { active } = event;
      if (active.data?.current?.type === 'tab') {
          setDraggingTabId(active.id);
      }
  }, []);

  // --- ADDED: Cleanup highlights when tab is closed via PatentWorkspaceContext ---
  const handleCloseTabAndHighlights = useCallback((tabId) => {
        closeTab(tabId); // Close tab in workspace context
        removeTabHighlights(tabId); // Remove highlights from highlight context
  }, [closeTab, removeTabHighlights]);
  // --- END ADDED ---


  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setDraggingTabId(null); // Clear dragging state first

    if (!over || !active || active.id === over.id) return; // No drop target or dropped on self

    const activeId = active.id;
    const overId = over.id;
    const activeType = active.data?.current?.type;
    const overData = over.data?.current;
    const overType = overData?.type;

    // Drop TAB onto FOLDER
    if (activeType === 'tab' && overType === 'folder') {
        const tabId = activeId;
        const folderId = overData?.folderId || overId;
        const patentData = openTabs.find(tab => tab.id === tabId);
        if (patentData?.id && patentData?.name && folderId) {
            addPatentToFolder(folderId, { id: patentData.id, name: patentData.name });
        } else { console.error("Drop cancelled: Missing patent data or folder ID."); }
        return;
    }

    // Reordering TABS
    if (activeType === 'tab' && overType === 'tab') {
        const fromIndex = openTabs.findIndex((t) => t.id === activeId);
        const toIndex = openTabs.findIndex((t) => t.id === overId);
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            reorderTabs(fromIndex, toIndex);
        } // No error log needed if indices invalid, just means no reorder
        return;
    }
  }, [openTabs, addPatentToFolder, reorderTabs]); // Dependencies

  const draggingTabData = draggingTabId ? openTabs.find(tab => tab.id === draggingTabId) : null;
  const isDragging = draggingTabId !== null;

  return (
    // Pass the modified close handler to TabWorkspace if needed,
    // OR modify TabWorkspace to call removeTabHighlights directly on close.
    // For simplicity, let's assume TabWorkspace uses the closeTab from context,
    // so we modify the closeTab function within PatentWorkspaceProvider later if needed.
    // For now, this component structure is fine, but cleanup needs wiring.
    <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-screen bg-white">
          {/* Sidebar needs no changes for highlights */}
          <Sidebar />
          {/* TabWorkspace needs the isDragging prop */}
          {/* We also need to ensure TabWorkspace's onCloseRequest eventually triggers removeTabHighlights */}
          <TabWorkspace isDragging={isDragging} />
        </div>

        <DragOverlay dropAnimation={null}>
            {draggingTabData ? (
                <TabOverlayItem name={draggingTabData.name} />
            ) : null}
        </DragOverlay>
    </DndContext>
  );
}


// Main export
export default function HomePagePatentView() {
  return (
    <PatentWorkspaceProvider>
      <CommentsProvider>
        {/* --- Wrap PatentViewLayout with HighlightProvider --- */}
        <HighlightProvider>
          <PatentViewLayout />
        </HighlightProvider>
        {/* --- End Wrap --- */}
      </CommentsProvider>
    </PatentWorkspaceProvider>
  );
}