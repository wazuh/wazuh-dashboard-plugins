import React from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { goToRegulatoryCompliance } from '../../navigation';

/**
 * The 10 supported regulatory frameworks; tabView matches each framework's
 * module id in the Regulatory Compliance app.
 */
const FRAMEWORKS = [
  { label: 'PCI DSS', tabView: 'pci' },
  { label: 'GDPR', tabView: 'gdpr' },
  { label: 'HIPAA', tabView: 'hipaa' },
  { label: 'NIST 800-53', tabView: 'nist' },
  { label: 'NIST 800-171', tabView: 'nist-800-171' },
  { label: 'TSC', tabView: 'tsc' },
  { label: 'CMMC', tabView: 'cmmc' },
  { label: 'FedRAMP', tabView: 'fedramp' },
  { label: 'ISO 27001', tabView: 'iso-27001' },
  { label: 'NIS2', tabView: 'nis2' },
];

export const RegulatoryComplianceBadges: React.FC = () => (
  <EuiFlexGroup
    gutterSize='s'
    responsive={false}
    wrap
    data-test-subj='regulatory-compliance-badges'
  >
    {FRAMEWORKS.map(framework => (
      <EuiFlexItem grow={false} key={framework.tabView}>
        <EuiBadge
          color='hollow'
          onClick={() => goToRegulatoryCompliance(framework.tabView)}
          onClickAriaLabel={`Open ${framework.label}`}
          data-test-subj={`regulatory-compliance-badge-${framework.tabView}`}
        >
          {framework.label}
        </EuiBadge>
      </EuiFlexItem>
    ))}
  </EuiFlexGroup>
);
