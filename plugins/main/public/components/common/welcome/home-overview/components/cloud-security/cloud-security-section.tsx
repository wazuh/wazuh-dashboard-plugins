import React from 'react';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { SectionHeader } from '../common';
import { CloudSecurityCards } from './cloud-security-cards';

const CloudSecuritySectionComponent: React.FC = () => (
  <div>
    <SectionHeader
      title='Cloud security'
      description='Reach your cloud and SaaS integrations from the Overview.'
    />
    <CloudSecurityCards />
  </div>
);

export const CloudSecuritySection = React.memo(
  withErrorBoundary(CloudSecuritySectionComponent),
);
