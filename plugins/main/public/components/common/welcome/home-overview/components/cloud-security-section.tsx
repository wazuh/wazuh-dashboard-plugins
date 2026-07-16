import React from 'react';
import { EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import { withErrorBoundary } from '../../../hocs/error-boundary/with-error-boundary';
import { CloudSecurityCards } from './cloud-security-cards';

/**
 * The Cloud Security section: static navigation cards for the cloud/SaaS
 * integrations. No data fetch, so it renders immediately (no lazy load,
 * skeleton, or capability-hide behavior applies).
 */
const CloudSecuritySectionComponent: React.FC = () => (
  <div>
    <EuiTitle size='xs'>
      <h2>Cloud security</h2>
    </EuiTitle>
    <EuiText size='s' color='subdued'>
      Reach your cloud and SaaS integrations from the Overview.
    </EuiText>
    <EuiSpacer size='s' />
    <CloudSecurityCards />
  </div>
);

export const CloudSecuritySection = withErrorBoundary(
  CloudSecuritySectionComponent,
);
