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
  statusCTI,
  checkCtiStatus,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const checkStatus = () => {
    checkCtiStatus();
  };

  const statusData = {
    [CtiStatus.PENDING]: {
      color: 'none',
      onClickAriaLabel: 'View pending to start CTI registration',
      message: (
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.pending'
          defaultMessage='CTI Registration: {status} trying to contact the API.'
          values={{ status: statusCTI.status }}
        />
      ),
    },
    [CtiStatus.AVAILABLE]: {
      color: 'success',
      onClickAriaLabel: 'View available CTI registration status',
      message: (
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.available'
          defaultMessage='CTI Registration: {status}'
          values={{ status: statusCTI.status }}
        />
      ),
    },
    [CtiStatus.POLLING]: {
      color: 'warning',
      onClickAriaLabel: 'View polling CTI registration status',
      message: (
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.polling'
          defaultMessage='CTI Registration: {status}'
          values={{ status: statusCTI.status }}
        />
      ),
    },
    [CtiStatus.DENIED]: {
      color: 'danger',
      onClickAriaLabel: 'View denied CTI registration status',
      message: (
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.denied'
          defaultMessage='CTI Registration: {status} trying to contact the API.'
          values={{ status: statusCTI.status }}
        />
      ),
    },
    [CtiStatus.ERROR]: {
      color: 'danger',
      onClickAriaLabel: 'View error CTI registration status',
      message: (
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.error'
          defaultMessage='CTI Registration: {status} trying to contact the API.'
          values={{ status: statusCTI.status }}
        />
      ),
    },
  };

  const statusNavTop = (
    <EuiButtonEmpty>
      <EuiHealth
        aria-label={statusData[statusCTI.status].onClickAriaLabel}
        color={statusData[statusCTI.status].color}
      >
        <FormattedMessage
          id='wazuhCheckUpdates.ctiRegistration.statusNavTop'
          defaultMessage='CTI Status'
        />
      </EuiHealth>
    </EuiButtonEmpty>
  );

  const statusBadge = (
    <EuiHealth
      onClickAriaLabel={statusData[statusCTI.status].onClickAriaLabel}
      color={statusData[statusCTI.status].color}
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
          defaultMessage={statusData[statusCTI.status].message}
          values={{
            status: statusCTI.status,
          }}
        />
      </EuiText>
      <EuiButton onClick={checkStatus}>Try again</EuiButton>
    </EuiPopover>
  );
};
