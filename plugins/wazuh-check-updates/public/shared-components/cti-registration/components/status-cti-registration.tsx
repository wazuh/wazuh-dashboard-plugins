import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiHealth,
  EuiButton,
  EuiPopover,
  EuiText,
  EuiButtonEmpty,
  EuiSpacer,
} from '@elastic/eui';
import { StatusCtiRegistrationProps } from '../types';
import { getCore } from '../../../plugin-services';
import { statusData } from '../../../../common/cti-status-config';
import { statusCodes } from '../../../../common/constants';

export const StatusCtiRegistration: React.FC<StatusCtiRegistrationProps> = ({
  statusCTI,
  refetchStatus,
}: StatusCtiRegistrationProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const checkStatus = () => {
    void refetchStatus();
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
        {statusCTI.status === statusCodes.REGISTRATION_FAILED &&
        statusCTI.message ? (
          <>
            <EuiSpacer size='s' />
            <EuiText size='xs' color='danger'>
              {statusCTI.message}
            </EuiText>
          </>
        ) : null}
      </EuiText>
      <EuiButton onClick={checkStatus}>Try again</EuiButton>
    </EuiPopover>
  );
};
