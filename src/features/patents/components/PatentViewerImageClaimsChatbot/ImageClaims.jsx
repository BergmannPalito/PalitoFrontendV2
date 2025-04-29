/* -------------------------------------------------------
   Patent two-pane viewer
   • LEFT  – full description (scrollable)
   • RIGHT – Claims / Figures tabs
            + Chatbot docked bottom-right **inside this pane only**
-------------------------------------------------------- */
import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react';
import Chatbot from './Chatbot';

export default function ImageClaims({ patent }) {
  /* helper for raw HTML */
  const html = (str) => ({ __html: str || '<p>No data</p>' });

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ───────────────── LEFT : Description ───────────────── */}
      <section className="flex-1 overflow-y-auto border-r border-gray-200">
        <div
          className="prose max-w-none px-6 py-4"
          dangerouslySetInnerHTML={html(patent.description)}
        />
      </section>

      {/* ───────────────── RIGHT : Claims / Figures + Chatbot ───────────────── */}
      <section className="relative w-[28rem] max-w-full">
        {/* Tabs */}
        <Tab.Group defaultIndex={0}>
          {/* header */}
          <Tab.List className="flex gap-8 border-b px-4 pt-3">
            {['Claims', 'Figures'].map((label) => (
              <Tab
                key={label}
                className={({ selected }) =>
                  `relative py-1 font-medium outline-none
                   ${selected ? 'text-black' : 'text-gray-500'}
                   after:absolute after:-bottom-[2px] after:left-0 after:h-[3px]
                   after:w-full after:rounded-full after:bg-emerald
                   ${selected ? '' : 'after:scale-x-0 after:bg-transparent'}`}
              >
                {label}
              </Tab>
            ))}
          </Tab.List>

          {/* panels */}
          <Tab.Panels className="h-[calc(100%-2.75rem)] overflow-y-auto">
            <Tab.Panel className="prose max-w-none px-6 py-4">
              <div dangerouslySetInnerHTML={html(patent.claims)} />
            </Tab.Panel>

            <Tab.Panel className="flex items-center justify-center px-6 py-4">
              <p className="text-sm text-gray-500">No figures found</p>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Chatbot lives **inside** this right pane only */}
        <Chatbot
          patent_id={patent.id}
          patent_full_text={patent.description}
          className="absolute bottom-4 right-4"
        />
      </section>
    </div>
  );
}

ImageClaims.propTypes = {
  patent: PropTypes.shape({
    id: PropTypes.string,
    description: PropTypes.string,
    claims: PropTypes.string,
  }).isRequired,
};
