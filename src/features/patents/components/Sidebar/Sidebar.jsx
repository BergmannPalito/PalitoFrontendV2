// src/features/patents/components/Sidebar/Sidebar.jsx
import { useState, useEffect, Fragment } from 'react'; // Import Fragment
import clsx from 'clsx';
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardArrowDown,
  MdAdd,
  MdHistory, // Keep History icon
} from 'react-icons/md';
import { Disclosure, Transition } from '@headlessui/react'; // Keep Disclosure & Transition
import { useNavigate } from 'react-router-dom';

import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
import { useAuth } from '@/features/authentication/hooks/useAuth';
import FolderRow from './FolderRow';
import AddFolderModal from './AddFolderModal';
import RecentItemRow from './RecentItemRow';

import LogoSmall from '@/assets/images/logo_small.png';
import LogoBig   from '@/assets/images/logo_big.png';

export default function Sidebar() {
  // Get context value
  const workspaceContext = usePatentWorkspace();
  // Destructure, providing default empty array if context value is temporarily missing fields
  const {
      sidebarCollapsed = false, // Default values
      toggleSidebar = () => {},
      folders = [], // <-- Default to empty array
      recentTabs = []  // <-- Default to empty array
    } = workspaceContext || {}; // Add check for context itself being null/undefined initially

  const { logout, idTokenPayload, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Derive user info
  const email = idTokenPayload?.email || 'Loading...';
  const firstName = idTokenPayload?.given_name || '';
  const lastName = idTokenPayload?.family_name || '';
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const initials = firstInitial || lastInitial ? `${firstInitial}${lastInitial}` : '?';
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || firstName || 'User';

  const widthClass = sidebarCollapsed ? 'w-20' : 'w-52';

  /* auto-collapse */
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 640 && !sidebarCollapsed) toggleSidebar();
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [sidebarCollapsed, toggleSidebar]);

  /* Logout Handler */
  const handleLogout = () => {
    // console.log('Sidebar: handleLogout called');
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside
        className={clsx(
          'relative flex h-screen flex-col border-r border-gray-200 bg-[#f1f7fa] transition-all duration-300',
          'z-50', // Keep high z-index
          widthClass,
        )}
        style={{ minWidth: sidebarCollapsed ? '5rem' : '13rem' }}
      >
        {/* ───── top row ───── */}
        {sidebarCollapsed ? (
          <button onClick={toggleSidebar} className="flex h-14 w-full items-center justify-center" title="Expand" >
            <img src={LogoSmall} alt="Palito logo" className="h-10 w-auto" />
          </button>
        ) : (
          <div className="relative flex items-center justify-center py-4">
            <img src={LogoBig} alt="Palito logo" className="h-10 w-auto" />
            <button onClick={toggleSidebar} title="Collapse" className="absolute right-2 top-1/2 flex h-10 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white" >
              <MdKeyboardDoubleArrowLeft size={20} />
            </button>
          </div>
        )}

        {/* ───── rest hidden when collapsed ───── */}
        {!sidebarCollapsed && (
          <div className="flex flex-1 flex-col overflow-hidden">

            {/* --- Search Stub --- */}
            <div className="mx-auto mb-4 w-[90%] flex-shrink-0 rounded-lg bg-[#E3F0F5] p-2 text-xs">
              <input placeholder="Search in library" className="w-full bg-transparent outline-none placeholder:text-gray-500" disabled />
            </div>

            {/* --- Main Scrollable Area --- */}
            <div className="flex-1 space-y-3 overflow-y-auto px-2 pb-4">

                {/* --- Recent Views Section (Collapsible) --- */}
                <Disclosure defaultOpen={true}>
                  {({ open }) => (
                    <div className="mb-3">
                      <Disclosure.Button className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm font-medium text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75">
                        <div className="flex items-center gap-2">
                            <MdHistory size={18} className="text-gray-500" />
                            <span>Recent Views</span>
                        </div>
                        <MdKeyboardArrowDown size={20} className={clsx('text-gray-500 transition-transform duration-200', open ? 'rotate-180' : 'rotate-0')} />
                      </Disclosure.Button>
                       <Transition as={Fragment} enter="transition duration-100 ease-out" enterFrom="transform scale-95 opacity-0" enterTo="transform scale-100 opacity-100" leave="transition duration-75 ease-out" leaveFrom="transform scale-100 opacity-100" leaveTo="transform scale-95 opacity-0" >
                          <Disclosure.Panel className="mt-1 pl-4 pr-1 text-sm text-gray-500">
                            {/* Use defensive check */}
                            {Array.isArray(recentTabs) && recentTabs.length > 0 ? (
                                recentTabs.map((item) => (
                                    <RecentItemRow key={item.id} patent={item} />
                                ))
                            ) : (
                                 <p className="px-2 py-1 text-xs text-gray-400 italic">No recent views</p>
                            )}
                          </Disclosure.Panel>
                       </Transition>
                    </div>
                  )}
                </Disclosure>
                {/* --- End Recent Views Section --- */}


                {/* --- Add Folder Button --- */}
                 <div className="mb-3">
                     <button type="button" onClick={() => setIsAddModalOpen(true)} className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm font-medium text-gray-600 hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75" >
                        <MdAdd size={20} className="flex-shrink-0 text-gray-500" />
                        <span>Add new folder</span>
                     </button>
                 </div>
                 {/* --- End Add Folder Button --- */}

                {/* --- Folders Section --- */}
                 <div>
                    <h4 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Folders
                    </h4>
                     {/* Use defensive check */}
                     {Array.isArray(folders) && folders.length > 0 ? (
                         folders.map((f) => (
                            <FolderRow key={f.id} folder={f} />
                         ))
                     ) : (
                         <p className="px-2 text-xs text-gray-400 italic">No folders created</p>
                     )}
                 </div>
                 {/* --- End Folders Section --- */}

            </div>
            {/* --- End Main Scrollable Area --- */}


            {/* Profile dropdown */}
            <div className="flex-shrink-0 border-t border-gray-200">
                <Disclosure>
                {({ open }) => (
                    <div>
                    <Disclosure.Button className="w-full px-2 py-3 hover:bg-white disabled:opacity-50" disabled={isAuthLoading}>
                        <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 text-sm font-medium text-white">
                            <span className={initials.length > 1 ? 'text-xs' : 'text-sm'}>
                                {isAuthLoading ? '...' : initials}
                            </span>
                            </div>
                            <span className="font-medium truncate">{isAuthLoading ? 'Loading...' : displayName}</span>
                        </div>
                        <MdKeyboardArrowDown size={22} className={clsx('transition-transform flex-shrink-0', !open && 'rotate-180')} />
                        </div>
                    </Disclosure.Button>

                    <Disclosure.Panel>
                        <div className="space-y-2 px-4 pb-4 text-sm">
                        <div className="font-semibold">{fullName || displayName}</div>
                        <div>{email}</div>
                        <button type="button" className="block w-full text-left hover:text-emerald-600" > Change password </button>
                        <button type="button" onClick={handleLogout} className="block w-full text-left font-medium text-red-600 hover:underline" > LOG OUT </button>
                        </div>
                    </Disclosure.Panel>
                    </div>
                )}
                </Disclosure>
            </div>

          </div>
        )}

        {/* --- collapsed avatar only --- */}
        {sidebarCollapsed && (
          <div className="mt-auto flex items-center justify-center py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-400 text-sm font-medium text-white">
                <span className={initials.length > 1 ? 'text-xs' : 'text-sm'}>
                  {isAuthLoading ? '...' : initials}
                </span>
            </div>
          </div>
        )}
      </aside>

      <AddFolderModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}