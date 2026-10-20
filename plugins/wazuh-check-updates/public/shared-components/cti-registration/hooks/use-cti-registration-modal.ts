import { useCallback, useState } from 'react';
import { useCtiStatus } from './useCtiStatus';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { cancelCtiRegistration } from '../../../services/cti-registration-status';
import { getCtiRegistrationStatusPollIntervalSec } from '../../../plugin-services';

/**
 * Registration status plus the state of the registration modal. Closing the
 * modal during a pending activation cancels it, whichever close path is used
 * (button, X, overlay or Escape).
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

  const openModal = useCallback(() => setIsModalOpen(true), []);

  const toggleModal = useCallback(() => {
    if (isModalOpen && deviceFlowActive && !ctiFlowState.isRegistered()) {
      void cancelPendingActivation();
    }
    setIsModalOpen(open => !open);
  }, [isModalOpen, deviceFlowActive, cancelPendingActivation]);

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
