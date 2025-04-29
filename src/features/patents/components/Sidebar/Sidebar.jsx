// src/features/patents/components/Sidebar/Sidebar.jsx
import { useEffect } from 'react';
import clsx from 'clsx';
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardArrowDown,
} from 'react-icons/md';
import { Disclosure } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';

import { usePatentWorkspace } from '../../context/PatentWorkspaceContext';
import { useAuth } from '@/features/authentication/hooks/useAuth';
import FolderRow from './FolderRow';

import LogoSmall from '@/assets/images/logo_small.png';
import LogoBig   from '@/assets/images/logo_big.png';

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, folders } = usePatentWorkspace();
  const { logout, idTokenPayload, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // --- Derive user info from idTokenPayload ---
  const email = idTokenPayload?.email || 'Loading...';
  const firstName = idTokenPayload?.given_name || '';
  const lastName = idTokenPayload?.family_name || '';

  // --- UPDATED Initials Calculation ---
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  // Combine initials: Use both if available, fallback to one, then '?'
  const initials = firstInitial || lastInitial ? `${firstInitial}${lastInitial}` : '?';
  // --- END UPDATED Initials Calculation ---

  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || firstName || 'User';


  const widthClass = sidebarCollapsed ? 'w-20' : 'w-52';

  /* auto-collapse on very narrow screens (unchanged) */
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth < 640 && !sidebarCollapsed) toggleSidebar();
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [sidebarCollapsed, toggleSidebar]);

  /* Logout Handler (already implemented - unchanged) */
  const handleLogout = () => {
    console.log('Sidebar: handleLogout called');
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={clsx(
        'flex h-screen flex-col border-r border-gray-200 bg-[#f1f7fa] transition-all duration-300',
        widthClass,
      )}
      style={{ minWidth: sidebarCollapsed ? '5rem' : '13rem' }}
    >
      {/* ───── top row (unchanged) ───── */}
      {sidebarCollapsed ? (
        <button
          onClick={toggleSidebar}
          className="flex h-14 w-full items-center justify-center"
          title="Expand"
        >
          <img src={LogoSmall} alt="Palito logo" className="h-10 w-auto" />
        </button>
      ) : (
        <div className="relative flex items-center justify-center py-4">
          <img src={LogoBig} alt="Palito logo" className="h-10 w-auto" />
          <button
            onClick={toggleSidebar}
            title="Collapse"
            className="absolute right-2 top-1/2 flex h-10 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white"
          >
            <MdKeyboardDoubleArrowLeft size={20} />
          </button>
        </div>
      )}

      {/* ───── rest hidden when collapsed (unchanged except for where initials are used) ───── */}
      {!sidebarCollapsed && (
        <>
          {/* search stub (unchanged) */}
          <div className="mx-auto mb-4 w-[90%] rounded-lg bg-[#E3F0F5] p-2 text-xs">
            <input
              placeholder="Search in library"
              className="w-full bg-transparent outline-none placeholder:text-gray-500"
              disabled
            />
          </div>

          {/* folders (unchanged) */}
          <div className="flex-1 space-y-1 overflow-y-auto px-1">
            {folders.map((f) => (
              <FolderRow key={f.id} folder={f} />
            ))}
          </div>

          {/* ───── profile dropdown ───── */}
          <Disclosure>
            {({ open }) => (
              <div>
                <Disclosure.Button className="w-full px-2 py-3 hover:bg-white disabled:opacity-50" disabled={isAuthLoading}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* --- Uses updated initials --- */}
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 text-sm font-medium text-white">
                        {/* Adjust font size slightly if two letters might not fit well */}
                         <span className={initials.length > 1 ? 'text-xs' : 'text-sm'}>
                           {isAuthLoading ? '...' : initials}
                         </span>
                      </div>
                      <span className="font-medium truncate">{isAuthLoading ? 'Loading...' : displayName}</span>
                    </div>
                    <MdKeyboardArrowDown
                      size={22}
                      className={clsx('transition-transform flex-shrink-0', !open && 'rotate-180')}
                    />
                  </div>
                </Disclosure.Button>

                <Disclosure.Panel>
                  {/* --- Panel content unchanged --- */}
                  <div className="space-y-2 px-4 pb-4 text-sm">
                    <div className="font-semibold">{fullName || displayName}</div>
                    <div>{email}</div>
                    <button
                      type="button"
                      className="block w-full text-left hover:text-emerald-600"
                    >
                      Change password
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left font-medium text-red-600 hover:underline"
                    >
                      LOG OUT
                    </button>
                  </div>
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        </>
      )}

      {/* ───── collapsed avatar only ───── */}
      {sidebarCollapsed && (
        <div className="mt-auto flex items-center justify-center py-4">
           {/* --- Uses updated initials --- */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-400 text-sm font-medium text-white">
             {/* Adjust font size slightly if two letters might not fit well */}
              <span className={initials.length > 1 ? 'text-xs' : 'text-sm'}>
                {isAuthLoading ? '...' : initials}
              </span>
          </div>
        </div>
      )}
    </aside>
  );
}