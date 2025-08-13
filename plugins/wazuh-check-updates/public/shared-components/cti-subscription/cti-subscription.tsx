import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import './subscription.scss';
import { StartCtiSubscription } from './components/StartCtiSubscription';
import { StatusCtiSubscription } from './components/StatusCtiSubscription';
import { ModalCti } from './components/ModalCti';
import { StatusCtiModal } from './components/StatusCtiModal';
import { CtiStatus, CtiSubscriptionProps } from './types';

export const CtiSubscription = ({
  isNewHomePageEnable = false,
}: CtiSubscriptionProps) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [isActive, setIsActive] = React.useState<CtiStatus>(CtiStatus.INACTIVE);

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
          <StartCtiSubscription
            isNewHomePageEnable={isNewHomePageEnable}
            handleModalToggle={handleModalToggle}
          />
        ) : (
          <StatusCtiSubscription
            isActive={isActive}
            setIsActive={setIsActive}
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
            setIsActive={setIsActive}
            handleStatusModalToggle={handleStatusModalToggle}
          />
        )}
      </>
    </I18nProvider>
  );
};
