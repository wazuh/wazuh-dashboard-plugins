import React from 'react';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiButtonEmpty, EuiLoadingSpinner } from '@elastic/eui';
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

  const subscriptionPlanName =
    ctiFlowState.getSubscription()?.message?.plan?.name;

  const showPlanName =
    statusCTI.status === statusCodes.SUCCESS && Boolean(subscriptionPlanName);

  const openRegistrationModal = () => {
    onOpenModal();
  };

  const backgroundSpinner = backgroundActive ? (
    <EuiLoadingSpinner size='s' data-test-subj='ctiStatusBackgroundSpinner' />
  ) : null;

  const statusNavTop = (
    <EuiButtonEmpty
      aria-label={statusData[statusCTI.status].onClickAriaLabel}
      onClick={openRegistrationModal}
    >
      <span style={inlineRow} data-test-subj='ctiRegistrationNavStatus'>
        {showPlanName ? (
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.statusNavTopWithPlan'
            defaultMessage='Wazuh Cloud - {planName}'
            values={{ planName: subscriptionPlanName }}
          />
        ) : (
          <FormattedMessage
            id='wazuhCheckUpdates.ctiRegistration.statusNavTop'
            defaultMessage='Wazuh Cloud'
          />
        )}
        {backgroundSpinner}
      </span>
    </EuiButtonEmpty>
  );

  const statusBadge = (
    <EuiButtonEmpty
      aria-label={statusData[statusCTI.status].onClickAriaLabel}
      onClick={openRegistrationModal}
      flush='both'
    >
      <span style={inlineRow}>{backgroundSpinner}</span>
    </EuiButtonEmpty>
  );

  return isNewHomePageEnable ? statusBadge : statusNavTop;
};
