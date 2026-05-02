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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        <p className="text-sm font-medium text-gray-500">{message}</p>
        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose} 
            className="h-9 px-4 text-xs font-bold uppercase tracking-widest"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            variant={variant} 
            onClick={() => { onConfirm(); }} 
            loading={loading}
            className="h-9 px-4 text-xs font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
