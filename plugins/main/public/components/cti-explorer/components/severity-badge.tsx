import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiBadge, EuiText } from '@elastic/eui';
import type {
  CveScore,
  CvssSeverity,
} from '../../../../common/cti-explorer/cve-record';

const SEVERITY: Record<CvssSeverity, { label: string; color: string }> = {
  critical: {
    label: i18n.translate('wazuh.ctiExplorer.severity.critical', {
      defaultMessage: 'Critical',
    }),
    color: '#BD271E',
  },
  high: {
    label: i18n.translate('wazuh.ctiExplorer.severity.high', {
      defaultMessage: 'High',
    }),
    color: '#E7664C',
  },
  medium: {
    label: i18n.translate('wazuh.ctiExplorer.severity.medium', {
      defaultMessage: 'Medium',
    }),
    color: '#D6BF57',
  },
  low: {
    label: i18n.translate('wazuh.ctiExplorer.severity.low', {
      defaultMessage: 'Low',
    }),
    color: '#6092C0',
  },
  none: {
    label: i18n.translate('wazuh.ctiExplorer.severity.none', {
      defaultMessage: 'None',
    }),
    color: 'default',
  },
};

export const getSeverityLabel = (severity: CvssSeverity): string =>
  SEVERITY[severity].label;

export const getSeverityColor = (severity: CvssSeverity): string =>
  SEVERITY[severity].color;

/** Severity and score of a CVSS score: `High 8.1`. */
export const SeverityBadge = ({ score }: { score: CveScore | null }) => {
  if (!score) {
    return (
      <EuiText size='s' color='subdued' component='span'>
        -
      </EuiText>
    );
  }
  const { label, color } = SEVERITY[score.severity];
  return (
    <EuiBadge color={color} data-test-subj='ctiExplorerSeverity'>
      {i18n.translate('wazuh.ctiExplorer.severity.badge', {
        defaultMessage: '{severity} {score}',
        values: { severity: label, score: score.score.toFixed(1) },
      })}
    </EuiBadge>
  );
};
