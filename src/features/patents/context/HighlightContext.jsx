// src/features/patents/context/HighlightContext.jsx
import React, { createContext, useReducer, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';

// Context Definition
const HighlightContext = createContext(null);

// State Structure: { tabId1: [range1, range2], tabId2: [range3] }
const initialState = {};

// Action Types
const ActionTypes = {
    ADD_HIGHLIGHT: 'ADD_HIGHLIGHT',
    REMOVE_HIGHLIGHTS_BY_IDS: 'REMOVE_HIGHLIGHTS_BY_IDS',
    SET_HIGHLIGHTS: 'SET_HIGHLIGHTS',
    CLEAR_ALL_FOR_TAB: 'CLEAR_ALL_FOR_TAB',
    REMOVE_TAB: 'REMOVE_TAB',
};

// Reducer Function
function highlightReducer(state, action) {
    console.log(`[HighlightContext] Reducer Action: ${action.type}`, action.payload); // Log action type and payload

    switch (action.type) {
        case ActionTypes.ADD_HIGHLIGHT: {
            const { tabId, range } = action.payload;
            if (!tabId || !range) {
                 console.warn('[HighlightContext ADD_HIGHLIGHT] Invalid payload, skipping.', action.payload);
                 return state;
            }
            const currentRanges = state[tabId] || [];
            console.log(`[HighlightContext ADD_HIGHLIGHT] Tab ${tabId} - Before:`, currentRanges);
            console.log(`[HighlightContext ADD_HIGHLIGHT] Tab ${tabId} - Adding Range:`, range);

            // Prevent adding duplicates (optional, based on ID)
            if (currentRanges.some(r => r.id === range.id)) {
                 console.log(`[HighlightContext ADD_HIGHLIGHT] Tab ${tabId} - Range ID ${range.id} already exists, skipping.`);
                return state;
            }
            const newRanges = [...currentRanges, range];
            console.log(`[HighlightContext ADD_HIGHLIGHT] Tab ${tabId} - After:`, newRanges);
            return { ...state, [tabId]: newRanges };
        }

        case ActionTypes.REMOVE_HIGHLIGHTS_BY_IDS: {
            const { tabId, idsToRemove } = action.payload;
            if (!tabId || !idsToRemove || idsToRemove.length === 0 || !state[tabId]) {
                 console.warn('[HighlightContext REMOVE_HIGHLIGHTS_BY_IDS] Invalid payload or no highlights to remove, skipping.', action.payload, `State for ${tabId}:`, state[tabId]);
                 return state; // No change if no IDs, tab doesn't exist, or no highlights for tab
            }
            const currentRanges = state[tabId];
             console.log(`[HighlightContext REMOVE_HIGHLIGHTS_BY_IDS] Tab ${tabId} - Before:`, currentRanges);
             console.log(`[HighlightContext REMOVE_HIGHLIGHTS_BY_IDS] Tab ${tabId} - Removing IDs:`, idsToRemove);

            const remainingRanges = currentRanges.filter(
                savedRange => !idsToRemove.includes(savedRange.id)
            );
            console.log(`[HighlightContext REMOVE_HIGHLIGHTS_BY_IDS] Tab ${tabId} - After:`, remainingRanges);

            if (remainingRanges.length === 0) {
                 console.log(`[HighlightContext REMOVE_HIGHLIGHTS_BY_IDS] Tab ${tabId} - No ranges left, removing tab key.`);
                const newState = { ...state };
                delete newState[tabId];
                return newState;
            }
            return { ...state, [tabId]: remainingRanges };
        }

         case ActionTypes.SET_HIGHLIGHTS: { // Less critical for this bug, but log anyway
            const { tabId, ranges } = action.payload;
            if (!tabId) return state;
            const newRangesValue = Array.isArray(ranges) ? ranges : [];
            console.log(`[HighlightContext SET_HIGHLIGHTS] Tab ${tabId} - Setting ranges to:`, newRangesValue);
            return { ...state, [tabId]: newRangesValue };
         }
        case ActionTypes.CLEAR_ALL_FOR_TAB: {
            const { tabId } = action.payload;
            if (!tabId || !state[tabId]) {
                console.warn(`[HighlightContext CLEAR_ALL_FOR_TAB] Tab ${tabId} not found or no highlights, skipping.`);
                return state;
            }
            console.log(`[HighlightContext CLEAR_ALL_FOR_TAB] Tab ${tabId} - Clearing all highlights.`);
            const newState = { ...state };
            delete newState[tabId];
            return newState;
        }
        case ActionTypes.REMOVE_TAB: {
             const { tabId } = action.payload;
             if (!tabId || !state[tabId]) {
                 console.warn(`[HighlightContext REMOVE_TAB] Tab ${tabId} not found or no highlights, skipping.`);
                 return state;
            }
             console.log(`[HighlightContext REMOVE_TAB] Removing tab ${tabId} highlights.`);
             const newState = { ...state };
             delete newState[tabId];
             return newState;
        }
        default:
             console.warn(`[HighlightContext] Unknown action type: ${action.type}`);
            return state;
    }
}

// Provider Component
export function HighlightProvider({ children }) {
    const [state, dispatch] = useReducer(highlightReducer, initialState);

    // Memoized actions (no changes needed here)
    const addHighlight = useCallback((tabId, range) => {
        dispatch({ type: ActionTypes.ADD_HIGHLIGHT, payload: { tabId, range } });
    }, []);

    const removeHighlightsByIds = useCallback((tabId, idsToRemove) => {
         dispatch({ type: ActionTypes.REMOVE_HIGHLIGHTS_BY_IDS, payload: { tabId, idsToRemove } });
     }, []);

    const clearHighlightsForTab = useCallback((tabId) => {
        dispatch({ type: ActionTypes.CLEAR_ALL_FOR_TAB, payload: { tabId } });
    }, []);

    const removeTabHighlights = useCallback((tabId) => {
         dispatch({ type: ActionTypes.REMOVE_TAB, payload: { tabId } });
     }, []);

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