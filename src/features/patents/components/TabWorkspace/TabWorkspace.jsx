/* ────────────────────────────────────────────────────────────
   src/features/patents/components/TabWorkspace/TabWorkspace.jsx
   ──────────────────────────────────────────────────────────── */
   import {
    useState,
    useId,
    useEffect,
    useCallback,
    useMemo,
    useRef,
  } from 'react';
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

  import DescriptionPane from '../Layout/DescriptionPane';
  // CommentsPane import is no longer directly used by TabGroupWrapper for rendering the sidebar itself
  import ClaimsPane from '../Layout/ClaimsPane';

  import { useMediaQuery } from '@/hooks/useMediaQuery';
  import { mockSearch } from '@/features/patents/services/mockSearch';

  const COMMENTS_VISIBLE_STORAGE_KEY = 'palito_commentsVisible';

  /* ═══════════════════════════════════════════════════════════ */
  /* TAB‑GROUP WRAPPER                     */
  /* ═══════════════════════════════════════════════════════════ */
  function TabGroupWrapper({
    tabs,
    currentIndex,
    onTabChange,
    onRenameRequest,
    onCloseRequest,
    onAddRequest,
    showCommentsPane, // Global state: should the comment pane area be visible?
    currentPatent,
    toggleCommentsPane,
    isDragging,
    tabGroupKey,
    scrollContainerRef,
    onCompleteSearchRequest,
  }) {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Effect for overflow detection (no changes needed)
    useEffect(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() =>
        setIsOverflowing(el.scrollWidth > el.clientWidth + 1),
      );
      ro.observe(el);
      return () => ro.disconnect();
    }, [tabs.length, scrollContainerRef]);

    // Effect to reset search UI on tab switch (no changes needed)
    useEffect(() => {
      setSearchQuery('');
      setIsSearching(false);
      setSearchError(null);
    }, [currentPatent?.id]);

    const selectedIndex =
      currentIndex >= 0 && currentIndex < tabs.length ? currentIndex : 0;

    const AddButton = () => (
      <button
        type="button"
        title="Add new tab (Ctrl+T)"
        onClick={onAddRequest}
        className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <MdAdd size={20} />
      </button>
    );

    const handleSearchSubmit = async (e) => {
      e.preventDefault();
      if (!searchQuery.trim() || !currentPatent?.id || isSearching) return;
      setIsSearching(true);
      setSearchError(null);
      try {
        const patentData = await mockSearch(searchQuery.trim());
        onCompleteSearchRequest(currentPatent.id, patentData);
      } catch (err) {
        setSearchError(err?.message || 'Search failed.');
        setIsSearching(false);
      }
    };

    const isSearchTab = currentPatent?.isSearchCompleted === false;

    return (
      <Tab.Group
        key={tabGroupKey}
        selectedIndex={selectedIndex}
        onChange={isDragging ? () => {} : onTabChange}
        as="div"
        className="flex h-full w-full flex-col overflow-hidden bg-gray-50"
      >
        {/* Tab List Header */}
        <div className="relative flex h-10 shrink-0 items-center border-b bg-white px-1 shadow-sm">
          <div
            ref={scrollContainerRef}
            className={clsx(
              'flex flex-1 items-center h-full',
              isOverflowing
                ? 'overflow-x-auto overflow-y-hidden no-scrollbar'
                : 'overflow-hidden',
            )}
          >
            <SortableContext
              items={tabs.map((t) => t.id)}
              strategy={horizontalListSortingStrategy}
            >
              <Tab.List
                className={clsx(
                  'inline-flex h-full items-center min-w-0',
                  isOverflowing && 'pr-2',
                )}
              >
                {tabs.map((tab) => (
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

        {/* PANES AREA - Main Flex Container */}
        <div className="flex flex-1 overflow-hidden bg-white">

          {/* Case 1: Active tab is a Search Tab */}
          {isSearchTab && currentPatent && (
            // Search UI takes the full space when active
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
               <h2 className="text-xl font-semibold text-gray-700 mb-4">Search Patent</h2>
               <form onSubmit={handleSearchSubmit} className="w-full max-w-md space-y-4">
                  {/* Search Input */}
                  <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                    <MdSearch className="text-gray-400 mr-2" size={18} />
                    <input type="text" placeholder="Enter publication number (e.g. EP1626661B1)" className="flex-1 text-sm outline-none bg-transparent" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} disabled={isSearching} autoFocus />
                  </div>
                  {/* Search Error */}
                  {searchError && <p className="text-sm text-red-600 text-center">{searchError}</p>}
                  {/* Search Button */}
                  <button type="submit" disabled={isSearching || !searchQuery.trim()} className="w-full flex justify-center items-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {isSearching ? 'Searching…' : 'Search'}
                  </button>
              </form>
              <p className="text-xs text-gray-500 mt-4">Example: <code className="bg-gray-200 px-1 rounded">EP1626661B1</code></p>
            </div>
          )}

          {/* Case 2: Active tab is a regular Patent Tab */}
          {!isSearchTab && currentPatent && (
            <> {/* Use a fragment to return multiple adjacent elements */}
              {/* Pane 1: Description Pane */}
              {/* Render Description Pane directly using currentPatent data */}
              <DescriptionPane
                key={currentPatent.id} // Key helps React differentiate between tabs
                tabId={currentPatent.id}
                paragraphs={currentPatent.paragraphs || []}
                commentsVisible={showCommentsPane} // Affects DescriptionPane's width
                isActive={true} // It's the active one if we're in this block
                showCommentsPaneForThisEditor={showCommentsPane} // Signal to LexicalEditorCore
              />

              {/* Pane 2: Comments Sidebar Portal Target */}
              {/* This div holds the space and gets content via Portal */}
              {/* Render this placeholder ONLY if comments should be visible */}
              {showCommentsPane && (
                <div
                  id="comment-sidebar-portal-target"
                  className="w-80 h-full border-l border-r border-gray-200 bg-slate-100 shrink-0 overflow-y-auto" // Added right border
                  aria-label="Comments sidebar"
                >
                  {/* Content injected by portal */}
                </div>
              )}

              {/* Pane 3: Claims Pane */}
              <ClaimsPane
                  patent={currentPatent}
                  commentsVisible={showCommentsPane} // Affects ClaimsPane's width
                  toggleComments={toggleCommentsPane}
              />
            </>
          )}

          {/* Case 3: No active/valid tab (and not a search tab) */}
          {!currentPatent && !isSearchTab && (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-10 text-center">
               {tabs.length === 0 ? (
                 <>
                   <p className="text-lg mb-4">No tabs open.</p>
                   <button
                     onClick={onAddRequest}
                     className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                   >
                     <MdAdd size={18} /> Add New Tab
                   </button>
                 </>
               ) : (
                 <p className="text-lg">Select a tab to view its content.</p>
               )}
             </div>
          )}

        </div>
        {/* End PANES AREA */}
      </Tab.Group>
    );
  }

  // PropTypes for TabGroupWrapper (no changes needed)
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
    scrollContainerRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
    ]),
    onCompleteSearchRequest: PropTypes.func.isRequired,
  };
  TabGroupWrapper.defaultProps = { currentPatent: null };

  // TabWorkspace Component (export default function TabWorkspace...)
  // No changes needed here from the previous version provided in the prompt
  export default function TabWorkspace({ isDragging }) {
    const {
      openTabs = [],
      activeTabIndex = 0,
      setActiveTab,
      addTab,
      closeTab,
      completeSearch,
      makeNewSearchTab = (idPrefix = 'new') => ({
        id: `${idPrefix}-${reactIdPart}-${Date.now()}`,
        name: 'New Search',
        description: '<p>Enter search criteria…</p>',
        claims: '<p>N/A</p>',
        images: '',
        paragraphs: [],
        patentNr: null,
        isSearchTab: true,
        isSearchCompleted: false,
        nameChangedByUser: false,
      }),
    } = usePatentWorkspace() || {};

    const [renameInfo, setRenameInfo] = useState({
      open: false,
      id: null,
      name: '',
    });
    const [commentsVisible, setCommentsVisible] = useState(() => {
      try {
        const v = localStorage.getItem(COMMENTS_VISIBLE_STORAGE_KEY);
        const defaultVisibility = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true;
        return v !== null ? JSON.parse(v) : defaultVisibility;
      } catch {
        return true;
      }
    });

    const isLargeScreen = useMediaQuery('(min-width: 1024px)');
    const toggleComments = useCallback(() => {
      if (!isLargeScreen) return;
      setCommentsVisible((v) => !v);
    }, [isLargeScreen]);

    const reactIdPart = useId();
    const scrollRef = useRef(null);

    // Effect to scroll active tab into view
    useEffect(() => {
      const el = scrollRef.current;
      const selectedTabButton = el?.querySelector('button[role="tab"][data-headlessui-state="selected"]');
      if (selectedTabButton) {
        selectedTabButton.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    }, [activeTabIndex, openTabs]);

    // Effect to manage comments visibility based on screen size and persist
    useEffect(() => {
      let visibility = commentsVisible;
      if (!isLargeScreen && commentsVisible) {
        visibility = false;
        setCommentsVisible(false);
      }
      try {
        localStorage.setItem(
          COMMENTS_VISIBLE_STORAGE_KEY,
          JSON.stringify(visibility),
        );
      } catch {/* ignore localStorage errors */}
    }, [isLargeScreen, commentsVisible]);

    // Effect for keyboard shortcuts
    useEffect(() => {
      const handler = (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
          e.preventDefault();
          if (isLargeScreen) toggleComments();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'W' || e.key === 'w')) {
          e.preventDefault();
          const idToClose = openTabs[activeTabIndex]?.id;
          if (idToClose) closeTab(idToClose);
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'T' || e.key === 't')) {
          e.preventDefault();
          addTab(makeNewSearchTab(`new-${reactIdPart}`));
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [
      openTabs, activeTabIndex, closeTab, addTab, makeNewSearchTab,
      reactIdPart, isLargeScreen, toggleComments,
    ]);

    const activePatent = openTabs[activeTabIndex] ?? null;
    const tabOrderKey = useMemo(
      () => openTabs.map((t) => t.id).join('-'),
      [openTabs],
    );

    const handleAddRequest = useCallback(() => {
        addTab(makeNewSearchTab(`new-${reactIdPart}`));
    }, [addTab, makeNewSearchTab, reactIdPart]);

    // Determine if the comments pane area should be *potentially* visible
    const shouldShowCommentsArea = commentsVisible && isLargeScreen;

    return (
      <>
        <TabGroupWrapper
          tabs={openTabs}
          currentIndex={activeTabIndex}
          onTabChange={setActiveTab}
          onRenameRequest={(id, name) =>
            setRenameInfo({ open: true, id, name })
          }
          onCloseRequest={closeTab}
          onAddRequest={handleAddRequest}
          // Pass the calculated boolean for showing the comments area
          showCommentsPane={shouldShowCommentsArea}
          currentPatent={activePatent}
          toggleCommentsPane={toggleComments}
          isDragging={isDragging}
          tabGroupKey={tabOrderKey}
          scrollContainerRef={scrollRef}
          onCompleteSearchRequest={completeSearch}
        />

        {renameInfo.open && (
          <RenameTabModal
            tabId={renameInfo.id}
            initialName={renameInfo.name}
            open={renameInfo.open}
            onClose={() =>
              setRenameInfo({ open: false, id: null, name: '' })
            }
          />
        )}
      </>
    );
  }

  TabWorkspace.propTypes = { isDragging: PropTypes.bool.isRequired };