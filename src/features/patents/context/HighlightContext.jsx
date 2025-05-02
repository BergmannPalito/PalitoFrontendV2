// src/features/patents/context/HighlightContext.jsx
import React, { createContext, useReducer, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
// NOTE: Removing dependency on highlightUtils from context
// import { rangesIntersect, serializeRange } from '../utils/highlightUtils'; // REMOVE

// Context Definition
const HighlightContext = createContext(null);

// State Structure: { tabId1: [range1, range2], tabId2: [range3] }
const initialState = {};

// Action Types
const ActionTypes = {
    ADD_HIGHLIGHT: 'ADD_HIGHLIGHT',
    // REMOVE_INTERSECTING: 'REMOVE_INTERSECTING', // REMOVE OLD
    REMOVE_HIGHLIGHTS_BY_IDS: 'REMOVE_HIGHLIGHTS_BY_IDS', // ADD NEW
    SET_HIGHLIGHTS: 'SET_HIGHLIGHTS',
    CLEAR_ALL_FOR_TAB: 'CLEAR_ALL_FOR_TAB',
    REMOVE_TAB: 'REMOVE_TAB',
};

// Reducer Function
function highlightReducer(state, action) {
    switch (action.type) {
        case ActionTypes.ADD_HIGHLIGHT: {
            const { tabId, range } = action.payload;
            if (!tabId || !range) return state;
            const currentRanges = state[tabId] || [];
            // Prevent adding duplicates (optional, based on ID)
            if (currentRanges.some(r => r.id === range.id)) {
                return state;
            }
            const newRanges = [...currentRanges, range];
            return { ...state, [tabId]: newRanges };
        }
        // REMOVE OLD REMOVE_INTERSECTING CASE
        // case ActionTypes.REMOVE_INTERSECTING: { ... }

        // ADD NEW REMOVE_HIGHLIGHTS_BY_IDS CASE
        case ActionTypes.REMOVE_HIGHLIGHTS_BY_IDS: {
            const { tabId, idsToRemove } = action.payload;
            if (!tabId || !idsToRemove || idsToRemove.length === 0 || !state[tabId]) {
                 return state; // No change if no IDs, tab doesn't exist, or no highlights for tab
            }
            const currentRanges = state[tabId];
            const remainingRanges = currentRanges.filter(
                // Keep ranges whose ID is NOT in the idsToRemove array
                savedRange => !idsToRemove.includes(savedRange.id)
            );
            // If no highlights remain for the tab, remove the tab key itself for cleanup
            if (remainingRanges.length === 0) {
                const newState = { ...state };
                delete newState[tabId];
                return newState;
            }
            // Otherwise, update the tab with the filtered ranges
            return { ...state, [tabId]: remainingRanges };
        }

         case ActionTypes.SET_HIGHLIGHTS: {
            const { tabId, ranges } = action.payload;
            if (!tabId) return state;
            return { ...state, [tabId]: Array.isArray(ranges) ? ranges : [] };
         }
        case ActionTypes.CLEAR_ALL_FOR_TAB: {
            const { tabId } = action.payload;
            if (!tabId || !state[tabId]) return state;
            const newState = { ...state };
            delete newState[tabId];
            return newState;
        }
        case ActionTypes.REMOVE_TAB: {
             const { tabId } = action.payload;
             if (!tabId || !state[tabId]) return state;
             const newState = { ...state };
             delete newState[tabId];
             console.log(`HighlightContext: Removed highlights for closed tab ${tabId}`);
             return newState;
        }
        default:
            return state;
    }
}

// Provider Component
export function HighlightProvider({ children }) {
    const [state, dispatch] = useReducer(highlightReducer, initialState);

    // Memoized actions
    const addHighlight = useCallback((tabId, range) => {
        dispatch({ type: ActionTypes.ADD_HIGHLIGHT, payload: { tabId, range } });
    }, []);

    // REMOVE old removeHighlightsIntersecting dispatcher
    // const removeHighlightsIntersecting = useCallback((tabId, selectionRange) => { ... }, []);

    // ADD new removeHighlightsByIds dispatcher
    const removeHighlightsByIds = useCallback((tabId, idsToRemove) => {
         dispatch({ type: ActionTypes.REMOVE_HIGHLIGHTS_BY_IDS, payload: { tabId, idsToRemove } });
     }, []);


    const clearHighlightsForTab = useCallback((tabId) => {
        dispatch({ type: ActionTypes.CLEAR_ALL_FOR_TAB, payload: { tabId } });
    }, []);

    const removeTabHighlights = useCallback((tabId) => {
         dispatch({ type: ActionTypes.REMOVE_TAB, payload: { tabId } });
     }, []);

    // The value provided by the context
    const value = {
        highlightsByTab: state,
        addHighlight,
        // removeHighlightsIntersecting, // REMOVE
        removeHighlightsByIds,      // ADD
        clearHighlightsForTab,
        removeTabHighlights,
    };

    return (
        <HighlightContext.Provider value={value}>
            {children}
        </HighlightContext.Provider>
    );
}

HighlightProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

// Custom Hook to use the context
export const useHighlightContext = () => {
    const context = useContext(HighlightContext);
    if (context === null) {
        throw new Error('useHighlightContext must be used within a HighlightProvider');
    }
    return context;
};