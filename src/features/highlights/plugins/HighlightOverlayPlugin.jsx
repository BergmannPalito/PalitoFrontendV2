// src/features/patents/components/Layout/plugins/HighlightOverlayPlugin.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useDebouncedCallback } from 'use-debounce';

import { useHighlightContext } from '../context/HighlightContext';
import { getRectsForSavedRange } from '../utils/highlightOverlayHelpers';
import { colorToBgClass } from '../utils/highlightColorMap';

/**
 * One overlay instance lives as long as the Lexical editor for that tab.
 * We *never* un‑mount the editor, so node‑keys stay stable and highlights
 * keep working even when more tabs are opened or new patents are searched.
 *
 * Key points that fix the “highlights disappear after search” bug:
 * ────────────────────────────────────────────────────────────────
 * 1.  We **do not wipe the stored rects** when the pane goes inactive;
 *     we simply don’t render them (return null).  
 *     This means the same rects are ready the millisecond the pane becomes
 *     active again — no dependence on Lexical update events or user clicks.
 *
 * 2.  When `isActive` flips to true we trigger an *immediate* (non‑debounced)
 *     recalculation, ensuring rects are always fresher than the cached copy.
 */
export default function HighlightOverlayPlugin({
  editorInnerDivRef,
  tabId,
  isActive,
}) {
  const [editor] = useLexicalComposerContext();
  const { highlightsByTab = {} } = useHighlightContext() || {};
  const [highlightRects, setHighlightRects] = useState([]);
  const containerRectRef = useRef(null);

  /* ————— calculate rects ————— */
  const _recalc = () => {
    if (!editor || !tabId || !editorInnerDivRef.current) return;

    const scrollContainer = editorInnerDivRef.current;
    containerRectRef.current = scrollContainer.getBoundingClientRect();
    const { top: cTop, left: cLeft } = containerRectRef.current;
    const { scrollTop, scrollLeft } = scrollContainer;

    const newRects = [];

    (highlightsByTab[tabId] || []).forEach((saved) => {
      const rects = getRectsForSavedRange(editor, saved);
      rects.forEach((r, i) => {
        if (r.width < 0.5 || r.height < 0.5) return;
        newRects.push({
          id: `${saved.id}-${i}`,
          top: r.top - cTop + scrollTop,
          left: r.left - cLeft + scrollLeft,
          width: r.width,
          height: r.height,
          color: saved.color || 'yellow',
        });
      });
    });

    if (JSON.stringify(highlightRects) !== JSON.stringify(newRects)) {
      setHighlightRects(newRects);
    }
  };

  /* debounced version for scroll / resize / editor changes */
  const recalcDebounced = useDebouncedCallback(_recalc, 100);

  /* editor updates */
  useEffect(() => {
    if (!editor) return () => {};
    return editor.registerUpdateListener(recalcDebounced);
  }, [editor, recalcDebounced]);

  /* highlight list changed */
  useEffect(() => {
    recalcDebounced();
  }, [highlightsByTab, tabId, recalcDebounced]);

  /* scroll / resize */
  useEffect(() => {
    const container = editorInnerDivRef.current;
    if (!container) return () => {};
    const sync = () => {
      containerRectRef.current = container.getBoundingClientRect();
      recalcDebounced();
    };
    container.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    sync();
    return () => {
      container.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [editorInnerDivRef, recalcDebounced]);

  /* pane becomes visible → instant update (no debounce) */
  useEffect(() => {
    if (isActive) _recalc();
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  /* if pane is not visible we simply don’t render the overlay */
  const target = editorInnerDivRef.current;
  if (!target || !isActive) return null;

  return createPortal(
    <>
      {highlightRects.map((r) => (
        <div
          key={r.id}
          className={`absolute ${
            colorToBgClass[r.color] || colorToBgClass.yellow
          } rounded-sm pointer-events-none z-0`}
          style={{
            top: `${r.top}px`,
            left: `${r.left}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
          }}
          aria-hidden="true"
        />
      ))}
    </>,
    target,
  );
}

HighlightOverlayPlugin.propTypes = {
  editorInnerDivRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]).isRequired,
  tabId: PropTypes.string,
  isActive: PropTypes.bool,
};

HighlightOverlayPlugin.defaultProps = { tabId: null, isActive: false };