// src/features/patents/components/Layout/ClaimsPane.jsx
import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import LayoutToggle from './LayoutToggle';

export default function ClaimsPane({ patent, commentsVisible, toggleComments }) {
  const html = (str) => ({ __html: str || '<p>No data available.</p>' });
  const figuresContent = patent?.figures || '<p class="text-sm text-gray-500">No figures found for this patent.</p>';

  return (
    <section
      className={clsx(
        'h-full flex flex-col overflow-hidden border-l border-gray-200 transition-all duration-300 ease-in-out',
        commentsVisible ? 'basis-1/4' : 'basis-1/3'
      )}
    >
      {/* Tabs */}
      <Tab.Group defaultIndex={0}>
        {/* Tab Header */}
        {/* --- Use Fixed Height and Flex Alignment --- */}
        <Tab.List className={
            "flex shrink-0 items-center gap-4 border-b bg-white shadow-sm " +
            "px-3 lg:px-4 " + // Horizontal padding
            "h-11" // Apply same fixed height as Comments header
        }>
           {/* Layout Toggle Button */}
           <div className="mr-1 lg:mr-2">
             <LayoutToggle
                commentsVisible={commentsVisible}
                toggleComments={toggleComments}
             />
           </div>
           {/* Tab Labels */}
          {['Claims', 'Figures'].map((label) => (
            <Tab
              key={label}
              // Keep internal padding for underline positioning, text alignment handled by Tab.List items-center
              className={({ selected }) =>
                `relative pb-1 text-sm lg:text-base font-medium outline-none whitespace-nowrap
                 ${selected ? 'text-black' : 'text-gray-500 hover:text-gray-700'}
                 after:absolute after:-bottom-[1px] after:left-0 after:h-[3px]
                 after:w-full after:rounded-t-sm after:bg-emerald-500
                 ${selected ? 'after:scale-x-100' : 'after:scale-x-0'}
                 transition-colors after:transition-transform after:duration-200`
              }
            >
              {label}
            </Tab>
          ))}
        </Tab.List>

        {/* Tab Panels */}
        <Tab.Panels className="flex-1 overflow-y-auto p-4 lg:p-6">
           {/* Claims Panel */}
          <Tab.Panel className="prose prose-sm max-w-none focus:outline-none">
            <div dangerouslySetInnerHTML={html(patent?.claims)} />
          </Tab.Panel>
          {/* Figures Panel */}
          <Tab.Panel className="prose prose-sm max-w-none focus:outline-none">
            <div dangerouslySetInnerHTML={html(figuresContent)} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </section>
  );
}

// PropTypes and DefaultProps (ensure they are correct and unchanged)
ClaimsPane.propTypes = { /* ... */ };
ClaimsPane.defaultProps = { /* ... */ };