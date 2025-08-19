import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiHealth,
  EuiButton,
  EuiPopover,
  EuiText,
  EuiButtonEmpty,
} from '@elastic/eui';
import { CtiStatus, StatusCtiSubscriptionProps } from '../types';
import { getCore } from '../../../plugin-services';

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

  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const colorHealth = isActive === CtiStatus.ACTIVE ? 'success' : 'warning';

  const statusNavTop = (
    <EuiButtonEmpty>
      <EuiHealth
        onClickAriaLabel={
          isActive === CtiStatus.ACTIVE
            ? 'View active CTI subscription status'
            : 'View pending CTI subscription status'
        }
        color={colorHealth}
      >
        <FormattedMessage
          id='wazuhCheckUpdates.ctiSubscription.statusNavTop'
          defaultMessage={`CTI Subscription: {status}`}
          values={{
            status: isActive,
          }}
        />
      </EuiHealth>
    </EuiButtonEmpty>
  );

  const statusBadge = (
    // <div className='wz-margin-h'>
    <EuiHealth
      onClickAriaLabel={`View ${isActive} CTI subscription status`}
      color={colorHealth}
    />
    // </div>
  );

  return (
    <EuiPopover
      button={isNewHomePageEnable ? statusBadge : statusNavTop}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      onClick={() => setIsPopoverOpen(prevState => !prevState)}
    >
      <EuiText style={{ width: 300 }}>
        <FormattedMessage
          id='wazuhCheckUpdates.ctiSubscription.statusPopover'
          defaultMessage='Your CTI subscription is {status}.'
          values={{
            status: isActive,
          }}
        />
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
