// src/features/patents/components/Layout/ClaimsPane.jsx
import { useState } from 'react'; // Keep useState
import PropTypes from 'prop-types';
import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import LayoutToggle from './LayoutToggle';
import ClaimsContent from './ClaimsContent';
import FiguresContent from './FiguresContent';
import DetailedFigureDisplay from './DetailedFigureDisplay';

const FIGURES_TAB_INDEX = 1; // Define index for clarity
const CLAIMS_TAB_INDEX = 0;

export default function ClaimsPane({ patent, commentsVisible, toggleComments }) {
    const [selectedFigure, setSelectedFigure] = useState(null);
    // --- Add state to control the active tab index ---
    const [activeTabIndex, setActiveTabIndex] = useState(CLAIMS_TAB_INDEX); // Default to Claims

    const handleFigureSelect = (figure) => {
        // Ensure the Figures tab is considered 'active' when opening detail view
        // Although the tabs aren't visible, this sets the state for when we return
        setActiveTabIndex(FIGURES_TAB_INDEX);
        setSelectedFigure(figure);
    };

    const handleCloseDetailView = () => {
        setSelectedFigure(null);
        // --- Explicitly set the active tab index back to Figures ---
        setActiveTabIndex(FIGURES_TAB_INDEX);
    };

    return (
        <section
            className={clsx(
                'h-full relative flex flex-col overflow-hidden',
                'border-l border-gray-200 transition-all duration-300 ease-in-out',
                commentsVisible ? 'basis-1/4' : 'basis-1/3'
            )}
        >
            {selectedFigure ? (
                <DetailedFigureDisplay
                    figure={selectedFigure}
                    onClose={handleCloseDetailView} // This now also sets the tab index
                />
            ) : (
                // --- Control the Tab.Group with state ---
                <Tab.Group
                    as="div"
                    className="flex flex-col h-full"
                    selectedIndex={activeTabIndex} // Control selected index
                    onChange={setActiveTabIndex} // Update state on manual tab change
                >
                    {/* Tab Header */}
                    <Tab.List className={clsx(
                        "flex shrink-0 items-center gap-4 border-b bg-white shadow-sm z-10",
                        "px-3 lg:px-4",
                        "h-11"
                    )}>
                        <div className="mr-1 lg:mr-2">
                            <LayoutToggle commentsVisible={commentsVisible} toggleComments={toggleComments} />
                        </div>
                        {['Claims', 'Figures'].map((label, index) => ( // Use index here if needed
                            <Tab key={label} className={({ selected }) =>
                                `relative pb-1 text-sm lg:text-base font-medium outline-none whitespace-nowrap ${selected ? 'text-black' : 'text-gray-500 hover:text-gray-700'} after:absolute after:-bottom-[1px] after:left-0 after:h-[3px] after:w-full after:rounded-t-sm after:bg-emerald-500 ${selected ? 'after:scale-x-100' : 'after:scale-x-0'} transition-colors after:transition-transform after:duration-200`
                            }>
                                {label}
                            </Tab>
                        ))}
                    </Tab.List>

                    {/* Tab Panels Container */}
                    <Tab.Panels className="flex-1 overflow-y-auto bg-white">
                        <Tab.Panel className="focus:outline-none p-4 lg:p-6">
                            <ClaimsContent patent={patent} />
                        </Tab.Panel>
                        <Tab.Panel className="focus:outline-none p-4 lg:p-6">
                            <FiguresContent
                                patent={patent}
                                onFigureSelect={handleFigureSelect} // Pass modified handler
                            />
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            )}
        </section>
    );
}

// PropTypes remain the same
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

ClaimsPane.defaultProps = {
    patent: {
        patentNr: '',
        claims: [],
        figures: [],
    },
};