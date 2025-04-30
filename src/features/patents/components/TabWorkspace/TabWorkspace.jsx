// src/features/patents/components/TabWorkspace/TabWorkspace.jsx
import { useState, useId, useEffect, useCallback, useMemo, useRef } from 'react'; // useRef, useState, useEffect were already imported
import { Tab } from '@headlessui/react';
import PropTypes from 'prop-types';
import {
    SortableContext,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MdAdd } from 'react-icons/md';
import clsx from 'clsx';
import SortableTab from './SortableTab';
import RenameTabModal from './RenameTabModal';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
// Layout Panes
import DescriptionPane from '../Layout/DescriptionPane';
import CommentsPane from '../Layout/CommentsPane';
import ClaimsPane from '../Layout/ClaimsPane';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/* --- helper: blank “new search” tab object (unchanged) --- */
const makeNewSearchTab = (id) => ({
    id, name: 'New Search', description: '<p>Search...</p>', claims: '<p>N/A</p>', images: '', isSearchTab: true
});
const COMMENTS_VISIBLE_STORAGE_KEY = 'palito_commentsVisible';

// --- Standalone TabGroupWrapper Component ---
// Now accepts scrollContainerRef from parent
function TabGroupWrapper({
    tabs,
    currentIndex,
    onTabChange,
    onRenameRequest,
    onCloseRequest,
    onAddRequest,
    showCommentsPane,
    currentPatent,
    toggleCommentsPane,
    isDragging,
    tabGroupKey,
    scrollContainerRef, // <-- Accept the ref from parent
}) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  // Removed local scrollContainerRef, using the one passed via props

  // Effect to detect overflow (uses the passed scrollContainerRef)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current; // Use the passed ref
    if (!scrollContainer) return;

    let animationFrameId = null;

    const checkOverflow = () => {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            const hasOverflow = scrollContainer.scrollWidth > scrollContainer.clientWidth + 1;
            setIsOverflowing(prev => prev !== hasOverflow ? hasOverflow : prev);
        });
    };

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(scrollContainer);
    checkOverflow(); // Initial check

    return () => {
        cancelAnimationFrame(animationFrameId);
        resizeObserver.disconnect();
    };
  }, [tabs.length, scrollContainerRef]); // Add scrollContainerRef to dependencies

  const selectedIndex = currentIndex >= 0 && Array.isArray(tabs) && currentIndex < tabs.length ? currentIndex : 0;

  const AddButton = () => (
      <button
          type="button"
          onClick={onAddRequest}
          title="Add new tab (Ctrl+T)"
          className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
          <MdAdd size={20} />
      </button>
   );

  return (
    <Tab.Group
      key={tabGroupKey}
      selectedIndex={selectedIndex}
      onChange={isDragging ? () => {} : onTabChange}
      as="div"
      className="flex h-full w-full flex-col overflow-hidden bg-gray-50"
    >
      {/* ── TAB LIST BAR ─────────────────────────────────────────── */}
      <div className="relative flex h-10 shrink-0 items-center border-b bg-white px-1 shadow-sm">
        {/* Attach the passed ref here */}
        <div
          ref={scrollContainerRef} // <-- Attach the ref here
          className={clsx(
            "flex flex-1 items-center h-full",
            isOverflowing ? "overflow-x-auto overflow-y-hidden no-scrollbar" : "overflow-hidden"
          )}
        >
          <SortableContext
            items={Array.isArray(tabs) ? tabs.map((t) => t.id) : []}
            strategy={horizontalListSortingStrategy}
          >
            <Tab.List className={clsx("inline-flex h-full items-center min-w-0", isOverflowing && "pr-2")}>
              {Array.isArray(tabs) && tabs.map((tab) => (
                <SortableTab
                  key={tab.id}
                  id={tab.id}
                  name={tab.name}
                  onRename={() => onRenameRequest(tab.id, tab.name)}
                  onClose={() => onCloseRequest(tab.id)}
                />
              ))}
            </Tab.List>
          </SortableContext>

          {!isOverflowing && <AddButton />}
        </div>

        {isOverflowing && (
          <div className="flex flex-shrink-0 items-center pl-1">
             <AddButton />
          </div>
        )}
      </div>

      {/* ── PANELS CONTAINER ─────────────────────────────────── */}
      {/* ... (Panel content remains the same) ... */}
       <div className="flex flex-1 overflow-hidden bg-white">
         {currentPatent ? (
              <>
                  <DescriptionPane htmlContent={currentPatent.description} commentsVisible={showCommentsPane}/>
                  {showCommentsPane && <CommentsPane />}
                  <ClaimsPane patent={currentPatent} commentsVisible={showCommentsPane} toggleComments={toggleCommentsPane}/>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-10 text-center">
                  {Array.isArray(tabs) && tabs.length === 0 ? (
                      <>
                       <p className="text-lg mb-4">No tabs open.</p>
                       <button onClick={onAddRequest} className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2" > <MdAdd size={18} /> Add New Tab </button>
                      </>
                  ) : (
                      <p>Select a tab to view its content.</p>
                  )}
               </div>
          )}
      </div>
    </Tab.Group>
  );
}

// Define prop types for TabGroupWrapper
TabGroupWrapper.propTypes = {
  tabs: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  onRenameRequest: PropTypes.func.isRequired,
  onCloseRequest: PropTypes.func.isRequired,
  onAddRequest: PropTypes.func.isRequired,
  showCommentsPane: PropTypes.bool.isRequired,
  currentPatent: PropTypes.object,
  toggleCommentsPane: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  tabGroupKey: PropTypes.string.isRequired,
  scrollContainerRef: PropTypes.oneOfType([ // <-- Add prop type for the ref
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
};


// Main component TabWorkspace
export default function TabWorkspace({ isDragging }) {
  const workspaceContext = usePatentWorkspace();
  const {
    openTabs = [],
    activeTabIndex = 0,
    setActiveTab = () => {},
    addTab = () => {},
    closeTab = () => {},
  } = workspaceContext || {};

  const [renameInfo, setRenameInfo] = useState({ open: false, id: null, name: '' });
  const [commentsVisible, setCommentsVisible] = useState(() => { try { const v=localStorage.getItem(COMMENTS_VISIBLE_STORAGE_KEY); return v!==null ? JSON.parse(v):true; } catch {return true;} });
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const toggleComments = useCallback(() => { if (!isLargeScreen) return; setCommentsVisible(v => !v); }, [isLargeScreen]);
  const reactId = useId();
  const scrollContainerRef = useRef(null); // <-- Create ref here in the parent

  // --- NEW Effect to scroll to end when a tab is added ---
  useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      // Check if the active tab is the last one (common case when adding)
      // and if the scroll container element exists.
      const isLastTabActive = activeTabIndex === openTabs.length - 1;

      if (isLastTabActive && scrollContainer && openTabs.length > 0) {
          // Use requestAnimationFrame to ensure DOM updates (like scrollWidth) are calculated
          // *after* the new tab has been rendered.
          requestAnimationFrame(() => {
              // Check ref again inside animation frame as component might unmount
              const currentScrollContainer = scrollContainerRef.current;
              if(currentScrollContainer){
                   // Scroll to the maximum horizontal position
                   currentScrollContainer.scrollLeft = currentScrollContainer.scrollWidth;
              }
          });
      }
   // Dependencies: Trigger when the active tab index changes or the total number of tabs changes.
  }, [activeTabIndex, openTabs.length]);
  // --- End NEW Effect ---

  // Existing Effects (unchanged)
  useEffect(() => { if (!isLargeScreen && commentsVisible) setCommentsVisible(false); }, [isLargeScreen, commentsVisible]);
  useEffect(() => {
      const handleKeyDown=(e)=>{if(e.ctrlKey&&e.shiftKey&&e.key==='C'){e.preventDefault();if(isLargeScreen)toggleComments();}if((e.ctrlKey||e.metaKey)&&e.key==='w'){e.preventDefault();const id=Array.isArray(openTabs)?openTabs[activeTabIndex]?.id:null;if(id)handleCloseTab(id);}};
      window.addEventListener('keydown',handleKeyDown); return ()=>window.removeEventListener('keydown',handleKeyDown);
    }, [isLargeScreen, toggleComments, openTabs, activeTabIndex, closeTab]); // Keep closeTab dependency here

  const handleCloseTab = useCallback((tabIdToClose) => { closeTab(tabIdToClose); }, [closeTab]);

  const activePatent = (Array.isArray(openTabs) && activeTabIndex >= 0 && activeTabIndex < openTabs.length) ? openTabs[activeTabIndex] : null;
  const tabOrderKey = useMemo(() => {
       if (!Array.isArray(openTabs)) return 'no-tabs';
       return openTabs.map(tab => tab.id).join('-');
   }, [openTabs]);

  return (
    <>
        <TabGroupWrapper
           tabs={openTabs}
           currentIndex={activeTabIndex}
           onTabChange={setActiveTab}
           onRenameRequest={(id, name) => setRenameInfo({ open: true, id, name })}
           onCloseRequest={handleCloseTab}
           onAddRequest={() => addTab(makeNewSearchTab(`new-${reactId}-${Date.now()}`))}
           showCommentsPane={commentsVisible && isLargeScreen}
           currentPatent={activePatent}
           toggleCommentsPane={toggleComments}
           isDragging={isDragging}
           tabGroupKey={tabOrderKey}
           scrollContainerRef={scrollContainerRef} // <-- Pass ref down
        />

      {renameInfo.open && (
        <RenameTabModal
          tabId={renameInfo.id}
          initialName={renameInfo.name}
          open={renameInfo.open}
          onClose={() => setRenameInfo({ open: false, id: null, name: '' })}
         />
       )}
    </>
  );
}

// Prop type for TabWorkspace (unchanged)
TabWorkspace.propTypes = {
    isDragging: PropTypes.bool.isRequired,
};