import React from 'react';
import { EuiCard, EuiFlexGrid, EuiFlexItem, EuiIcon } from '@elastic/eui';
import { CloudSecurityApplications } from '../../../../../../utils/applications';
import { goToCloudModule } from '../../utils/navigation';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';

export const CloudSecurityCards: React.FC = () => (
  <RedirectAppLinks application={getCore().application}>
    <EuiFlexGrid columns={3} data-test-subj='cloud-security-cards'>
      {CloudSecurityApplications.map(module => (
        <EuiFlexItem key={module.id}>
          <EuiCard
            layout='horizontal'
            icon={<EuiIcon size='xl' type={module.euiIconType} />}
            title={module.title}
            titleSize='xs'
            description={module.description}
            href={goToCloudModule(module.id)}
            data-test-subj={`cloud-security-card-${module.id}`}
          />
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  </RedirectAppLinks>
);
