import { useState } from 'react';

interface FlyoutHandlers {
  onOpenHandler: (payload: any) => Awaited<void>;
  onCloseHandler: () => Awaited<void>;
  resetHandler?: () => Awaited<void>;
}

interface UseFlyoutReturn {
  isOpen: boolean;
  open: (payload: any) => void;
  close: () => void;
}

export const useFlyout = ({
  onOpenHandler,
  onCloseHandler,
  resetHandler,
}: FlyoutHandlers): UseFlyoutReturn => {
  const [flyoutIsOpen, setFlyoutIsOpen] = useState<boolean>(false);

  const openFlyout = () => {
    setFlyoutIsOpen(true);
  };

  const closeFlyout = () => {
    setFlyoutIsOpen(false);
  };

  const onFlyoutOpen = async (payload: any) => {
    // Handle flyout open
    openFlyout();
    await resetHandler?.();
    await onOpenHandler(payload);
  };

  const onFlyoutClose = async () => {
    // Handle flyout close
    closeFlyout();
    await onCloseHandler();
    await resetHandler?.();
  };

  return {
    isOpen: flyoutIsOpen,
    open: onFlyoutOpen,
    close: onFlyoutClose,
  };
};
