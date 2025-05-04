import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useDebouncedCallback } from 'use-debounce';

import { useHighlightContext } from '../../../context/HighlightContext';
import { getRectsForSavedRange } from '../../../utils/highlightOverlayHelpers.js';
import { colorToBgClass } from '../../../utils/highlightColorMap.js';

export default function HighlightOverlayPlugin({ editorInnerDivRef, tabId }) {
  const [editor] = useLexicalComposerContext();
  const { highlightsByTab = {} } = useHighlightContext() || {};
  const [highlightRects, setHighlightRects] = useState([]);
  const containerRectRef = useRef(null);

  const calculateHighlightRects = useDebouncedCallback(() => {
    if (!editor || !tabId || !editorInnerDivRef.current) {
      setHighlightRects([]);
      return;
    }

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
  }, 100);

  /* listeners stay unchanged */
  useEffect(() => {
    if (!editor) return () => {};
    const off = editor.registerUpdateListener(() => calculateHighlightRects());
    return off;
  }, [editor, calculateHighlightRects]);

  useEffect(() => calculateHighlightRects(), [highlightsByTab, tabId, calculateHighlightRects]);

  useEffect(() => {
    const container = editorInnerDivRef.current;
    if (!container) return () => {};
    const sync = () => {
      containerRectRef.current = container.getBoundingClientRect();
      calculateHighlightRects();
    };
    container.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    sync();
    return () => {
      container.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [editorInnerDivRef, calculateHighlightRects]);

  const target = editorInnerDivRef.current;
  if (!target) return null;

  return createPortal(
    <>
      {highlightRects.map((r) => (
        <div
          key={r.id}
          className={`absolute ${colorToBgClass[r.color] || colorToBgClass.yellow} rounded-sm pointer-events-none z-0`}
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
};

HighlightOverlayPlugin.defaultProps = { tabId: null };