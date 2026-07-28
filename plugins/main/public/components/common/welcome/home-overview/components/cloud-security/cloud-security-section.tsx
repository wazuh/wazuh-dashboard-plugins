import React from 'react';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { SectionHeader } from '../common';
import { CloudSecurityCards } from './cloud-security-cards';
import { useFindingsOverview } from '../../hooks/use-overview-data';

export interface CloudSecuritySectionProps {
  findings: ReturnType<typeof useFindingsOverview>;
}

const CloudSecuritySectionComponent: React.FC<CloudSecuritySectionProps> = ({
  findings,
}) => (
  <div>
    <SectionHeader
      title='Cloud security'
      description='Reach your cloud and SaaS integrations from the Overview.'
    />
    <CloudSecurityCards findings={findings} />
  </div>
);

export const CloudSecuritySection = React.memo(
  withErrorBoundary(CloudSecuritySectionComponent),
);
