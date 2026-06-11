import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">M</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold">Mokshith B2B</span>
            </div>
            <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
              Empowering local businesses through smart B2B distribution.
              Connect Admins, Vendors, and Delivery Partners on one powerful platform.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a href="#" className="text-gray-300 hover:text-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <FaFacebook size={20} className="sm:size-24" />
              </a>
              <a href="#" className="text-gray-300 hover:text-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <FaTwitter size={20} className="sm:size-24" />
              </a>
              <a href="#" className="text-gray-300 hover:text-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <FaLinkedin size={20} className="sm:size-24" />
              </a>
              <a href="#" className="text-gray-300 hover:text-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <FaInstagram size={20} className="sm:size-24" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-secondary transition-colors text-sm sm:text-base block py-1">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-secondary transition-colors text-sm sm:text-base block py-1">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-300 hover:text-secondary transition-colors text-sm sm:text-base block py-1">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Legal</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-secondary transition-colors text-sm sm:text-base block py-1">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-secondary transition-colors text-sm sm:text-base block py-1">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-secondary transition-colors text-sm sm:text-base block py-1">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-300">
          <p className="text-xs sm:text-sm">&copy; 2024 Mokshith B2B Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
