import { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

/* --------------------------------------------------
   Super–simple placeholder chatbot
   • Lives INSIDE its parent pane (no more full-screen bar)
   • Collapsed  ➜ full-width “Open Chatbot” bar
   • Expanded   ➜ small chat window that can be closed
--------------------------------------------------- */
export default function Chatbot({
  patent_id,
  patent_full_text,
  className = '',
}) {
  const [open, setOpen] = useState(false);

  /* ---- placeholder send handler ---- */
  const [msg, setMsg] = useState('');
  const handleSend = (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-console
    console.log('[Chatbot]', { patent_id, patent_full_text, userMessage: msg });
    setMsg('');
  };

  return (
    <div
      /* IMPORTANT: relative parent comes from ImageClaims.jsx,
         so absolute positioning is confined to the right-hand pane */
      className={clsx(
        'absolute inset-x-0 bottom-0 select-none',
        className,
      )}
    >
      {/* ───── collapsed bar ───── */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-t-md bg-emerald py-3 text-center text-white shadow-lg"
        >
          Open Chatbot
        </button>
      )}

      {/* ───── expanded window ───── */}
      {open && (
        <div className="flex h-80 flex-col rounded-t-md border-t bg-white shadow-lg">
          {/* header */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h3 className="font-medium">Chatbot (demo)</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xl leading-none"
              title="Close"
            >
              ×
            </button>
          </div>

          {/* messages placeholder */}
          <div className="flex-1 overflow-y-auto px-3 py-2 text-sm text-gray-500">
            <p>(messages will appear here)</p>
          </div>

          {/* composer */}
          <form
            onSubmit={handleSend}
            className="flex gap-2 border-t px-3 py-2"
          >
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded border px-2 py-1 text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded bg-emerald px-3 py-1 text-white"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

Chatbot.propTypes = {
  patent_id: PropTypes.string,
  patent_full_text: PropTypes.string,
  className: PropTypes.string,
};
