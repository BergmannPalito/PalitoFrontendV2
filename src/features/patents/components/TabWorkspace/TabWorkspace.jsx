// src/features/patents/components/TabWorkspace/TabWorkspace.jsx
import { useState, useId, useEffect, useCallback, useMemo, useRef } from 'react';
import { Tab } from '@headlessui/react';
import PropTypes from 'prop-types';
import {
    SortableContext,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MdAdd, MdSearch } from 'react-icons/md';
import clsx from 'clsx';
import SortableTab from './SortableTab';
import RenameTabModal from './RenameTabModal';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
// Layout Panes
import DescriptionPane from '../Layout/DescriptionPane'; // <- Keep this
import CommentsPane from '../Layout/CommentsPane';
import ClaimsPane from '../Layout/ClaimsPane';
import { useMediaQuery } from '@/hooks/useMediaQuery';
// Import the mock search function (or your actual search service)
import { mockSearch } from '@/features/patents/services/mockSearch';


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
    currentPatent, // This is the active tab object
    toggleCommentsPane,
    isDragging,
    tabGroupKey,
    scrollContainerRef,
    onCompleteSearchRequest, // Callback for search completion
}) {
  const [isOverflowing, setIsOverflowing] = useState(false);
  // Local state for the search input within a search tab
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

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
    return () => { cancelAnimationFrame(animationFrameId); resizeObserver.disconnect(); };
  }, [tabs.length, scrollContainerRef]); // Add scrollContainerRef to dependencies

  // Effect to reset search state when tab changes
  useEffect(() => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchError(null);
  }, [currentPatent?.id]); // Reset when active tab ID changes

  const selectedIndex = currentIndex >= 0 && Array.isArray(tabs) && currentIndex < tabs.length ? currentIndex : 0;

  const AddButton = () => (
      <button type="button" onClick={onAddRequest} title="Add new tab (Ctrl+T)" className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" >
          <MdAdd size={20} />
      </button>
   );

   // --- Search Handling ---
   const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim() || !currentPatent?.id || isSearching) return;
        setIsSearching(true);
        setSearchError(null);
        try {
            console.log(`[TabWorkspace] Searching for: ${searchQuery} in tab ${currentPatent.id}`);
            const patentData = await mockSearch(searchQuery.trim()); // Use your search function
            console.log(`[TabWorkspace] Search successful for ${searchQuery}`, patentData);
            // Call the callback to update the context
            onCompleteSearchRequest(currentPatent.id, patentData);
            // No need to reset state here, useEffect [currentPatent.id] will handle it
        } catch (error) {
            console.error(`[TabWorkspace] Search failed for ${searchQuery}:`, error);
            setSearchError(error?.message || 'Patent not found or error occurred.'); // Show error message from mockSearch
            setIsSearching(false);
        }
        // Note: `isSearching` remains true until the tab actually updates and the useEffect triggers
   };
   // --- End Search Handling ---

   // Determine if the current active tab is in the "search" state
   const isActiveTabInSearchState = currentPatent && !currentPatent.isSearchCompleted;

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
        <div ref={scrollContainerRef} className={clsx( "flex flex-1 items-center h-full", isOverflowing ? "overflow-x-auto overflow-y-hidden no-scrollbar" : "overflow-hidden" )} >
          <SortableContext items={Array.isArray(tabs) ? tabs.map((t) => t.id) : []} strategy={horizontalListSortingStrategy} >
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
        {isOverflowing && ( <div className="flex flex-shrink-0 items-center pl-1"> <AddButton /> </div> )}
      </div>

      {/* ── PANELS CONTAINER ─────────────────────────────────── */}
       <div className="flex flex-1 overflow-hidden bg-white">
         {currentPatent ? (
              // --- Conditionally render panes based on isSearchCompleted ---
              isActiveTabInSearchState ? (
                  // --- Render Search Input UI ---
                  <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Search Patent</h2>
                     <form onSubmit={handleSearchSubmit} className="w-full max-w-md space-y-4">
                        <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                            <MdSearch className="text-gray-400 mr-2 flex-shrink-0" size={18} />
                            <input
                                type="text"
                                placeholder="Enter publication number (e.g., EP1626661B1)"
                                className="flex-1 text-sm outline-none bg-transparent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={isSearching}
                                autoFocus
                            />
                        </div>
                        {searchError && (
                            <p className="text-sm text-red-600 text-center">{searchError}</p>
                        )}
                        <button
                            type="submit"
                            className="w-full flex justify-center items-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isSearching || !searchQuery.trim()}
                        >
                           {isSearching ? (
                               <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Searching...
                               </>
                           ) : (
                               'Search'
                           )}
                        </button>
                     </form>
                     {/* Example Usage Hint */}
                     <p className="text-xs text-gray-500 mt-4">Example: try searching for <code className="bg-gray-200 px-1 rounded">EP1626661B1</code></p>
                  </div>
              ) : (
                   // --- Render Normal Panes ---
                  <>
                      {/* --- MODIFIED: Pass paragraphs to DescriptionPane --- */}
                      <DescriptionPane
                        paragraphs={currentPatent.paragraphs || []} // Pass paragraphs array
                        commentsVisible={showCommentsPane}
                      />
                      {/* -------------------------------------------------- */}

                      {/* Render Comments only if visible AND search is completed */}
                      {showCommentsPane && <CommentsPane />}
                      {/* Render Claims/Figures only if search is completed */}
                      <ClaimsPane
                        patent={currentPatent} // Pass full patent object
                        commentsVisible={showCommentsPane}
                        toggleComments={toggleCommentsPane}
                      />
                  </>
              )
              // --- End Conditional Rendering ---
          ) : (
              // --- No Tab Selected View ---
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
  currentPatent: PropTypes.object, // Can be null if no tab selected
  toggleCommentsPane: PropTypes.func.isRequired,
  isDragging: PropTypes.bool.isRequired,
  tabGroupKey: PropTypes.string.isRequired,
  scrollContainerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
  onCompleteSearchRequest: PropTypes.func.isRequired,
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
    completeSearch = () => {}, // <-- Get the new action dispatcher
    makeNewSearchTab = (id) => ({ // Fallback if context doesn't provide it yet
        id, name: 'New Search', description: '<p>Enter search criteria...</p>', claims: '<p>N/A</p>', images: '', isSearchTab: true, isSearchCompleted: false
    }),
  } = workspaceContext || {};

  const [renameInfo, setRenameInfo] = useState({ open: false, id: null, name: '' });
  const [commentsVisible, setCommentsVisible] = useState(() => { try { const v=localStorage.getItem(COMMENTS_VISIBLE_STORAGE_KEY); return v!==null ? JSON.parse(v):true; } catch {return true;} });
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const toggleComments = useCallback(() => { if (!isLargeScreen) return; setCommentsVisible(v => !v); }, [isLargeScreen]);
  const reactId = useId();
  const scrollContainerRef = useRef(null); // <-- Create ref here in the parent

  // Effect to scroll to end when a tab is added
  useEffect(() => {
      const scrollContainer = scrollContainerRef.current;
      const isLastTabActive = activeTabIndex === openTabs.length - 1;
      if (isLastTabActive && scrollContainer && openTabs.length > 0) {
          requestAnimationFrame(() => {
              const currentScrollContainer = scrollContainerRef.current;
              if(currentScrollContainer){ currentScrollContainer.scrollLeft = currentScrollContainer.scrollWidth; }
          });
      }
  }, [activeTabIndex, openTabs.length]);

  // Effect to manage comments visibility based on screen size
  useEffect(() => { if (!isLargeScreen && commentsVisible) setCommentsVisible(false); }, [isLargeScreen, commentsVisible]);

    // Effect to save comments visibility state
    useEffect(() => {
        try {
            localStorage.setItem(COMMENTS_VISIBLE_STORAGE_KEY, JSON.stringify(commentsVisible));
        } catch (e) {
            console.error("Failed to save comments visibility state:", e);
        }
    }, [commentsVisible]);

  // Effect for keyboard shortcuts (Ctrl+Shift+C, Ctrl+W, Ctrl+T)
  useEffect(() => {
      const handleKeyDown=(e)=>{
          if(e.ctrlKey&&e.shiftKey&&e.key==='C'){e.preventDefault();if(isLargeScreen)toggleComments();}
          if((e.ctrlKey||e.metaKey)&&e.key==='w'){
              e.preventDefault();
              const id=Array.isArray(openTabs)?openTabs[activeTabIndex]?.id:null;
              if(id)handleCloseTab(id);
          }
          // Shortcut for adding a new tab (Ctrl+T)
          if ((e.ctrlKey || e.metaKey) && e.key === 't') {
              e.preventDefault();
              handleAddTab(); // Call the add tab handler
          }
      };
      window.addEventListener('keydown',handleKeyDown); return ()=>window.removeEventListener('keydown',handleKeyDown);
    // Add handleAddTab to dependencies if it changes, or wrap it in useCallback
    }, [isLargeScreen, toggleComments, openTabs, activeTabIndex, closeTab, addTab, makeNewSearchTab, reactId]); // Added addTab, makeNewSearchTab, reactId

  // Handler for closing tab (wrapped in useCallback)
  const handleCloseTab = useCallback((tabIdToClose) => { closeTab(tabIdToClose); }, [closeTab]);

  // Handler for adding a new search tab (wrapped in useCallback)
  const handleAddTab = useCallback(() => {
      // Use the makeNewSearchTab function (from context or local)
      const newTab = makeNewSearchTab(`new-${reactId}-${Date.now()}`);
      addTab(newTab);
  }, [addTab, makeNewSearchTab, reactId]); // Dependencies for adding a tab


  // Get the currently active patent/tab object
  const activePatent = (Array.isArray(openTabs) && activeTabIndex >= 0 && activeTabIndex < openTabs.length) ? openTabs[activeTabIndex] : null;

  // Key to force re-render of Tab.Group when tab order changes
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
           onAddRequest={handleAddTab} // Use the memoized handler
           showCommentsPane={commentsVisible && isLargeScreen}
           currentPatent={activePatent}
           toggleCommentsPane={toggleComments}
           isDragging={isDragging}
           tabGroupKey={tabOrderKey}
           scrollContainerRef={scrollContainerRef} // <-- Pass ref down
           onCompleteSearchRequest={completeSearch} // <-- Pass context action down
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