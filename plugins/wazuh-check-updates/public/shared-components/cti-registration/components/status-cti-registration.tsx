import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import {
  EuiHealth,
  EuiButtonEmpty,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { StatusCtiRegistrationProps } from '../types';
import { getCore } from '../../../plugin-services';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { statusData } from '../../../../common/cti-status-config';
import { statusCodes } from '../../../../common/constants';

const inlineRow: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

function isBackgroundRegistrationActive(): boolean {
  return (
    Boolean(ctiFlowState.getDeviceCode()) &&
    !ctiFlowState.isRegistrationComplete()
  );
}

export const StatusCtiRegistration: React.FC<StatusCtiRegistrationProps> = ({
  statusCTI,
  refetchStatus,
  onOpenModal,
}) => {
  const isNewHomePageEnable = getCore().uiSettings.get('home:useNewHomePage');

  const backgroundActive =
    statusCTI.status === statusCodes.NOT_FOUND &&
    isBackgroundRegistrationActive();

  const openRegistrationModal = () => {
    void refetchStatus();
    onOpenModal();
  };

  const backgroundSpinner = backgroundActive ? (
    <EuiLoadingSpinner size='s' data-test-subj='ctiStatusBackgroundSpinner' />
  ) : null;

  const statusNavTop = (
    <EuiButtonEmpty onClick={openRegistrationModal}>
      <EuiHealth
        aria-label={statusData[statusCTI.status].onClickAriaLabel}
        color={statusData[statusCTI.status].color}
      >
        <span style={inlineRow}>
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.statusNavTop'
            defaultMessage='CTI Status'
          />
          {backgroundSpinner}
        </span>
      </EuiHealth>
    </EuiButtonEmpty>
  );

  const statusBadge = (
    <EuiButtonEmpty
      aria-label={statusData[statusCTI.status].onClickAriaLabel}
      onClick={openRegistrationModal}
      flush='both'
    >
      <span style={inlineRow}>
        <EuiHealth color={statusData[statusCTI.status].color} />
        {backgroundSpinner}
      </span>
    </EuiButtonEmpty>
  );

  return isNewHomePageEnable ? statusBadge : statusNavTop;
};
