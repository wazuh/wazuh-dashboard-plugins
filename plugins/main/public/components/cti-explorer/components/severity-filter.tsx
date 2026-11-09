import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
} from '@elastic/eui';
import {
  CVE_SEVERITY_FILTERS,
  CveSeverityFilter,
} from '../../../../common/cti-explorer/constants';
import { getSeverityLabel } from './severity-badge';

interface SeverityFilterProps {
  selected: CveSeverityFilter[];
  onChange: (selected: CveSeverityFilter[]) => void;
}

const OPTIONS: Array<EuiComboBoxOptionOption<CveSeverityFilter>> =
  CVE_SEVERITY_FILTERS.map(severity => ({
    label: getSeverityLabel(severity),
    value: severity,
    'data-test-subj': `ctiExplorerSeverityFilter-${severity}`,
  }));

/** Multi-select of the CVSS severity bands; none selected lists every record. */
export const SeverityFilter = ({ selected, onChange }: SeverityFilterProps) => (
  <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
    <EuiFlexItem>
      <EuiComboBox<CveSeverityFilter>
        compressed
        fullWidth
        placeholder={i18n.translate(
          'wazuh.ctiExplorer.vulnerabilities.severityPlaceholder',
          { defaultMessage: 'Severity' },
        )}
        aria-label={i18n.translate(
          'wazuh.ctiExplorer.vulnerabilities.severityAriaLabel',
          { defaultMessage: 'Filter the CVE records by severity' },
        )}
        options={OPTIONS}
        selectedOptions={OPTIONS.filter(
          option => option.value && selected.includes(option.value),
        )}
        onChange={options =>
          // Kept in the order of the bands, whatever the order of the clicks.
          onChange(
            CVE_SEVERITY_FILTERS.filter(severity =>
              options.some(option => option.value === severity),
            ),
          )
        }
        data-test-subj='ctiExplorerSeverityFilter'
      />
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiIconTip
        type='questionInCircle'
        color='subdued'
        aria-label={i18n.translate(
          'wazuh.ctiExplorer.vulnerabilities.severityHelpAriaLabel',
          { defaultMessage: 'How the severity filter works' },
        )}
        content={i18n.translate(
          'wazuh.ctiExplorer.vulnerabilities.severityHelp',
          {
            defaultMessage:
              'Each severity is translated into a range of the CVSS base scores the CNA assigned: Low is 0.1 to 3.9, Medium 4.0 to 6.9, High 7.0 to 8.9 and Critical 9.0 to 10.0. A CVE with several CVSS evaluations matches when at least one of its scores is in a selected range, so it can match more than one severity. Selecting several severities lists the records that match any of them.',
          },
        )}
        iconProps={{ 'data-test-subj': 'ctiExplorerSeverityFilterHelp' }}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);
