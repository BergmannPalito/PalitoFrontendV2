// src/features/patents/context/HighlightContext.jsx
import React, {
  createContext,
  useReducer,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import PropTypes from 'prop-types';

/* ──────────────────────────────────────────────────────────── */
/*                       ACTION TYPES                           */
/* ──────────────────────────────────────────────────────────── */
const ActionTypes = {
  ADD_HIGHLIGHT: 'ADD_HIGHLIGHT',
  REMOVE_HIGHLIGHTS_BY_IDS: 'REMOVE_HIGHLIGHTS_BY_IDS',
  CLEAR_ALL_FOR_TAB: 'CLEAR_ALL_FOR_TAB',
  REMOVE_TAB: 'REMOVE_TAB',
  HYDRATE: 'HYDRATE',
};

/* ──────────────────────────────────────────────────────────── */
/*                     PERSISTENCE HELPERS                      */
/* ──────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'palito_highlights_v1';

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / serialise errors */
  }
}

/* ──────────────────────────────────────────────────────────── */
/*                       REDUCER LOGIC                          */
/* ──────────────────────────────────────────────────────────── */
function highlightReducer(state, action) {
  switch (action.type) {
    case ActionTypes.HYDRATE:
      return action.payload || {};

    case ActionTypes.ADD_HIGHLIGHT: {
      const { tabId, range } = action.payload;
      if (!tabId || !range) return state;
      const current = state[tabId] || [];
      if (current.some((r) => r.id === range.id)) return state; // duplicate
      return { ...state, [tabId]: [...current, range] };
    }

    case ActionTypes.REMOVE_HIGHLIGHTS_BY_IDS: {
      const { tabId, idsToRemove } = action.payload;
      if (!tabId || !idsToRemove?.length || !state[tabId]) return state;
      const remaining = state[tabId].filter(
        (r) => !idsToRemove.includes(r.id),
      );
      const next = { ...state };
      if (remaining.length) next[tabId] = remaining;
      else delete next[tabId];
      return next;
    }

    case ActionTypes.CLEAR_ALL_FOR_TAB: {
      const { tabId } = action.payload;
      if (!tabId || !state[tabId]) return state;
      const next = { ...state };
      delete next[tabId];
      return next;
    }

    case ActionTypes.REMOVE_TAB: {
      const { tabId } = action.payload;
      if (!tabId || !state[tabId]) return state;
      const next = { ...state };
      delete next[tabId];
      return next;
    }

    default:
      return state;
  }
}

/* ──────────────────────────────────────────────────────────── */
/*                     CONTEXT + PROVIDER                       */
/* ──────────────────────────────────────────────────────────── */
const HighlightContext = createContext(null);

export function HighlightProvider({ children }) {
  const [state, dispatch] = useReducer(highlightReducer, {});

  /* hydrate once on mount */
  useEffect(() => {
    dispatch({ type: ActionTypes.HYDRATE, payload: loadFromStorage() });
  }, []);

  /* persist on every state change */
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  /* action helpers */
  const addHighlight = useCallback(
    (tabId, range) =>
      dispatch({ type: ActionTypes.ADD_HIGHLIGHT, payload: { tabId, range } }),
    [],
  );

  const removeHighlightsByIds = useCallback(
    (tabId, idsToRemove) =>
      dispatch({
        type: ActionTypes.REMOVE_HIGHLIGHTS_BY_IDS,
        payload: { tabId, idsToRemove },
      }),
    [],
  );

  const clearHighlightsForTab = useCallback(
    (tabId) =>
      dispatch({
        type: ActionTypes.CLEAR_ALL_FOR_TAB,
        payload: { tabId },
      }),
    [],
  );

  const removeTabHighlights = useCallback(
    (tabId) =>
      dispatch({ type: ActionTypes.REMOVE_TAB, payload: { tabId } }),
    [],
  );

  /* expose API */
  const value = {
    highlightsByTab: state,
    addHighlight,
    removeHighlightsByIds,
    clearHighlightsForTab,
    removeTabHighlights,
  };

  return (
    <HighlightContext.Provider value={value}>
      {children}
    </HighlightContext.Provider>
  );
}

HighlightProvider.propTypes = { children: PropTypes.node.isRequired };

export const useHighlightContext = () => {
  const ctx = useContext(HighlightContext);
  if (ctx === null) {
    throw new Error('useHighlightContext must be used within a HighlightProvider');
  }
  return ctx;
};
