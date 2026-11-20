import React from 'react';
import moment from 'moment-timezone';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGrid,
  EuiFlexItem,
  EuiPanel,
  EuiStat,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { formatUIDate } from '../../../../../../../../react-services/time-service';
import { SEVERITY_PRESENTATION } from '../../../../../../../common/welcome/home-overview/lib/severity-presentation';
import { TechniqueStats as tTechniqueStats } from './lib/technique';

const EMPTY_VALUE = '-';

type TechniqueStatsProps = {
  stats?: tTechniqueStats;
  isLoading: boolean;
};

/** The findings summary of the technique, one card per value. */
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
    <EuiFlexGrid columns={4} gutterSize='s' responsive>
      {items.map(({ key, value, color, label }) => (
        <EuiFlexItem key={key}>
          <EuiPanel paddingSize='s' hasBorder hasShadow={false}>
            <EuiStat
              data-test-subj={`technique-stat-${key}`}
              title={value}
              titleElement='div'
              titleSize='s'
              titleColor={color ?? 'default'}
              description={
                <EuiText size='xs' color='subdued'>
                  {label}
                </EuiText>
              }
              descriptionElement='div'
              isLoading={isLoading}
            />
          </EuiPanel>
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  );
};
