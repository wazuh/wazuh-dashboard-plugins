import React from 'react';
import {
  EuiNotificationBadge,
  EuiCard,
  EuiFlexGrid,
  EuiFlexItem,
  EuiIcon,
  EuiToolTip,
} from '@elastic/eui';
import { CloudSecurityApplications } from '../../../../../../utils/applications';
import { getModuleUrl } from '../../utils/navigation';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { formatValueSafely } from '../common';
import { useFindingsOverview } from '../../hooks/use-overview-data';

export interface CloudSecurityCardsProps {
  findings: ReturnType<typeof useFindingsOverview>;
}

export const CloudSecurityCards: React.FC<CloudSecurityCardsProps> = ({
  findings,
}) => (
  <RedirectAppLinks application={getCore().application}>
    <EuiFlexGrid columns={3} data-test-subj='cloud-security-cards'>
      {CloudSecurityApplications.map(module => {
        const count =
          findings.status === 'available'
            ? findings.data.cloudSecurityByModule[module.id]
            : undefined;
        return (
          <EuiFlexItem key={module.id}>
            <EuiCard
              layout='horizontal'
              icon={<EuiIcon size='xl' type={module.euiIconType} />}
              title={module.title}
              titleSize='xs'
              description={module.description}
              href={getModuleUrl(module.id)}
              style={{ position: 'relative' }}
              data-test-subj={`cloud-security-card-${module.id}`}
            >
              <span
                style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}
              >
                <EuiToolTip position='top' content='Findings, last 24h'>
                  <EuiNotificationBadge
                    size='m'
                    color={count ? 'accent' : 'subdued'}
                    data-test-subj={`cloud-security-card-${module.id}-findings`}
                  >
                    {formatValueSafely(count)}
                  </EuiNotificationBadge>
                </EuiToolTip>
              </span>
            </EuiCard>
          </EuiFlexItem>
        );
      })}
    </EuiFlexGrid>
  </RedirectAppLinks>
);
