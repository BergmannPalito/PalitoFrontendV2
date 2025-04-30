// src/features/patents/components/TabWorkspace/TabWorkspace.jsx
import { useState, useId, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
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
// Add 'tabGroupKey' prop
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
    tabGroupKey, // <-- Receive the key
}) {

  const selectedIndex = currentIndex >= 0 && Array.isArray(tabs) && currentIndex < tabs.length ? currentIndex : 0;

  return (
    <Tab.Group
      key={tabGroupKey} // <-- Apply the key here
      selectedIndex={selectedIndex}
      onChange={isDragging ? () => {} : onTabChange}
      as="div"
      className="flex h-full w-full flex-col overflow-hidden bg-gray-50"
    >
      {/* ── TAB LIST ─────────────────────────────────────────── */}
      <div className="relative flex h-10 shrink-0 items-center border-b bg-white px-1 shadow-sm">
          <SortableContext
              items={Array.isArray(tabs) ? tabs.map((t) => t.id) : []}
              strategy={horizontalListSortingStrategy}
          >
              <Tab.List className="flex flex-1 h-full items-center overflow-x-auto overflow-y-hidden">
              {Array.isArray(tabs) && tabs.map((tab) => (
                  <SortableTab
                      key={tab.id} // Keep individual tab key
                      id={tab.id}
                      name={tab.name}
                      onRename={() => onRenameRequest(tab.id, tab.name)}
                      onClose={() => onCloseRequest(tab.id)}
                  />
              ))}
              </Tab.List>
          </SortableContext>
           <button type="button" onClick={onAddRequest} title="Add new tab (Ctrl+T)" className="ml-2 mr-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <MdAdd size={20} />
          </button>
      </div>

      {/* ── PANELS CONTAINER ─────────────────────────────────── */}
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
  tabGroupKey: PropTypes.string.isRequired, // <-- Add key prop type
};


// Main component receives isDragging prop
export default function TabWorkspace({ isDragging }) {
  // Get context, providing defaults
  const workspaceContext = usePatentWorkspace();
  const {
    openTabs = [],
    activeTabIndex = 0,
    setActiveTab = () => {},
    addTab = () => {},
    closeTab = () => {},
  } = workspaceContext || {};

  // Local state
  const [renameInfo, setRenameInfo] = useState({ open: false, id: null, name: '' });
  const [commentsVisible, setCommentsVisible] = useState(() => { try { const v=localStorage.getItem(COMMENTS_VISIBLE_STORAGE_KEY); return v!==null ? JSON.parse(v):true; } catch {return true;} });
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const toggleComments = useCallback(() => { if (!isLargeScreen) return; setCommentsVisible(v => !v); }, [isLargeScreen]);

  // Effects
  useEffect(() => { if (!isLargeScreen && commentsVisible) setCommentsVisible(false); }, [isLargeScreen, commentsVisible]);
  useEffect(() => {
      const handleKeyDown=(e)=>{if(e.ctrlKey&&e.shiftKey&&e.key==='C'){e.preventDefault();if(isLargeScreen)toggleComments();}if((e.ctrlKey||e.metaKey)&&e.key==='w'){e.preventDefault();const id=Array.isArray(openTabs)?openTabs[activeTabIndex]?.id:null;if(id)handleCloseTab(id);}};
      window.addEventListener('keydown',handleKeyDown); return ()=>window.removeEventListener('keydown',handleKeyDown);
    }, [isLargeScreen, toggleComments, openTabs, activeTabIndex, closeTab]);

  const handleCloseTab = useCallback((tabIdToClose) => { closeTab(tabIdToClose); }, [closeTab]);
  const reactId = useId();

   // Derive activePatent based on the index from context state
   const activePatent = (Array.isArray(openTabs) && activeTabIndex >= 0 && activeTabIndex < openTabs.length) ? openTabs[activeTabIndex] : null;

   // --- FIX: Generate a key based on the order of tab IDs ---
   const tabOrderKey = useMemo(() => {
       if (!Array.isArray(openTabs)) return 'no-tabs';
       return openTabs.map(tab => tab.id).join('-');
   }, [openTabs]);
   // --- END FIX ---

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
           tabGroupKey={tabOrderKey} // <-- Pass the key here
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

// Prop type for TabWorkspace
TabWorkspace.propTypes = {
    isDragging: PropTypes.bool.isRequired,
};