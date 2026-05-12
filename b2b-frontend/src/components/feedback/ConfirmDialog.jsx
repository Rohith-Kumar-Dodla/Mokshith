import React from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-lg font-semibold text-gray-700 leading-relaxed text-center">{message}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button 
            type="button" 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            className={`w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
              variant === 'danger' 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
            }`}
          >
            {confirmText}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest border-2 border-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
