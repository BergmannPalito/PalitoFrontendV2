// src/features/patents/components/Sidebar/RecentItemRow.jsx
import PropTypes from 'prop-types';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
// --- Remove CopyIcon import ---
// import { CopyIcon } from '@/assets/icons/custom';
// --- Import FileText icon ---
import { FileText } from 'lucide-react';

// Mock function (unchanged)
async function fetchPatentDataById(id) {
    console.warn(`[RecentItemRow] Fetching full data for ${id} not implemented. Using basic info.`);
    const name = id;
    return {
      id,
      name,
      description: `<p>Recently viewed patent: <strong>${name}</strong>. Full data would be loaded here.</p>`,
      claims: `<p>Claims for ${name}.</p>`,
      images: '',
    };
}


export default function RecentItemRow({ patent }) {
    const { openTabs, addTab, setActiveTab } = usePatentWorkspace();

    const handleClick = async () => {
        console.log(`[RecentItemRow] Clicked on recent item: ${patent.id} (${patent.name})`);
        const existingTabIndex = openTabs.findIndex(tab => tab.id === patent.id);

        if (existingTabIndex !== -1) {
            console.log(`[RecentItemRow] Tab ${patent.id} already open at index ${existingTabIndex}. Activating.`);
            setActiveTab(existingTabIndex);
        } else {
            console.log(`[RecentItemRow] Tab ${patent.id} not open. Fetching and adding.`);
            try {
                const newTabData = await fetchPatentDataById(patent.id);
                addTab(newTabData);
            } catch (error) {
                console.error(`[RecentItemRow] Failed to fetch or add tab for ${patent.id}:`, error);
            }
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            title={`Open ${patent.name}`}
            className="flex w-full items-center gap-2 truncate rounded px-2 py-1 text-left text-sm text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
            {/* --- Use FileText icon --- */}
            <FileText
                size={16} // Consistent size with PatentRow
                className="text-gray-500 flex-shrink-0" // Consistent styling
                strokeWidth={2}
             />
             {/* --- End Icon Change --- */}
            <span className="truncate">{patent.name}</span>
        </button>
    );
}

RecentItemRow.propTypes = {
  patent: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};