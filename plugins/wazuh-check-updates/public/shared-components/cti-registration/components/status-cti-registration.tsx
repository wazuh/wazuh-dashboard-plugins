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

  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const checkStatus = () => {
    checkCtiStatus();
  };

  const statusData = {
    [CtiStatus.ACTIVE]: {
      color: 'success',
      onClickAriaLabel: 'View active CTI registration status',
      message: 'CTI Registration: {status}',
    },
    [CtiStatus.PENDING]: {
      color: 'warning',
      onClickAriaLabel: 'View pending CTI registration status',
      message: 'CTI Registration: {status}',
    },
    [CtiStatus.ERROR]: {
      color: 'danger',
      onClickAriaLabel: 'View error CTI registration status',
      message: 'CTI Registration: {status} trying to contact the API.',
    },
  };

  const statusNavTop = (
    <EuiButtonEmpty>
      <EuiHealth
        onClickAriaLabel={statusData[isActive].onClickAriaLabel}
        color={statusData[isActive].color}
      >
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.statusNavTop'
          defaultMessage={statusData[isActive].message}
          values={{
            status: isActive,
          }}
        />
      </EuiHealth>
    </EuiButtonEmpty>
  );

  const statusBadge = (
    <EuiHealth
      onClickAriaLabel={statusData[isActive].onClickAriaLabel}
      color={statusData[isActive].color}
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
          defaultMessage={statusData[isActive].message}
          values={{
            status: isActive,
          }}
        />
      </EuiText>
      <EuiButton onClick={checkStatus}>Try again</EuiButton>
    </EuiPopover>
  );
};
