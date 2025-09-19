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
  const { isActive, checkCtiStatus } = useCtiStatus();

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleStatusModalToggle = () => {
    setIsStatusModalOpen(!isStatusModalOpen);
  };

  return (
    <I18nProvider>
      <>
        {isActive === CtiStatus.INACTIVE ? (
          <StartCtiRegistration handleModalToggle={handleModalToggle} />
        ) : (
          <StatusCtiRegistration
            isActive={isActive}
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
            isActive={isActive}
            checkCtiStatus={checkCtiStatus}
            handleStatusModalToggle={handleStatusModalToggle}
          />
        )}
      </>
    </I18nProvider>
  );
};
