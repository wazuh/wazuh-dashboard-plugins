import React from 'react';
import moment from 'moment-timezone';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiToolTip,
} from '@elastic/eui';
import { formatUIDate } from '../../../../../../../../react-services/time-service';
import { StatTile } from '../../../../../../../common/welcome/home-overview/components/common/stat-tile';
import { SEVERITY_PRESENTATION } from '../../../../../../../common/welcome/home-overview/lib/severity-presentation';
import { TechniqueStats as tTechniqueStats } from './lib/technique';

const EMPTY_VALUE = '-';

type TechniqueStatsProps = {
  stats?: tTechniqueStats;
  isLoading: boolean;
};

/** The findings summary of the technique, styled like the Home page KPIs. */
export const TechniqueStats = ({ stats, isLoading }: TechniqueStatsProps) => {
  const severity = SEVERITY_PRESENTATION.find(
    ({ band }) => band === stats?.highestSeverity,
  );
  const items = [
    {
      key: 'findings',
      value: stats ? stats.findings.toLocaleString() : EMPTY_VALUE,
      label: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.stats.findings',
        { defaultMessage: 'Findings' },
      ),
    },
    {
      key: 'agents',
      value: stats ? stats.agents.toLocaleString() : EMPTY_VALUE,
      label: i18n.translate('wazuh.mitreAttack.techniqueFlyout.stats.agents', {
        defaultMessage: 'Agents affected',
      }),
    },
    {
      key: 'severity',
      value: severity?.label ?? EMPTY_VALUE,
      color: severity?.color,
      label: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.stats.highestSeverity',
        { defaultMessage: 'Highest severity' },
      ),
    },
    {
      key: 'lastSeen',
      value: stats?.lastSeen ? (
        <EuiToolTip content={formatUIDate(stats.lastSeen)}>
          <span tabIndex={0}>{moment(stats.lastSeen).fromNow()}</span>
        </EuiToolTip>
      ) : (
        EMPTY_VALUE
      ),
      label: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.stats.lastSeen',
        { defaultMessage: 'Last seen' },
      ),
    },
  ];

  return (
    <EuiPanel paddingSize='m' hasBorder hasShadow={false}>
      <EuiFlexGroup gutterSize='m' responsive={false} wrap>
        {items.map(({ key, value, color, label }) => (
          <EuiFlexItem key={key} style={{ minWidth: 120 }}>
            <StatTile
              value={isLoading ? <EuiLoadingSpinner size='l' /> : value}
              label={label}
              color={color}
              titleSize='m'
              reverse
              data-test-subj={`technique-stat-${key}`}
            />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
};
