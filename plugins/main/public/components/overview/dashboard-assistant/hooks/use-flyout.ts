import { useState } from 'react';

interface FlyoutHandlers {
  onOpenHandler: (payload: any) => void;
  onCloseHandler: () => void;
  resetHandler?: () => void;
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

  const onFlyoutOpen = (payload: any) => {
    // Handle flyout open
    openFlyout();
    onOpenHandler(payload);
    resetHandler?.();
  };

  const onFlyoutClose = () => {
    // Handle flyout close
    closeFlyout();
    onCloseHandler();
    resetHandler?.();
  };

  return {
    isOpen: flyoutIsOpen,
    open: onFlyoutOpen,
    close: onFlyoutClose,
  };
};
