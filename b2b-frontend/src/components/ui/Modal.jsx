import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen = false, 
  title, 
  children, 
  onClose, 
  size = 'md',
  showCloseIcon = true,
  closeOnOverlayClick = true,
  preventClose = false,
  footer
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !preventClose && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[95vw]'
  };

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    if (!preventClose && onClose) {
      onClose();
    }
  };

  const modalRoot = document.getElementById('root');
  if (!modalRoot) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[20000] flex items-center justify-center p-6 transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-[#0B0F1A]/80 backdrop-blur-md transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => {
          if (closeOnOverlayClick) handleClose(e);
        }}
      />

      {/* Modal Container */}
      <div 
        className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size] || sizeClasses.md} overflow-hidden transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
          </div>
          {showCloseIcon && (
            <button 
              type="button"
              onClick={handleClose}
              disabled={preventClose}
              className={`p-2 rounded-lg transition-all ${
                preventClose 
                  ? 'text-gray-100 cursor-not-allowed opacity-50' 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900 bg-gray-50'
              }`}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-10 py-12 max-h-[70vh] overflow-y-auto custom-scrollbar text-gray-600 font-bold text-lg leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-10 py-10 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
