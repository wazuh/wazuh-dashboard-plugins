import React from 'react';
import { i18n } from '@osd/i18n';
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
      title={i18n.translate('wazuh.common.homeOverviewCloudSecurity.title', {
        defaultMessage: 'Cloud security',
      })}
      description={i18n.translate(
        'wazuh.common.homeOverviewCloudSecurity.description',
        {
          defaultMessage:
            'Reach your cloud and SaaS integrations from the Overview.',
        },
      )}
    />
    <CloudSecurityCards findings={findings} />
  </div>
);

// Annotated: `withErrorBoundary` is untyped, so without this the props
// would reach every call site as `any`.
export const CloudSecuritySection: React.FC<CloudSecuritySectionProps> =
  React.memo(withErrorBoundary(CloudSecuritySectionComponent));
