import React from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { WAZUH_MODULES_ID } from '../../../../../../../common/constants';
import { WAZUH_MODULES } from '../../../../../../../common/wazuh-modules';
import { goToRegulatoryCompliance } from '../../utils/navigation';

const FRAMEWORK_IDS = [
  WAZUH_MODULES_ID.PCI_DSS,
  WAZUH_MODULES_ID.GDPR,
  WAZUH_MODULES_ID.HIPAA,
  WAZUH_MODULES_ID.NIST_800_53,
  WAZUH_MODULES_ID.NIST_800_171,
  WAZUH_MODULES_ID.TSC,
  WAZUH_MODULES_ID.CMMC,
  WAZUH_MODULES_ID.FEDRAMP,
  WAZUH_MODULES_ID.ISO_27001,
  WAZUH_MODULES_ID.NIS2,
];

export const RegulatoryComplianceBadges: React.FC = () => (
  <EuiFlexGroup
    gutterSize='s'
    responsive={false}
    wrap
    data-test-subj='regulatory-compliance-badges'
  >
    {FRAMEWORK_IDS.map(id => {
      const label = WAZUH_MODULES[id].title;
      return (
        <EuiFlexItem grow={false} key={id}>
          <EuiBadge
            color='hollow'
            onClick={() => goToRegulatoryCompliance(id)}
            onClickAriaLabel={`Open ${label}`}
            data-test-subj={`regulatory-compliance-badge-${id}`}
          >
            {label}
          </EuiBadge>
        </EuiFlexItem>
      );
    })}
  </EuiFlexGroup>
);
