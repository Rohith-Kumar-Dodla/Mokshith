import { useState, useCallback } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useLogout } from './useLogout';

export function useLogoutConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const performLogout = useLogout();

  const requestLogout = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (!isLoading) {
      setIsOpen(false);
    }
  }, [isLoading]);

  const confirmLogout = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await performLogout();
    } catch {
      setIsLoading(false);
    }
  }, [isLoading, performLogout]);

  const LogoutConfirmDialog = () => (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={closeDialog}
      onConfirm={confirmLogout}
      title="Confirm Logout"
      message="Are you sure you want to logout from your account?"
      confirmLabel="Logout"
      cancelLabel="Cancel"
      loading={isLoading}
      confirmVariant="danger"
    />
  );

  return { requestLogout, LogoutConfirmDialog };
}
