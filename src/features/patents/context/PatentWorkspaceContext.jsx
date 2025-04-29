// src/features/patents/context/PatentWorkspaceContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

/* ---------- starter data (NO dummy text) ------------------- */
const initialState = {
  sidebarCollapsed: JSON.parse(localStorage.getItem('pw_sidebar') ?? 'false'),

  folders: [
    {
      id: 'f1',
      name: 'Starter Folder',
      patents: [{ id: 'p1', name: 'EP123456B1' }],
    },
  ],

  openTabs: [
    { id: 'p1', name: 'EP123456B1', description: '', claims: '', images: '' },
    { id: 'p2', name: 'EP123456B2', description: '', claims: '', images: '' },
    { id: 'p3', name: 'EP123456B3', description: '', claims: '', images: '' },
  ],

  activeTabIndex: 0,
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
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabIndex: action.index };

    /* Tabs */
    case 'ADD_TAB':
      return { ...state, openTabs: [...state.openTabs, action.tab] };

    case 'REORDER_TABS': {
      const { from, to } = action;
      const newTabs = [...state.openTabs];
      const [moved] = newTabs.splice(from, 1);
      newTabs.splice(to, 0, moved);

      const currentActiveId = state.openTabs[state.activeTabIndex]?.id;
      const newActiveIndex = newTabs.findIndex((t) => t.id === currentActiveId);

      return {
        ...state,
        openTabs: newTabs,
        activeTabIndex:
          newActiveIndex === -1 ? state.activeTabIndex : newActiveIndex,
      };
    }

    case 'RENAME_TAB': {
      const openTabs = state.openTabs.map((t) =>
        t.id === action.id ? { ...t, name: action.newName } : t,
      );
      /* keep folder entries in sync */
      const folders = state.folders.map((f) => ({
        ...f,
        patents: f.patents.map((p) =>
          p.id === action.id ? { ...p, name: action.newName } : p,
        ),
      }));
      return { ...state, openTabs, folders };
    }

    /* Folders */
    case 'ADD_FOLDER':
      return {
        ...state,
        folders: [...state.folders, { id: action.id, name: action.name, patents: [] }],
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

    /* patent ↔ folder */
    case 'ADD_PATENT_TO_FOLDER': {
      const { folderId, patent } = action;
      const folders = state.folders.map((f) =>
        f.id === folderId
          ? f.patents.some((p) => p.id === patent.id)
            ? f
            : { ...f, patents: [...f.patents, patent] }
          : f,
      );
      return { ...state, folders };
    }

    case 'REMOVE_PATENT_FROM_FOLDER': {
      const { folderId, patentId } = action;
      const folders = state.folders.map((f) =>
        f.id === folderId
          ? { ...f, patents: f.patents.filter((p) => p.id !== patentId) }
          : f,
      );
      return { ...state, folders };
    }

    default:
      return state;
  }
}

/* ---------- provider -------------------------------------- */
export function PatentWorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = {
    ...state,

    /* UI */
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),

    /* tabs */
    setActiveTab : (i)      => dispatch({ type: 'SET_ACTIVE_TAB', index: i }),
    addTab       : (tab)    => dispatch({ type: 'ADD_TAB', tab }),
    reorderTabs  : (f, t)   => dispatch({ type: 'REORDER_TABS', from: f, to: t }),
    renameTab    : (id, n)  => dispatch({ type: 'RENAME_TAB', id, newName: n }),

    /* folders */
    addFolder    : (id, n)  => dispatch({ type: 'ADD_FOLDER', id, name: n }),
    renameFolder : (id, n)  => dispatch({ type: 'RENAME_FOLDER', id, newName: n }),
    deleteFolder : (id)     => dispatch({ type: 'DELETE_FOLDER', id }),

    /* patent ↔ folder */
    addPatentToFolder    : (folderId, patent) =>
      dispatch({ type: 'ADD_PATENT_TO_FOLDER', folderId, patent }),
    removePatentFromFolder: (folderId, patentId) =>
      dispatch({ type: 'REMOVE_PATENT_FROM_FOLDER', folderId, patentId }),
  };

  /* keep activeTabIndex valid */
  useEffect(() => {
    if (state.activeTabIndex > state.openTabs.length - 1) {
      dispatch({ type: 'SET_ACTIVE_TAB', index: 0 });
    }
  }, [state.activeTabIndex, state.openTabs.length]);

  return (
    <PatentWorkspaceContext.Provider value={value}>
      {children}
    </PatentWorkspaceContext.Provider>
  );
}

PatentWorkspaceProvider.propTypes = { children: PropTypes.node };

export const usePatentWorkspace = () => useContext(PatentWorkspaceContext);
