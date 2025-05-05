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
  import CommentsPane from '../Layout/CommentsPane';
  import ClaimsPane from '../Layout/ClaimsPane';
  
  import { useMediaQuery } from '@/hooks/useMediaQuery';
  import { mockSearch } from '@/features/patents/services/mockSearch';
  
  const COMMENTS_VISIBLE_STORAGE_KEY = 'palito_commentsVisible';
  
  /* ═══════════════════════════════════════════════════════════ */
  /*                       TAB‑GROUP WRAPPER                     */
  /* ═══════════════════════════════════════════════════════════ */
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
    scrollContainerRef,
    onCompleteSearchRequest,
  }) {
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
  
    /* ── detect overflow in tab list ───────────────────────── */
    useEffect(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() =>
        setIsOverflowing(el.scrollWidth > el.clientWidth + 1),
      );
      ro.observe(el);
      return () => ro.disconnect();
    }, [tabs.length, scrollContainerRef]);
  
    /* ── reset search UI on tab switch ─────────────────────── */
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
  
    /* ── handle patent search submission ───────────────────── */
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
  
    /* ═══════════════════════════════════════════════════════════ */
    /*                              UI                              */
    /* ═══════════════════════════════════════════════════════════ */
    return (
      <Tab.Group
        key={tabGroupKey}
        selectedIndex={selectedIndex}
        onChange={isDragging ? () => {} : onTabChange}
        as="div"
        className="flex h-full w-full flex-col overflow-hidden bg-gray-50"
      >
        {/* ───────── TAB BAR ───────── */}
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
  
        {/* ───────── PANES ───────── */}
        <div className="flex flex-1 overflow-hidden bg-white">
          {/* 1️⃣ SEARCH TAB UI */}
          {isSearchTab && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Search Patent
              </h2>
              <form
                onSubmit={handleSearchSubmit}
                className="w-full max-w-md space-y-4"
              >
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm bg-white px-3 py-2 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                  <MdSearch className="text-gray-400 mr-2" size={18} />
                  <input
                    type="text"
                    placeholder="Enter publication number (e.g. EP1626661B1)"
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
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full flex justify-center items-center rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSearching ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Searching…
                    </>
                  ) : (
                    'Search'
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4">
                Example:{' '}
                <code className="bg-gray-200 px-1 rounded">EP1626661B1</code>
              </p>
            </div>
          )}
  
          {/* 2️⃣ ALL COMPLETED EDITORS (kept mounted) */}
          {tabs
            .filter((t) => t.isSearchCompleted)
            .map((t) => {
              const active = t.id === currentPatent?.id && !isSearchTab;
  
              return (
                <div key={t.id} className={active ? 'contents' : 'hidden'}>
                  <DescriptionPane
                    tabId={t.id}
                    paragraphs={t.paragraphs || []}
                    commentsVisible={active && showCommentsPane}
                    isActive={active} /* ← tells overlay to recalc immediately */
                  />
                </div>
              );
            })}
  
          {/* 3️⃣ SIDE PANES */}
          {currentPatent && !isSearchTab && (
            <>
              {showCommentsPane && <CommentsPane />}
              <ClaimsPane
                patent={currentPatent}
                commentsVisible={showCommentsPane}
                toggleComments={toggleCommentsPane}
              />
            </>
          )}
  
          {/* 4️⃣ PLACEHOLDER */}
          {!currentPatent && (
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
                <p>Select a tab to view its content.</p>
              )}
            </div>
          )}
        </div>
      </Tab.Group>
    );
  }
  
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
  
  /* ═══════════════════════════════════════════════════════════ */
  /*                        MAIN COMPONENT                       */
  /* ═══════════════════════════════════════════════════════════ */
  export default function TabWorkspace({ isDragging }) {
    const {
      openTabs = [],
      activeTabIndex = 0,
      setActiveTab,
      addTab,
      closeTab,
      completeSearch,
      makeNewSearchTab = (id) => ({
        id,
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
  
    /* ── local UI state ───────────────────────────────────── */
    const [renameInfo, setRenameInfo] = useState({
      open: false,
      id: null,
      name: '',
    });
    const [commentsVisible, setCommentsVisible] = useState(() => {
      try {
        const v = localStorage.getItem(COMMENTS_VISIBLE_STORAGE_KEY);
        return v !== null ? JSON.parse(v) : true;
      } catch {
        return true;
      }
    });
  
    /* ── helpers ─────────────────────────────────────────── */
    const isLargeScreen = useMediaQuery('(min-width: 1024px)');
    const toggleComments = useCallback(() => {
      if (!isLargeScreen) return;
      setCommentsVisible((v) => !v);
    }, [isLargeScreen]);
  
    const reactId = useId();
    const scrollRef = useRef(null);
  
    /* keep selected tab button in view */
    useEffect(() => {
      const el = scrollRef.current;
      el
        ?.querySelector('button[role="tab"][data-headlessui-state="selected"]')
        ?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [activeTabIndex]);
  
    /* collapse comments on <lg */
    useEffect(() => {
      if (!isLargeScreen && commentsVisible) setCommentsVisible(false);
    }, [isLargeScreen, commentsVisible]);
  
    /* persist comments visibility */
    useEffect(() => {
      try {
        localStorage.setItem(
          COMMENTS_VISIBLE_STORAGE_KEY,
          JSON.stringify(commentsVisible),
        );
      } catch {
        /* ignore */
      }
    }, [commentsVisible]);
  
    /* keyboard shortcuts */
    useEffect(() => {
      const handler = (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
          e.preventDefault();
          if (isLargeScreen) toggleComments();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
          e.preventDefault();
          const id = openTabs[activeTabIndex]?.id;
          if (id) closeTab(id);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
          e.preventDefault();
          addTab(makeNewSearchTab(`new-${reactId}-${Date.now()}`));
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [
      openTabs,
      activeTabIndex,
      closeTab,
      addTab,
      makeNewSearchTab,
      reactId,
      isLargeScreen,
      toggleComments,
    ]);
  
    /* derived info */
    const activePatent = openTabs[activeTabIndex] ?? null;
    const tabOrderKey = useMemo(
      () => openTabs.map((t) => t.id).join('-'),
      [openTabs],
    );
  
    /* render */
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
          onAddRequest={() =>
            addTab(makeNewSearchTab(`new-${reactId}-${Date.now()}`))
          }
          showCommentsPane={commentsVisible && isLargeScreen}
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