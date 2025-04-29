// src/features/patents/components/TabWorkspace/TabWorkspace.jsx
import { useState, useId, useEffect, useCallback } from 'react'; // Added useEffect, useCallback
import { Tab } from '@headlessui/react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDndContext,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MdAdd } from 'react-icons/md';
import SortableTab from './SortableTab';
import RenameTabModal from './RenameTabModal';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
// Removed ImageClaims import - layout handled here now
// import ImageClaims from '../PatentViewerImageClaimsChatbot/ImageClaims';

// --- NEW IMPORTS ---
import DescriptionPane from '../Layout/DescriptionPane';
import CommentsPane from '../Layout/CommentsPane';
import ClaimsPane from '../Layout/ClaimsPane';
import { useMediaQuery } from '@/hooks/useMediaQuery'; // Hook for responsiveness

/* --- helper: blank “new search” tab object ------------------------------- */
const makeNewSearchTab = (id) => ({
  id,
  name: 'New Search',
  description: '',
  claims: '',
  images: '',
});

// Key for localStorage
const COMMENTS_VISIBLE_STORAGE_KEY = 'palito_commentsVisible';

export default function TabWorkspace() {
  const {
    openTabs,
    activeTabIndex,
    setActiveTab,
    reorderTabs,
    addTab,
    renameTab, // Added renameTab for completeness
  } = usePatentWorkspace();

  /* ----- local state ----- */
  const [renameInfo, setRenameInfo] = useState({
    open: false,
    id: null,
    name: '',
  });

  // --- NEW STATE for Comments Visibility ---
  const [commentsVisible, setCommentsVisible] = useState(() => {
    // Initialize state from localStorage, default to true
    try {
      const storedValue = localStorage.getItem(COMMENTS_VISIBLE_STORAGE_KEY);
      return storedValue !== null ? JSON.parse(storedValue) : true;
    } catch (error) {
      console.error("Error reading localStorage key “"+COMMENTS_VISIBLE_STORAGE_KEY+"”:", error);
      return true; // Default to true on error
    }
  });

  // --- Responsiveness ---
  const isLargeScreen = useMediaQuery('(min-width: 1024px)'); // lg breakpoint in Tailwind

  // --- Effect to handle screen size changes and localStorage ---
  useEffect(() => {
    // If screen is small, always hide comments
    if (!isLargeScreen) {
      if (commentsVisible) {
        setCommentsVisible(false);
        // Optionally, update localStorage even when forced closed,
        // or keep the user's preference for when they resize larger.
        // localStorage.setItem(COMMENTS_VISIBLE_STORAGE_KEY, JSON.stringify(false));
      }
    } else {
      // On large screens, restore from localStorage if needed (e.g., resizing back up)
      try {
        const storedValue = localStorage.getItem(COMMENTS_VISIBLE_STORAGE_KEY);
        const desiredState = storedValue !== null ? JSON.parse(storedValue) : true;
        if (commentsVisible !== desiredState) {
            setCommentsVisible(desiredState);
        }
      } catch (error) {
        console.error("Error reading localStorage on resize:", error);
      }
    }
  }, [isLargeScreen, commentsVisible]); // Rerun when screen size crosses breakpoint or state changes

  // --- Effect for Keyboard Shortcut ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl + Shift + C
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        // Only allow toggle on large screens
        if (isLargeScreen) {
          toggleComments();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLargeScreen]); // Re-add listener if isLargeScreen changes, includes toggleComments dependency implicitly

  // --- Toggle Function ---
  const toggleComments = useCallback(() => {
      // Only allow toggling on large screens
      if (!isLargeScreen) return;

      setCommentsVisible(prevVisible => {
          const nextVisible = !prevVisible;
          // Persist to localStorage
          try {
              localStorage.setItem(COMMENTS_VISIBLE_STORAGE_KEY, JSON.stringify(nextVisible));
          } catch (error) {
              console.error("Error writing to localStorage:", error);
          }
          return nextVisible;
      });
  }, [isLargeScreen]); // Dependency: only changes if screen size allows toggling


  /* ----- drag-to-reorder setup ----- */
  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = openTabs.findIndex((t) => t.id === active.id);
    const to = openTabs.findIndex((t) => t.id === over.id);
    reorderTabs(from, to);
  };

  /* ID factory for new-tab creation */
  const reactId = useId();
  const activePatent = openTabs[activeTabIndex] || null; // Get the currently active patent data

  /* ----- inner wrapper so we can read DnD context ----- */
  function TabGroupWrapper() {
    const dnd = useDndContext();
    const isDragging = dnd?.active != null;

    // Determine actual visibility based on state AND screen size
    const showComments = commentsVisible && isLargeScreen;

    return (
      <Tab.Group
        selectedIndex={activeTabIndex}
        onChange={isDragging ? () => {} : setActiveTab}
        as="div"
        className="flex h-full w-full flex-col bg-white" // Ensure background for layout
      >
        {/* ── TAB LIST ─────────────────────────────────────────── */}
        <SortableContext
          items={openTabs.map((t) => t.id)}
          strategy={horizontalListSortingStrategy}
        >
          <Tab.List className="flex h-9 shrink-0 items-center overflow-x-auto border-b bg-gray-50 px-1 shadow-sm">
            {openTabs.map((tab) => (
              <SortableTab
                key={tab.id}
                id={tab.id}
                name={tab.name}
                onRename={() =>
                  setRenameInfo({ open: true, id: tab.id, name: tab.name })
                }
              />
            ))}

            {/* small “+” icon – not a real tab */}
            <button
              type="button"
              onClick={() =>
                addTab(makeNewSearchTab(`new-${reactId}-${Date.now()}`))
              }
              title="Add new tab"
              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-gray-200"
            >
              <MdAdd size={20} />
            </button>
          </Tab.List>
        </SortableContext>

        {/* ── PANELS CONTAINER (Main Layout Area) ──────────────── */}
         {/*
           Using Tab.Panels seems incorrect here as we want the panes
           (Description, Comments, Claims) to be siblings *within* the active tab's content area.
           We'll render the panes directly based on the activePatent.
         */}
         <div className="flex flex-1 overflow-hidden"> {/* Flex container for panes */}
            {activePatent ? (
                <>
                    <DescriptionPane
                        htmlContent={activePatent.description}
                        commentsVisible={showComments}
                    />
                    {/* Conditionally render CommentsPane */}
                    {showComments && <CommentsPane />}
                    <ClaimsPane
                        patent={activePatent}
                        commentsVisible={showComments} // Pass the actual visibility
                        toggleComments={toggleComments} // Pass the toggle function
                    />
                </>
            ) : (
                 <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select a patent or add a new tab.
                 </div>
            )}
         </div>

        {/* --- OLD Tab.Panels approach (commented out) ---
        <Tab.Panels className="flex-1 overflow-hidden">
          {openTabs.map((t) => (
            // Each Tab.Panel would need the 3-pane layout inside it. This is redundant.
            <Tab.Panel key={t.id} className="h-full flex">
               <DescriptionPane htmlContent={t.description} commentsVisible={showComments} />
               {showComments && <CommentsPane />}
               <ClaimsPane patent={t} commentsVisible={showComments} toggleComments={toggleComments} />
            </Tab.Panel>
          ))}
        </Tab.Panels>
        */}
      </Tab.Group>
    );
  }

  /* ----- render ----- */
  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <TabGroupWrapper />
      </DndContext>

      {/* rename-modal */}
      {renameInfo.open && (
        <RenameTabModal
          tabId={renameInfo.id}
          initialName={renameInfo.name}
          open={renameInfo.open}
          // Ensure renameTab is passed correctly if needed, or handle rename via context dispatch
           onClose={() => setRenameInfo({ open: false, id: null, name: '' })}
           // Assuming RenameTabModal uses context now, or pass renameTab prop
           // renameTab={renameTab} // If RenameTabModal expects it as a prop
        />
      )}
    </>
  );
}