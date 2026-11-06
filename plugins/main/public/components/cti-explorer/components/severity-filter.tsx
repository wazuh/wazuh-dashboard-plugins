import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox, EuiComboBoxOptionOption } from '@elastic/eui';
import {
  CVE_SEVERITY_FILTERS,
  CveSeverityFilter,
} from '../../../../common/cti-explorer/constants';
import { getSeverityLabel } from './severity-badge';

interface SeverityFilterProps {
  selected: CveSeverityFilter[];
  onChange: (selected: CveSeverityFilter[]) => void;
  isDisabled?: boolean;
}

const OPTIONS: Array<EuiComboBoxOptionOption<CveSeverityFilter>> =
  CVE_SEVERITY_FILTERS.map(severity => ({
    label: getSeverityLabel(severity),
    value: severity,
    'data-test-subj': `ctiExplorerSeverityFilter-${severity}`,
  }));

/** Multi-select of the CVSS severity bands; none selected lists every record. */
export const SeverityFilter = ({
  selected,
  onChange,
  isDisabled = false,
}: SeverityFilterProps) => (
  <EuiComboBox<CveSeverityFilter>
    compressed
    fullWidth
    isDisabled={isDisabled}
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
);
