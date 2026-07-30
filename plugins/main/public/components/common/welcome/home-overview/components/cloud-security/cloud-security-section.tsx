import React from 'react';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { SectionHeader } from '../common';
import {
  CloudSecurityCards,
  CloudSecurityCardsProps,
} from './cloud-security-cards';

export type CloudSecuritySectionProps = CloudSecurityCardsProps;

/** The cards always navigate; only their finding counts wait on the search. */
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
