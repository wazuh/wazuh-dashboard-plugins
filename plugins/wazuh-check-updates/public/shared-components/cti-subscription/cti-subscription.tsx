import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@osd/i18n/react';
import './subscription.scss';
import { StartCtiSubscription } from './components/start-cti-subscription';
import { StatusCtiSubscription } from './components/status-cti-subscription';
import { ModalCti } from './components/modal-cti';
import { StatusCtiModal } from './components/status-cti-modal';
import { CtiStatus } from './types';
import { getApiInfo } from '../../services/get-api-info';

export const CtiSubscription = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isActive, setIsActive] = useState<CtiStatus>(CtiStatus.INACTIVE);

  useEffect(() => {
    checkCtiStatus();
  }, []);

  const checkCtiStatus = async () => {
    const response = await getApiInfo();

    const statusSubscription =
      response.affected_items[0]?.subscription?.status || CtiStatus.INACTIVE;

    setIsActive(statusSubscription);
  };

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
          <StartCtiSubscription handleModalToggle={handleModalToggle} />
        ) : (
          <StatusCtiSubscription
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
