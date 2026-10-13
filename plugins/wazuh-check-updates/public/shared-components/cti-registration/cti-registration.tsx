import React, { useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import './registration.scss';
import { StartCtiRegistration } from './components/start-cti-registration';
import { StatusCtiRegistration } from './components/status-cti-registration';
import { ModalCti } from './components/modal-cti';
import { useCtiStatus } from './hooks/useCtiStatus';
import { statusCodes } from '../../../common/constants';
import { ctiFlowState } from '../../services/cti-flow-state';
import { getCtiRegistrationStatusPollIntervalSec } from '../../plugin-services';
import { cancelCtiRegistration } from '../../services/cti-registration-status';

export const CtiRegistration = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceFlowNonce, setDeviceFlowNonce] = useState(0);
  const { statusCTI, loading, deviceFlowActive, refetchStatus } = useCtiStatus(
    deviceFlowNonce,
    getCtiRegistrationStatusPollIntervalSec(),
  );

  const cancelPendingActivation = async () => {
    try {
      await cancelCtiRegistration();
    } catch {
      // The refetch below rehydrates whatever state the server still holds.
    }
    ctiFlowState.reset();
    // Re-run the polling effect so its pending timeout is cleared.
    setDeviceFlowNonce(n => n + 1);
    await refetchStatus();
  };

  const handleModalToggle = () => {
    // Every close path (button, X, overlay, Escape) routes here: closing the
    // modal during a pending activation cancels it.
    if (isModalOpen && deviceFlowActive && !ctiFlowState.isRegistered()) {
      cancelPendingActivation();
    }
    setIsModalOpen(!isModalOpen);
  };

  const isSuccess = statusCTI.status === statusCodes.SUCCESS;
  const isFailed = statusCTI.status === statusCodes.REGISTRATION_FAILED;

  const showStartCtiBar =
    !loading &&
    !isSuccess &&
    !isFailed &&
    !deviceFlowActive &&
    statusCTI.status === statusCodes.NOT_FOUND;

  const showStatusBar =
    !loading &&
    (isSuccess ||
      isFailed ||
      (statusCTI.status === statusCodes.NOT_FOUND && deviceFlowActive));

  return (
    <I18nProvider>
      <>
        <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
          {loading ? (
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner
                size='m'
                data-test-subj='ctiRegistrationNavLoading'
              />
            </EuiFlexItem>
          ) : null}
          {showStartCtiBar ? (
            <EuiFlexItem grow={false}>
              <StartCtiRegistration handleModalToggle={handleModalToggle} />
            </EuiFlexItem>
          ) : null}
          {showStatusBar ? (
            <EuiFlexItem grow={false}>
              <StatusCtiRegistration
                statusCTI={statusCTI}
                refetchStatus={refetchStatus}
                onOpenModal={() => setIsModalOpen(true)}
              />
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
        {isModalOpen && (
          <ModalCti
            handleModalToggle={handleModalToggle}
            statusCTI={statusCTI}
            refetchStatus={refetchStatus}
            onDeviceFlowStarted={() => setDeviceFlowNonce(n => n + 1)}
          />
        )}
      </>
    </I18nProvider>
  );
};
