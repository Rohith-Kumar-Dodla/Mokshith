import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);
  const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isOpen
          ? 'bg-white shadow-lg py-3 sm:py-4'
          : 'bg-transparent py-4 sm:py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center space-x-2 min-w-0" onClick={closeMenu}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg sm:text-xl">M</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-primary truncate">
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

          <button
            type="button"
            className="md:hidden flex items-center justify-center text-text rounded-lg hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex-shrink-0"
            onClick={toggleMenu}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-nav-panel"
          >
            {isOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>

        {isOpen && (
          <>
            <button
              type="button"
              className="md:hidden fixed inset-0 bg-black/30 z-40"
              aria-label="Close menu overlay"
              onClick={closeMenu}
            />
            <div
              id="mobile-nav-panel"
              className="md:hidden absolute left-0 right-0 top-full z-50 bg-white shadow-lg border-t border-gray-100 rounded-b-xl"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.path}
                    className="block text-text hover:text-secondary hover:bg-gray-50 transition-colors duration-200 font-medium py-3 px-3 rounded-lg text-base min-h-[44px]"
                    onClick={closeMenu}
                  >
                    {link.name}
                  </a>
                ))}
                <Link
                  to="/login"
                  className="block text-text hover:text-secondary hover:bg-gray-50 transition-colors duration-200 font-medium py-3 px-3 rounded-lg text-base min-h-[44px]"
                  onClick={closeMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block btn-primary text-center py-3 px-4 text-base min-h-[44px] mt-2"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
