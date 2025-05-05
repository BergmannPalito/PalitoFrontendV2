/* ───────────────────────────────────────────────────────────────
   src/features/patents/context/PatentWorkspaceContext.jsx
   ─────────────────────────────────────────────────────────────── */

   import {
    createContext,
    useContext,
    useReducer,
    useCallback,
  } from 'react';
  import PropTypes from 'prop-types';
  import { nanoid } from 'nanoid';
  import { useHighlightContext } from './HighlightContext';
  
  /* ── helper to spawn a search‑wizard tab ──────────────────────── */
  export const makeNewSearchTab = () => ({
    id: `search-${nanoid(6)}`,          //   ← stays unique for React
    name: 'New Search',
    description: '<p>Enter search criteria…</p>',
    claims: '<p>N/A</p>',
    images: '',
    paragraphs: [],
    patentNr: null,
    isSearchTab: true,
    isSearchCompleted: false,
    nameChangedByUser: false,
  });
  
  /* ── initial state ────────────────────────────────────────────── */
  const initialState = {
    sidebarCollapsed: false,
    folders: [],
    openTabs: [],      // array<tab>
    activeTabIndex: 0, // index into openTabs
  };
  
  /* ── reducer ──────────────────────────────────────────────────── */
  function reducer(state, action) {
    switch (action.type) {
      /* –– UI –– */
      case 'TOGGLE_SIDEBAR':
        return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
  
      case 'SET_ACTIVE_TAB':
        return { ...state, activeTabIndex: action.index };
  
      /* –– tabs –– */
      case 'ADD_TAB':
        return {
          ...state,
          openTabs: [...state.openTabs, action.tab],
          activeTabIndex: state.openTabs.length,
        };
  
      case 'CLOSE_TAB': {
        const idx = state.openTabs.findIndex((t) => t.id === action.id);
        if (idx === -1) return state;
        const openTabs = state.openTabs.filter((t) => t.id !== action.id);
        const newActive =
          openTabs.length === 0
            ? 0
            : idx >= openTabs.length
            ? openTabs.length - 1
            : idx;
        return { ...state, openTabs, activeTabIndex: newActive };
      }
  
      /* –– search finished –– */
      case 'COMPLETE_SEARCH': {
        const { searchTabId, patentData } = action.payload;
  
        const openTabs = state.openTabs.map((tab) =>
          tab.id === searchTabId
            ? {
                /* keep the ORIGINAL id so every tab key stays unique */
                ...tab,
  
                /* merge in the server data – but NEVER overwrite id */
                ...patentData,
                id: tab.id,
  
                name: patentData.patentNr,
                patentNr: patentData.patentNr,
                isSearchTab: false,
                isSearchCompleted: true,
              }
            : tab,
        );
  
        const newActive = openTabs.findIndex((t) => t.id === searchTabId);
        return { ...state, openTabs, activeTabIndex: newActive };
      }
  
      /* –– folders (unchanged) –– */
      case 'ADD_FOLDER':
        return {
          ...state,
          folders: [
            ...state.folders,
            { id: action.id, name: action.name, patents: [] },
          ],
        };
  
      case 'RENAME_FOLDER':
        return {
          ...state,
          folders: state.folders.map((f) =>
            f.id === action.id ? { ...f, name: action.newName } : f,
          ),
        };
  
      case 'DELETE_FOLDER':
        return { ...state, folders: state.folders.filter((f) => f.id !== action.id) };
  
      case 'ADD_PATENT_TO_FOLDER':
        return {
          ...state,
          folders: state.folders.map((f) =>
            f.id === action.folderId
              ? {
                  ...f,
                  patents: f.patents.some((p) => p.id === action.patent.id)
                    ? f.patents
                    : [...f.patents, action.patent],
                }
              : f,
          ),
        };
  
      case 'REMOVE_PATENT_FROM_FOLDER':
        return {
          ...state,
          folders: state.folders.map((f) =>
            f.id === action.folderId
              ? { ...f, patents: f.patents.filter((p) => p.id !== action.patentId) }
              : f,
          ),
        };
  
      default:
        return state;
    }
  }
  
  /* ── context + provider ───────────────────────────────────────── */
  const PWContext = createContext(null);
  
  export const PatentWorkspaceProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { removeTabHighlights } = useHighlightContext();
  
    /* public actions */
    const toggleSidebar = useCallback(
      () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
      [],
    );
  
    const setActiveTab = useCallback(
      (index) => dispatch({ type: 'SET_ACTIVE_TAB', index }),
      [],
    );
  
    const addTab = useCallback(
      (tab) => dispatch({ type: 'ADD_TAB', tab }),
      [],
    );
  
    const closeTab = useCallback(
      (id) => {
        dispatch({ type: 'CLOSE_TAB', id });
        removeTabHighlights(id); // optional – depends on your HighlightContext
      },
      [removeTabHighlights],
    );
  
    const completeSearch = useCallback(
      (searchTabId, patentData) =>
        dispatch({
          type: 'COMPLETE_SEARCH',
          payload: { searchTabId, patentData },
        }),
      [],
    );
  
    /* value exposed to the rest of the app */
    const value = {
      ...state,
      toggleSidebar,
      setActiveTab,
      addTab,
      closeTab,
      completeSearch,
      makeNewSearchTab, // called by TabWorkspace when the user hits "Ctrl‑T"
    };
  
    return <PWContext.Provider value={value}>{children}</PWContext.Provider>;
  };
  
  PatentWorkspaceProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  
  /* hook */
  export const usePatentWorkspace = () => {
    const ctx = useContext(PWContext);
    if (!ctx) {
      throw new Error(
        'usePatentWorkspace must be used inside <PatentWorkspaceProvider>',
      );
    }
    return ctx;
  };
  