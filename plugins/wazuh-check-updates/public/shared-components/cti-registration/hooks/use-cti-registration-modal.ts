import { useCallback, useEffect, useState } from 'react';
import { useCtiStatus } from './useCtiStatus';
import { ctiFlowState } from '../../../services/cti-flow-state';
import {
  cancelCtiRegistration,
  cancelCtiRegistrationOnUnload,
} from '../../../services/cti-registration-status';
import { getCtiRegistrationStatusPollIntervalSec } from '../../../plugin-services';

/**
 * Registration status plus the state of the registration modal. Closing the
 * modal during a pending activation cancels it, whichever close path is used
 * (button, X, overlay or Escape). Reloading or closing the tab asks for
 * confirmation first and cancels it too.
 */
export const useCtiRegistrationModal = (initiallyOpen = false) => {
  const [isModalOpen, setIsModalOpen] = useState(initiallyOpen);
  const [deviceFlowNonce, setDeviceFlowNonce] = useState(0);
  const { statusCTI, loading, deviceFlowActive, refetchStatus } = useCtiStatus(
    deviceFlowNonce,
    getCtiRegistrationStatusPollIntervalSec(),
  );

  const cancelPendingActivation = useCallback(async () => {
    try {
      await cancelCtiRegistration();
    } catch {
      // The refetch below rehydrates whatever state the server still holds.
    }
    ctiFlowState.reset();
    // Re-run the polling effect so its pending timeout is cleared.
    setDeviceFlowNonce(n => n + 1);
    await refetchStatus();
  }, [refetchStatus]);

  const activationInProgress =
    isModalOpen && deviceFlowActive && !ctiFlowState.isRegistered();

  useEffect(() => {
    if (!activationInProgress) {
      return undefined;
    }
    // Browsers show their own generic message; any custom text is ignored.
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    // Fires only once the user confirmed leaving, so the activation is dropped.
    const cancelOnPageHide = () => cancelCtiRegistrationOnUnload();
    // A page restored from the back/forward cache already sent the cancel.
    const resetOnPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsModalOpen(false);
        void cancelPendingActivation();
      }
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    window.addEventListener('pagehide', cancelOnPageHide);
    window.addEventListener('pageshow', resetOnPageShow);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload);
      window.removeEventListener('pagehide', cancelOnPageHide);
      window.removeEventListener('pageshow', resetOnPageShow);
    };
  }, [activationInProgress, cancelPendingActivation]);

  const openModal = useCallback(() => setIsModalOpen(true), []);

  const toggleModal = useCallback(() => {
    if (activationInProgress) {
      void cancelPendingActivation();
    }
    setIsModalOpen(open => !open);
  }, [activationInProgress, cancelPendingActivation]);

  const onDeviceFlowStarted = useCallback(
    () => setDeviceFlowNonce(n => n + 1),
    [],
  );

  return {
    statusCTI,
    loading,
    deviceFlowActive,
    refetchStatus,
    isModalOpen,
    openModal,
    toggleModal,
    onDeviceFlowStarted,
  };
};
