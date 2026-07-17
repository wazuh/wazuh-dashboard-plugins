import React from 'react';
import { EuiCard, EuiFlexGrid, EuiFlexItem, EuiIcon } from '@elastic/eui';
import {
  docker,
  amazonWebServices,
  googleCloud,
  github,
  office365,
  microsoftGraphAPI,
} from '../../../../../../utils/applications';
import { goToCloudModule } from '../../utils/navigation';

const CLOUD_MODULES = [
  docker,
  amazonWebServices,
  googleCloud,
  github,
  office365,
  microsoftGraphAPI,
];

export const CloudSecurityCards: React.FC = () => (
  <EuiFlexGrid columns={3} data-test-subj='cloud-security-cards'>
    {CLOUD_MODULES.map(module => (
      <EuiFlexItem key={module.id}>
        <EuiCard
          layout='horizontal'
          icon={<EuiIcon size='xl' type={module.euiIconType} />}
          title={module.title}
          titleSize='xs'
          description={module.description}
          onClick={() => goToCloudModule(module.id)}
          data-test-subj={`cloud-security-card-${module.id}`}
        />
      </EuiFlexItem>
    ))}
  </EuiFlexGrid>
);
