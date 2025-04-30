// src/features/patents/components/Sidebar/PatentRow.jsx
import PropTypes from 'prop-types';
import { HiDotsVertical } from 'react-icons/hi';
import { FileText } from 'lucide-react';
import RenameTabModal from '../TabWorkspace/RenameTabModal';
import { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
import { useClickOutside } from '@/hooks/useClickOutside'; // Ensure this path is correct
import clsx from 'clsx';

// Mock fetch function (should be replaced or imported)
async function fetchPatentDataById(id) {
    console.warn(`[PatentRow] Fetching full data for ${id} not implemented. Using basic info.`);
    const name = id;
    return { id, name, description: `<p>Data for ${name}</p>`, claims: `<p>Claims for ${name}</p>`, images: '' };
}

export default function PatentRow({ folderId, patent }) {
  const { removePatentFromFolder, openTabs, addTab, setActiveTab } = usePatentWorkspace();
  const [renameOpen, setRenameOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isPositionReady, setIsPositionReady] = useState(false); // Keep this for smooth open

  // --- Click outside handler ---
  // Uses the useClickOutside hook. The handler closes the menu ONLY if it's open
  // and the click was not on the trigger button.
  const handleClickOutside = useCallback((e) => {
      // console.log(`[useClickOutside Handler] Fired. isMenuOpen: ${isMenuOpen}. Target:`, e.target);
      // Check if click was ON the trigger button
      if (buttonRef.current && buttonRef.current.contains(e.target)) {
          // console.log('[useClickOutside Handler] Click was on the trigger button. Ignoring.');
          return;
      }
      // --- FIX: Only close if menu is currently open ---
      // This check ensures we only attempt to close an already open menu.
      if(isMenuOpen) {
         // console.log("[useClickOutside Handler] Click outside button & menu AND menu is open. Calling setIsMenuOpen(false).");
         setIsMenuOpen(false);
      }
      // --- End Fix ---
  }, [isMenuOpen]); // <-- isMenuOpen is correctly included as a dependency

  // Attach handler to the menu ref provided by the hook
  const menuRef = useClickOutside(handleClickOutside);


  // Calculate position effect (Ensures smooth opening transition)
  useEffect(() => {
    if (!isMenuOpen) {
        setIsPositionReady(false); // Reset ready flag when closing
        return;
    }
    // Calculate position only when opening and button ref is set
    if (isMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX // Use left alignment
      });
      // Set position ready slightly after calculation
      requestAnimationFrame(() => {
           setIsPositionReady(true);
      });
      // console.log('[PatentRow] Position calculated:', { top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
  }, [isMenuOpen]);


  // Toggle Menu
  const toggleMenu = (e) => {
      e.stopPropagation(); // Prevent row click handler when clicking the button
      setIsMenuOpen(prev => !prev);
  };

  // Menu Actions
  const handleRenameClick = (e) => { e.stopPropagation(); setIsMenuOpen(false); setRenameOpen(true); };
  const handleRemoveClick = (e) => { e.stopPropagation(); setIsMenuOpen(false); removePatentFromFolder(folderId, patent.id); };
  const handleModalClose = () => { setRenameOpen(false); }

  // Row Click Handler (Opens the patent tab)
  const handleRowClick = async (e) => {
      // Prevent opening tab if the click was on the action button
      if (buttonRef.current && buttonRef.current.contains(e.target)) { return; }

      const existingTabIndex = openTabs.findIndex(tab => tab.id === patent.id);
      if (existingTabIndex !== -1) {
           setActiveTab(existingTabIndex); // Switch to existing tab
        } else {
            try {
                const patentData = await fetchPatentDataById(patent.id); // Fetch data
                addTab(patentData); // Add as a new tab
            } catch (err) {
                 console.error(`Failed to open patent ${patent.id}:`, err);
                 // Optionally: Show an error message to the user
            }
       }
  };


  return (
    <>
      <div
        className="group flex items-center gap-2 truncate py-1 pl-2 pr-1 rounded hover:bg-gray-100 relative cursor-pointer focus:outline-none focus:ring-1 focus:ring-inset focus:ring-emerald-400"
        onClick={handleRowClick} // Handle clicks on the row itself
        role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(e); } }} // Accessibility
        title={`Open ${patent.name}`}
       >
        {/* Icon and Name */}
        <FileText size={16} className="text-gray-500 flex-shrink-0 pointer-events-none" strokeWidth={2}/>
        <span className="mr-auto truncate text-sm pointer-events-none">{patent.name}</span>

        {/* Trigger Button Area (...) */}
        <div className="relative flex-shrink-0">
            <button
                ref={buttonRef} // Ref for the trigger button
                type="button"
                onClick={toggleMenu} // Toggle menu visibility
                className={clsx(
                    "rounded p-1 text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500",
                    // Show button on hover/focus within the row
                    "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100",
                    "hover:bg-gray-200 hover:text-gray-700" // Hover effect for the button
                )}
                aria-haspopup="true" // Accessibility
                aria-expanded={isMenuOpen} // Accessibility
                title="Actions"
             >
                <HiDotsVertical size={14} />
            </button>

            {/* Portal for Dropdown Menu */}
            {/* Renders the menu only if isMenuOpen is true */}
            {isMenuOpen && ReactDOM.createPortal(
                <div
                    ref={menuRef} // Ref for the click-outside hook
                    // Use position state and transition effect
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        zIndex: 10000, // Ensure menu is on top
                        // Control visibility and opacity for smooth transition
                        visibility: isPositionReady ? 'visible' : 'hidden',
                        opacity: isPositionReady ? 1 : 0,
                    }}
                    className={clsx(
                        "w-28 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none",
                        "transition-opacity duration-100 ease-out" // Apply transition
                    )}
                    role="menu" aria-orientation="vertical"
                >
                    {/* Menu Items */}
                    <button type="button" onClick={handleRenameClick} className={clsx('block w-full px-3 py-1 text-left text-sm', 'text-gray-700 hover:bg-gray-100 hover:text-gray-900')} role="menuitem" > Rename </button>
                    <button type="button" onClick={handleRemoveClick} className={clsx('block w-full px-3 py-1 text-left text-sm', 'text-red-600 hover:bg-red-100 hover:text-red-700')} role="menuitem" > Remove </button>
                </div>,
                document.body // Append the portal directly to the body
            )}
            {/* End Portal */}
        </div>
      </div>

      {/* Rename Modal (controlled by renameOpen state) */}
      {renameOpen && (
         <RenameTabModal
            tabId={patent.id} // Pass patent ID for potential renaming logic
            initialName={patent.name}
            open={renameOpen}
            onClose={handleModalClose} // Close handler for the modal
        />
       )}
    </>
  );
}

// PropTypes (unchanged)
PatentRow.propTypes = {
  folderId: PropTypes.string.isRequired,
  patent: PropTypes.shape({
       id: PropTypes.string.isRequired,
       name: PropTypes.string.isRequired
    }).isRequired,
};