import React from 'react';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { SectionHeader } from '../common';
import { CloudSecurityCards } from './cloud-security-cards';
import { useInViewport } from '../../../../hooks';
import { useCloudSecurityFindings } from '../../hooks/use-overview-data';

/** The cards always navigate; only their finding counts load lazily. */
const CloudSecuritySectionComponent: React.FC = () => {
  const [sectionRef, visible] = useInViewport<HTMLDivElement>();
  const findings = useCloudSecurityFindings(visible);

  return (
    <div ref={sectionRef}>
      <SectionHeader
        title='Cloud security'
        description='Reach your cloud and SaaS integrations from the Overview.'
      />
      <CloudSecurityCards findings={findings} />
    </div>
  );
};

export const CloudSecuritySection = React.memo(
  withErrorBoundary(CloudSecuritySectionComponent),
);
