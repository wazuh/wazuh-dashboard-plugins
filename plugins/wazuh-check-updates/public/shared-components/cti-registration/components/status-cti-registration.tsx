import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiHealth,
  EuiButton,
  EuiPopover,
  EuiText,
  EuiButtonEmpty,
} from '@elastic/eui';
import { StatusCtiRegistrationProps } from '../types';
import { getCore } from '../../../plugin-services';
import { statusData } from '../../../../common/cti-status-config';

export const StatusCtiRegistration: React.FC = ({
  statusCTI,
  refetchStatus,
}: StatusCtiRegistrationProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const checkStatus = () => {
    refetchStatus();
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
        {statusData[statusCTI.status].message()}
      </EuiText>
      <EuiButton onClick={checkStatus}>Try again</EuiButton>
    </EuiPopover>
  );
};
