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
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showCloseIcon={false}>
      <style dangerouslySetInnerHTML={{ __html: `
        .confirm-btn-danger {
          background-color: #f1f5f9 !important;
          color: #64748b !important;
          transition: all 0.3s ease !important;
        }
        .confirm-btn-danger:hover {
          background-color: #e11d48 !important;
          color: white !important;
          transform: scale(1.02);
          box-shadow: 0 10px 15px -3px rgba(225, 29, 72, 0.2) !important;
        }
        .confirm-btn-primary {
          background-color: #f1f5f9 !important;
          color: #64748b !important;
          transition: all 0.3s ease !important;
        }
        .confirm-btn-primary:hover {
          background-color: #0ea5e9 !important;
          color: white !important;
          transform: scale(1.02);
          box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.2) !important;
        }
        .confirm-btn-cancel {
          background-color: white !important;
          color: #94a3b8 !important;
          border: 2px solid #f1f5f9 !important;
          transition: all 0.3s ease !important;
        }
        .confirm-btn-cancel:hover {
          background-color: #0ea5e9 !important;
          color: white !important;
          border-color: #0ea5e9 !important;
          transform: scale(1.02);
          box-shadow: 0 10px 15px -3px rgba(14, 165, 233, 0.2) !important;
        }
      ` }} />
      <div className="text-center p-4">
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
            className={`w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg ${
              variant === 'danger' ? 'confirm-btn-danger' : 'confirm-btn-primary'
            }`}
          >
            {confirmText}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            disabled={loading}
            className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest transition-all confirm-btn-cancel"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
