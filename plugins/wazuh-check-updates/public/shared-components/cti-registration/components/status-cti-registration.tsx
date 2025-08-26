import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiHealth,
  EuiButton,
  EuiPopover,
  EuiText,
  EuiButtonEmpty,
} from '@elastic/eui';
import { CtiStatus, StatusCtiRegistrationProps } from '../types';
import { getCore } from '../../../plugin-services';

export const StatusCtiRegistration: React.FC<StatusCtiRegistrationProps> = ({
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
            ? 'View active CTI registration status'
            : 'View pending CTI registration status'
        }
        color={colorHealth}
      >
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.statusNavTop'
          defaultMessage={`CTI Registration: {status}`}
          values={{
            status: isActive,
          }}
        />
      </EuiHealth>
    </EuiButtonEmpty>
  );

  const statusBadge = (
    <EuiHealth
      onClickAriaLabel={`View ${isActive} CTI registration status`}
      color={colorHealth}
    />
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
          id='wazuhCheckUpdates.ctiRegistration.statusPopover'
          defaultMessage='Your CTI registration is {status}.'
          values={{
            status: isActive,
          }}
        />
      </EuiText>
    </EuiPopover>
  );
};
