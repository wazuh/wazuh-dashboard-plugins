import React, { useState } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import './registration.scss';
import { StartCtiRegistration } from './components/start-cti-registration';
import { StatusCtiRegistration } from './components/status-cti-registration';
import { ModalCti } from './components/modal-cti';
import { StatusCtiModal } from './components/status-cti-modal';
import { CtiStatus } from './types';
import { useCtiStatus } from './hooks/useCtiStatus';

export const CtiRegistration = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const { statusCTI, checkCtiStatus } = useCtiStatus();

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleStatusModalToggle = () => {
    setIsStatusModalOpen(!isStatusModalOpen);
  };

  return (
    <I18nProvider>
      <>
        {statusCTI.status === CtiStatus.PENDING ? (
          <StartCtiRegistration handleModalToggle={handleModalToggle} />
        ) : (
          <StatusCtiRegistration
            statusCTI={statusCTI}
            checkCtiStatus={checkCtiStatus}
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
            checkCtiStatus={checkCtiStatus}
            handleStatusModalToggle={handleStatusModalToggle}
          />
        )}
      </>
    </I18nProvider>
  );
};
