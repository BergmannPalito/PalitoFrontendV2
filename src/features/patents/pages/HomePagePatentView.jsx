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
import Sidebar from '../components/Sidebar/Sidebar';
import TabWorkspace from '../components/TabWorkspace/TabWorkspace'; // Now uses TabGroupWrapper internally

// --- TabOverlayItem Component (unchanged) ---
function TabOverlayItem({ name }) {
    // ... (component code)
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
// --- End TabOverlayItem ---


// --- Inner component to access context ---
function PatentViewLayout() {
  const { openTabs, reorderTabs, addPatentToFolder } = usePatentWorkspace();
  const [draggingTabId, setDraggingTabId] = useState(null); // State remains here

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event) => {
      const { active } = event;
      if (active.data?.current?.type === 'tab') {
          // console.log("HomePage Drag Start:", active.id);
          setDraggingTabId(active.id);
      }
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    // Clear dragging state *before* dispatching actions
    setDraggingTabId(null);

    if (!over || !active) return;
    // Prevent dropping tab on itself during reorder
     if (active.data?.current?.type === 'tab' && active.id === over.id && over.data?.current?.type === 'tab') return;


    const activeId = active.id;
    const overId = over.id;
    const activeType = active.data?.current?.type;
    const overData = over.data?.current;
    const overType = overData?.type;

    // console.log('HomePage Drag End Event:', { activeId, overId, activeType, overType, overData });

    // Scenario 1: Dropping TAB onto FOLDER
    if (activeType === 'tab' && overType === 'folder') {
        const tabId = activeId;
        const folderId = overData?.folderId || overId;
        const patentData = openTabs.find(tab => tab.id === tabId);
        if (patentData?.id && patentData?.name && folderId) {
            // console.log(`HomePage Dispatching addPatentToFolder...`);
            addPatentToFolder(folderId, { id: patentData.id, name: patentData.name });
        } else { console.error("Drop cancelled: Missing patent data or folder ID."); }
        return;
    }

    // Scenario 2: Reordering TABS
    if (activeType === 'tab' && overType === 'tab') { // Ensure target is tab
        const fromIndex = openTabs.findIndex((t) => t.id === activeId);
        const toIndex = openTabs.findIndex((t) => t.id === overId);
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            // console.log(`HomePage Dispatching reorderTabs...`);
            reorderTabs(fromIndex, toIndex);
        } else { console.error("Reorder cancelled: Invalid indices."); }
        return;
    }

    // console.log("HomePage Unhandled drag end scenario:", { activeType, overType });
  }, [openTabs, addPatentToFolder, reorderTabs]); // Dependencies

  const draggingTabData = draggingTabId ? openTabs.find(tab => tab.id === draggingTabId) : null;
  const isDragging = draggingTabId !== null; // Boolean flag

  return (
    <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-screen bg-white">
          <Sidebar />
          {/* Pass isDragging flag down */}
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


export default function HomePagePatentView() {
  return (
    <PatentWorkspaceProvider>
      <CommentsProvider>
        <PatentViewLayout />
      </CommentsProvider>
    </PatentWorkspaceProvider>
  );
}