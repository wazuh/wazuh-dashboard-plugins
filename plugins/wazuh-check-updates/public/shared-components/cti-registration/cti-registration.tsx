import React, { useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import './registration.scss';
import { StartCtiRegistration } from './components/start-cti-registration';
import { StatusCtiRegistration } from './components/status-cti-registration';
import { ModalCti } from './components/modal-cti';
import { StatusCtiModal } from './components/status-cti-modal';
import { useCtiStatus } from './hooks/useCtiStatus';
import { statusCodes } from '../../../common/constants';

export const CtiRegistration = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const { statusCTI, refetchStatus } = useCtiStatus();

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleStatusModalToggle = () => {
    setIsStatusModalOpen(!isStatusModalOpen);
  };

  return (
    <I18nProvider>
      <>
        {statusCTI.status === statusCodes.NOT_FOUND ? (
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
            handleStatusModalToggle={handleStatusModalToggle}
          />
        )}
        {isStatusModalOpen && (
          <StatusCtiModal
            refetchStatus={refetchStatus}
            handleStatusModalToggle={handleStatusModalToggle}
            statusCTI={statusCTI}
          />
        )}
      </>
    </I18nProvider>
  );
};
