import React from 'react';
import { X } from 'lucide-react';

const Drawer = ({ isOpen, onClose, title, children, width = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex justify-end bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full ${width} h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

export default Drawer;
