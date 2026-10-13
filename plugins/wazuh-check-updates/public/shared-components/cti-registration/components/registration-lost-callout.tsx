import React from 'react';
import { FormattedDate, FormattedMessage } from '@osd/i18n/react';
import { EuiCallOut } from '@elastic/eui';
import type { CtiRegistrationLost } from '../../../../common/cti-registration-status-api';

export const RegistrationLostCallOut: React.FC<{
  registrationLost: CtiRegistrationLost;
}> = ({ registrationLost }) => (
  <EuiCallOut
    title={
      <FormattedMessage
        id='wazuhCheckUpdates.ctiRegistration.lostCallOutTitle'
        defaultMessage='This instance is no longer registered with Wazuh Cloud'
      />
    }
    color='warning'
    iconType='alert'
    data-test-subj='ctiRegistrationLostCallOut'
  >
    <FormattedMessage
      id='wazuhCheckUpdates.ctiRegistration.lostCallOutBody'
      defaultMessage='It was on the {planName} plan. The dashboard noticed on {detectedAt}. This happens when the deployment is deleted in Wazuh Cloud or its access is revoked. The instance now gets the Open feed.'
      values={{
        planName: <strong>{registrationLost.last_plan}</strong>,
        detectedAt: (
          <FormattedDate
            value={registrationLost.detected_at}
            year='numeric'
            month='short'
            day='numeric'
          />
        ),
      }}
    />
  </EuiCallOut>
);
