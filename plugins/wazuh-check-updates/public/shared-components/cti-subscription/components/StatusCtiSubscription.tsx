import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiHealth, EuiButton, EuiPopover, EuiText } from '@elastic/eui';
import { CtiStatus, StatusCtiSubscriptionProps } from '../types';

export const StatusCtiSubscription: React.FC<StatusCtiSubscriptionProps> = ({
  isActive,
  checkCtiStatus,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCheckStatus = async () => {
    setIsLoading(true);
    await checkCtiStatus();
    setIsLoading(false);
  };

  const statusBadge = (
    <div className='wz-margin-h'>
      <EuiHealth
        onClickAriaLabel={
          isActive === CtiStatus.ACTIVE
            ? 'View active CTI subscription status'
            : 'View pending CTI subscription status'
        }
        color={isActive === CtiStatus.ACTIVE ? 'success' : 'warning'}
      />
    </div>
  );

  return (
    <EuiPopover
      button={statusBadge}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      onClick={() => setIsPopoverOpen(prevState => !prevState)}
    >
      <EuiText style={{ width: 300 }}>
        {isActive === CtiStatus.ACTIVE ? (
          <FormattedMessage
            id='wazuhCheckUpdates.ctiSubscription.statusPopoverActive'
            defaultMessage='Your CTI subscription is active.'
          />
        ) : (
          <FormattedMessage
            id='wazuhCheckUpdates.ctiSubscription.statusPopoverPending'
            defaultMessage='Your CTI subscription is on process'
          />
        )}
        <FormattedMessage
          id='wazuhCheckUpdates.ctiSubscription.statusPopover'
          defaultMessage='Want to refresh the status of your subscription?'
        />
      </EuiText>
      <EuiButton onClick={handleCheckStatus} isLoading={isLoading}>
        <FormattedMessage
          id='wazuhCheckUpdates.ctiSubscription.checkStatus'
          defaultMessage='Check Status'
        />
      </EuiButton>
    </EuiPopover>
  );
};
