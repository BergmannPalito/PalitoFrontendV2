// src/features/patents/components/Layout/ClaimsPane.jsx
// Removed internal state/handlers/effects for figures
import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react'; // Re-added Tab import
import clsx from 'clsx';
import LayoutToggle from './LayoutToggle';
// Import the new content components
import ClaimsContent from './ClaimsContent';
import FiguresContent from './FiguresContent';
// Removed figure/transformation related icon imports

// This component now acts as the container with Tabs again.
export default function ClaimsPane({ patent, commentsVisible, toggleComments }) {

    // State and handlers for figures now live within FiguresContent

    return (
        <section
            className={clsx(
                'h-full relative flex flex-col overflow-hidden', // Keep relative and flex-col
                'border-l border-gray-200 transition-all duration-300 ease-in-out',
                commentsVisible ? 'basis-1/4' : 'basis-1/3'
            )}
        >
            {/* Reintroduce Tab.Group */}
            <Tab.Group defaultIndex={0}>
                {/* Tab Header */}
                <Tab.List className={clsx(
                    "flex shrink-0 items-center gap-4 border-b bg-white shadow-sm z-10",
                    "px-3 lg:px-4",
                    "h-11"
                )}>
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

                {/* Tab Panels Container - Use absolute positioning like before */}
                <Tab.Panels className={clsx(
                    "absolute left-0 right-0 bottom-0 overflow-y-auto", // This makes panel content scrollable
                    "top-11", // Start below the h-11 header
                    // Padding is applied to the content components or the panels directly
                )}>

                    {/* Claims Panel - Renders ClaimsContent */}
                    <Tab.Panel className="focus:outline-none p-4 lg:p-6">
                         <ClaimsContent patent={patent} />
                    </Tab.Panel>

                    {/* Figures Panel - Renders FiguresContent */}
                    <Tab.Panel className="focus:outline-none p-4 lg:p-6">
                         <FiguresContent patent={patent} />
                    </Tab.Panel>

                </Tab.Panels>
            </Tab.Group>
        </section>
    );
}

// PropTypes for ClaimsPane remain the same as the original combined component
ClaimsPane.propTypes = {
    patent: PropTypes.shape({
        patentNr: PropTypes.string,
        claims: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            type: PropTypes.string,
            text: PropTypes.string.isRequired,
        })),
        figures: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            caption: PropTypes.string,
            image: PropTypes.string,
            page: PropTypes.number,
        })),
    }),
    commentsVisible: PropTypes.bool.isRequired,
    toggleComments: PropTypes.func.isRequired,
};

// DefaultProps for ClaimsPane
ClaimsPane.defaultProps = {
    patent: {
        patentNr: '',
        claims: [],
        figures: [],
    },
};