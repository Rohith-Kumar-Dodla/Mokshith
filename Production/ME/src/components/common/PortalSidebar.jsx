import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const PortalSidebar = ({
  id = 'portal-sidebar',
  menuItems,
  brandSubtitle,
  sidebarOpen,
  mobileMenuOpen,
  onMobileClose,
  onLogoutClick,
  isActive,
}) => {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = (event) => setIsDesktop(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const showLabels = mobileMenuOpen || sidebarOpen;
  const isHiddenFromAssistiveTech = !isDesktop && !mobileMenuOpen;

  return (
    <>
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        id={id}
        aria-label="Main navigation"
        {...(isHiddenFromAssistiveTech ? { 'aria-hidden': true } : {})}
        className={`fixed top-0 left-0 h-full h-[100dvh] bg-[#0F172A] text-white flex flex-col z-50
          w-64 max-w-[min(16rem,85vw)]
          transition-transform duration-300 ease-in-out
          pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          ${sidebarOpen ? 'lg:w-64' : 'lg:w-20 lg:max-w-none'}
          ${isHiddenFromAssistiveTech ? 'pointer-events-none' : ''}`}
      >
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl flex-shrink-0">
              M
            </div>
            {showLabels && (
              <div className="min-w-0">
                <h1 className="font-bold text-lg truncate">Mokshith B2B</h1>
                <p className="text-xs text-gray-400">{brandSubtitle}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto overscroll-contain">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all min-h-[44px] ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              onClick={onMobileClose}
            >
              <item.icon size={20} className="flex-shrink-0" aria-hidden="true" />
              {showLabels && <span className="font-medium truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="flex-shrink-0 p-4 border-t border-gray-700">
          <button
            type="button"
            onClick={onLogoutClick}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all min-h-[44px]"
          >
            <FiLogOut size={20} className="flex-shrink-0" aria-hidden="true" />
            {showLabels && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default PortalSidebar;
