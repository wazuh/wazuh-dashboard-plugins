import React, { useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import './registration.scss';
import { StartCtiRegistration } from './components/start-cti-registration';
import { StatusCtiRegistration } from './components/status-cti-registration';
import { ModalCti } from './components/modal-cti';
import { useCtiStatus } from './hooks/useCtiStatus';
import { statusCodes } from '../../../common/constants';
import { ctiFlowState } from '../../services/cti-flow-state';

export const CtiRegistration = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceFlowNonce, setDeviceFlowNonce] = useState(0);
  const { statusCTI, refetchStatus } = useCtiStatus(deviceFlowNonce);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const deviceFlowActive =
    Boolean(ctiFlowState.getDeviceCode()) &&
    !ctiFlowState.isRegistrationComplete();

  const isSuccess = statusCTI.status === statusCodes.SUCCESS;
  const isFailed = statusCTI.status === statusCodes.REGISTRATION_FAILED;

  const showStartCtiBar =
    !isSuccess &&
    (isFailed || statusCTI.status === statusCodes.NOT_FOUND);

  const showStatusBar =
    isSuccess ||
    isFailed ||
    (statusCTI.status === statusCodes.NOT_FOUND && deviceFlowActive);

  return (
    <I18nProvider>
      <>
        <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
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
            onDeviceFlowStarted={() =>
              setDeviceFlowNonce(n => n + 1)
            }
          />
        )}
      </>
    </I18nProvider>
  );
};
