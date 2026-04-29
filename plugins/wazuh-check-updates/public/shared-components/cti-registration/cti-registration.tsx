import React, { useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import './registration.scss';
import { StartCtiRegistration } from './components/start-cti-registration';
import { StatusCtiRegistration } from './components/status-cti-registration';
import { ModalCti } from './components/modal-cti';
import { useCtiStatus } from './hooks/useCtiStatus';
import { statusCodes } from '../../../common/constants';

export const CtiRegistration = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceFlowNonce, setDeviceFlowNonce] = useState(0);
  const { statusCTI, refetchStatus } = useCtiStatus(deviceFlowNonce);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const showStartCti =
    statusCTI.status === statusCodes.NOT_FOUND ||
    statusCTI.status === statusCodes.REGISTRATION_FAILED;

  return (
    <I18nProvider>
      <>
        {showStartCti ? (
          <StartCtiRegistration handleModalToggle={handleModalToggle} />
        ) : (
          <StatusCtiRegistration
            statusCTI={statusCTI}
            refetchStatus={refetchStatus}
          />
        )}
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
