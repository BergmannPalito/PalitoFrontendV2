// src/features/patents/context/PatentWorkspaceContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';

const MAX_RECENT_TABS = 5;

/* ---------- starter data ------------------- */
const initialState = {
  sidebarCollapsed: JSON.parse(localStorage.getItem('pw_sidebar') ?? 'false'),
  folders: [
    { id: 'f1', name: 'Starter Folder', patents: [{ id: 'p1', name: 'EP123456B1' }] },
    { id: 'f2', name: 'Another Folder', patents: [] },
  ],
  openTabs: [
    { id: 'p1', name: 'EP123456B1', description: 'Desc P1', claims: 'Claims P1', images: '' },
    { id: 'p2', name: 'EP123456B2', description: 'Desc P2', claims: 'Claims P2', images: '' },
    { id: 'p3', name: 'EP123456B3', description: 'Desc P3', claims: 'Claims P3', images: '' },
    { id: 'p4', name: 'US987654A1', description: 'Desc P4', claims: 'Claims P4', images: '' }
  ],
  activeTabIndex: 0,
  recentTabs: [],
};
/* ----------------------------------------------------------- */

const PatentWorkspaceContext = createContext();

/* ---------- reducer --------------------------------------- */
function reducer(state, action) {
  switch (action.type) {
    /* UI */
    case 'TOGGLE_SIDEBAR': {
      const collapsed = !state.sidebarCollapsed;
      localStorage.setItem('pw_sidebar', JSON.stringify(collapsed));
      return { ...state, sidebarCollapsed: collapsed };
    }

    /* Recent Tabs */
    case 'UPDATE_RECENTS': {
        const { id: recentId, name: recentName } = action.payload;
        if (!recentId || !recentName) return state;
        const filteredRecents = state.recentTabs.filter(tab => tab.id !== recentId);
        const newRecents = [{ id: recentId, name: recentName }, ...filteredRecents];
        const limitedRecents = newRecents.slice(0, MAX_RECENT_TABS);
        if (JSON.stringify(limitedRecents) !== JSON.stringify(state.recentTabs)) {
            return { ...state, recentTabs: limitedRecents };
        }
        return state;
    }

    case 'SET_ACTIVE_TAB': {
       if (state.openTabs.length === 0) return { ...state, activeTabIndex: 0 };
       const newIndex = Math.max(0, Math.min(action.index, state.openTabs.length - 1));
       if (newIndex === state.activeTabIndex) return state;
      return { ...state, activeTabIndex: newIndex };
    }

    /* Tabs */
    case 'ADD_TAB': {
      const existingIndex = state.openTabs.findIndex(tab => tab.id === action.tab.id);
      if (existingIndex !== -1) {
           if(state.activeTabIndex === existingIndex) return state;
           return { ...state, activeTabIndex: existingIndex };
      }
      const newTabs = [...state.openTabs, action.tab];
      return { ...state, openTabs: newTabs, activeTabIndex: newTabs.length - 1 };
    }

    case 'REORDER_TABS': {
        // This version calculates and returns the updated index
        const { from, to } = action;
        if ( from < 0 || from >= state.openTabs.length || to < 0 || to >= state.openTabs.length || from === to ) {
            return state;
        }
        const currentActiveId = state.openTabs[state.activeTabIndex]?.id;
        const newTabs = [...state.openTabs];
        const [moved] = newTabs.splice(from, 1);
        newTabs.splice(to, 0, moved);
        let newActiveIndex = 0;
        if (currentActiveId && newTabs.length > 0) {
            const foundIndex = newTabs.findIndex((t) => t.id === currentActiveId);
            newActiveIndex = foundIndex !== -1 ? foundIndex : 0;
        }
        newActiveIndex = Math.max(0, Math.min(newActiveIndex, newTabs.length > 0 ? newTabs.length - 1 : 0));
        return { ...state, openTabs: newTabs, activeTabIndex: newActiveIndex };
    }

    case 'RENAME_TAB': {
        const newName = action.newName?.trim();
        if (!newName) return state;
        let changed = false;
        const openTabs = state.openTabs.map(t => { if(t.id===action.id && t.name!==newName){changed=true; return {...t, name:newName};} return t; });
        const folders = state.folders.map(f => { let pChanged=false; const p=f.patents.map(p => { if(p.id===action.id && p.name!==newName){pChanged=true; return {...p, name:newName};} return p; }); return pChanged ? {...f, patents:p} : f; });
        const recentTabs = state.recentTabs.map(t => { if(t.id===action.id && t.name!==newName){changed=true; return {...t, name:newName};} return t; });
        return changed ? { ...state, openTabs, folders, recentTabs } : state;
    }

    case 'CLOSE_TAB': {
        const tabIdToClose = action.id;
        const tabIndexToClose = state.openTabs.findIndex(t => t.id === tabIdToClose);
        if (tabIndexToClose === -1) return state;
        const newTabs = state.openTabs.filter(t => t.id !== tabIdToClose);
        let newActiveIndex = state.activeTabIndex;
        const numTabs = newTabs.length;
        if (numTabs === 0) newActiveIndex = 0;
        else if (state.activeTabIndex === tabIndexToClose) newActiveIndex = Math.min(tabIndexToClose, numTabs - 1);
        else if (state.activeTabIndex > tabIndexToClose) newActiveIndex = state.activeTabIndex - 1;
        newActiveIndex = Math.max(0, Math.min(newActiveIndex, numTabs > 0 ? numTabs - 1 : 0));
        const recentTabs = state.recentTabs.filter(tab => tab.id !== tabIdToClose);
        const stateChanged = newTabs.length !== state.openTabs.length || newActiveIndex !== state.activeTabIndex || recentTabs.length !== state.recentTabs.length;
        return stateChanged ? { ...state, openTabs: newTabs, activeTabIndex: newActiveIndex, recentTabs } : state;
    }

    /* Folders */
    case 'ADD_FOLDER': {
       const folderName = action.name?.trim();
       if (!folderName || state.folders.some(f => f.id === action.id)) return state;
       return { ...state, folders: [...state.folders, { id: action.id, name: folderName, patents: [] }] };
    }
    case 'RENAME_FOLDER': {
        const newFolderName = action.newName?.trim();
        if (!newFolderName) return state;
        let changed = false;
        const updatedFolders = state.folders.map(f => { if(f.id===action.id && f.name !== newFolderName){changed=true; return {...f, name: newFolderName};} return f; });
        return changed ? { ...state, folders: updatedFolders } : state;
    }
    case 'DELETE_FOLDER': {
      if (!state.folders.some(f => f.id === action.id)) return state;
      const updatedFolders = state.folders.filter(f => f.id !== action.id);
      return updatedFolders.length !== state.folders.length ? { ...state, folders: updatedFolders } : state;
    }
    case 'ADD_PATENT_TO_FOLDER': {
      const { folderId, patent } = action;
       if (!patent || !patent.id || !patent.name) return state;
       let updated = false;
       const updatedFolders = state.folders.map(f => { if (f.id === folderId && !f.patents.some(p => p.id === patent.id)){ updated=true; return { ...f, patents: [...f.patents, { id: patent.id, name: patent.name }] }; } return f; });
       return updated ? { ...state, folders: updatedFolders } : state;
    }
    case 'REMOVE_PATENT_FROM_FOLDER': {
      const { folderId: rFolderId, patentId: rPatentId } = action;
      let changed = false;
      const updatedFolders = state.folders.map(f => { if (f.id === rFolderId){ const pLen=f.patents.length; const pNew=f.patents.filter(p => p.id !== rPatentId); if(pNew.length !== pLen){ changed=true; return { ...f, patents: pNew }; } } return f; });
      return changed ? { ...state, folders: updatedFolders } : state;
    }

    default:
      return state;
  }
}

/* ---------- provider -------------------------------------- */
export function PatentWorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Effect to update recents
  useEffect(() => {
       if (state.activeTabIndex >= 0 && state.activeTabIndex < state.openTabs.length) {
          const activeTab = state.openTabs[state.activeTabIndex];
          if (activeTab?.id && (state.recentTabs.length === 0 || state.recentTabs[0].id !== activeTab.id)) {
             dispatch({ type: 'UPDATE_RECENTS', payload: { id: activeTab.id, name: activeTab.name } });
          }
      }
  }, [state.activeTabIndex, state.openTabs]);


  // Memoized dispatchers
  const value = {
    ...state,
    toggleSidebar: useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR' }), []),
    setActiveTab : useCallback((i) => dispatch({ type: 'SET_ACTIVE_TAB', index: i }), []),
    addTab       : useCallback((tab) => dispatch({ type: 'ADD_TAB', tab }), []),
    reorderTabs  : useCallback((f, t) => dispatch({ type: 'REORDER_TABS', from: f, to: t }), []),
    renameTab    : useCallback((id, n) => dispatch({ type: 'RENAME_TAB', id, newName: n }), []),
    closeTab     : useCallback((id) => dispatch({ type: 'CLOSE_TAB', id }), []),
    addFolder    : useCallback((id, n) => dispatch({ type: 'ADD_FOLDER', id, name: n }), []),
    renameFolder : useCallback((id, n) => dispatch({ type: 'RENAME_FOLDER', id, newName: n }), []),
    deleteFolder : useCallback((id) => dispatch({ type: 'DELETE_FOLDER', id }), []),
    addPatentToFolder    : useCallback((folderId, patent) => dispatch({ type: 'ADD_PATENT_TO_FOLDER', folderId, patent }), []),
    removePatentFromFolder: useCallback((folderId, patentId) => dispatch({ type: 'REMOVE_PATENT_FROM_FOLDER', folderId, patentId }), []),
  };

  return (
    <PatentWorkspaceContext.Provider value={value}>
      {children}
    </PatentWorkspaceContext.Provider>
  );
}

PatentWorkspaceProvider.propTypes = { children: PropTypes.node };

export const usePatentWorkspace = () => {
    const context = useContext(PatentWorkspaceContext);
    if (context === undefined) {
        throw new Error('usePatentWorkspace must be used within a PatentWorkspaceProvider');
    }
    return context;
};