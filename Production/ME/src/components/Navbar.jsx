import { Link } from 'react-router-dom';
import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const minimalPaths = ['/', '/login', '/register'];
  const isMinimal = minimalPaths.includes(location?.pathname);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);
  const firstMobileLinkRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeMenu]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Focus first link for accessibility when mobile menu opens
    setTimeout(() => {
      try {
        firstMobileLinkRef.current?.focus();
      } catch {}
    }, 0);

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '#features' },
    { name: 'How It Works', path: '#how-it-works' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 pt-[env(safe-area-inset-top,0px)] ${
          isScrolled || isOpen
            ? 'bg-white shadow-lg'
            : 'bg-white/90 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none'
        }`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16 sm:h-[4.5rem]">
            <Link to="/" className="flex items-center space-x-2 min-w-0 flex-1" onClick={closeMenu}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold text-primary truncate">
                Mokshith B2B
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6 sm:space-x-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="text-text hover:text-secondary transition-colors duration-300 font-medium text-sm sm:text-base"
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/login"
                className="text-text hover:text-secondary transition-colors duration-300 font-medium text-sm sm:text-base"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5"
              >
                Register
              </Link>
            </div>

            {!isMinimal && (
              <button
                type="button"
                className="md:hidden relative z-[110] flex items-center justify-center text-text rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex-shrink-0"
                onClick={toggleMenu}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-nav-panel"
              >
                {isOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {!isMinimal && isOpen && (
        <>
          <button
            type="button"
            className="md:hidden fixed inset-0 bg-black/40 z-[90]"
            aria-label="Close menu overlay"
            onClick={closeMenu}
          />
          <div
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="md:hidden fixed left-0 right-0 top-[calc(4rem+env(safe-area-inset-top,0px))] sm:top-[calc(4.5rem+env(safe-area-inset-top,0px))] z-[100] bg-white shadow-xl border-b border-gray-100 max-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] overflow-y-auto overscroll-contain"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/login"
                ref={firstMobileLinkRef}
                className="block text-text hover:text-secondary hover:bg-gray-50 transition-colors duration-200 font-medium py-3 px-3 rounded-lg text-base min-h-[44px]"
                onClick={closeMenu}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block btn-primary text-center py-3 px-4 text-base min-h-[44px]"
                onClick={closeMenu}
              >
                Register
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default memo(Navbar);
