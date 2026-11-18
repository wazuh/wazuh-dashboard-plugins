import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGrid,
  EuiFlexItem,
  EuiIcon,
  EuiPanel,
  EuiStat,
} from '@elastic/eui';
import { formatUIDate } from '../../../../../../../../react-services/time-service';
import { SEVERITY_PRESENTATION } from '../../../../../../../common/welcome/home-overview/lib/severity-presentation';
import { TechniqueStats as tTechniqueStats } from './lib/technique';

const EMPTY_VALUE = '-';

type TechniqueStatsProps = {
  stats?: tTechniqueStats;
  isLoading: boolean;
};

export const TechniqueStats = ({ stats, isLoading }: TechniqueStatsProps) => {
  const severity = SEVERITY_PRESENTATION.find(
    ({ band }) => band === stats?.highestSeverity,
  );
  const items = [
    {
      key: 'findings',
      title: stats ? stats.findings.toLocaleString() : EMPTY_VALUE,
      description: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.stats.findings',
        { defaultMessage: 'Findings' },
      ),
    },
    {
      key: 'agents',
      title: stats ? stats.agents.toLocaleString() : EMPTY_VALUE,
      description: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.stats.agents',
        { defaultMessage: 'Agents affected' },
      ),
    },
    {
      key: 'severity',
      title: severity ? (
        <span>
          <EuiIcon type='dot' color={severity.color} /> {severity.label}
        </span>
      ) : (
        EMPTY_VALUE
      ),
      description: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.stats.highestSeverity',
        { defaultMessage: 'Highest severity' },
      ),
    },
    {
      key: 'lastSeen',
      title: stats?.lastSeen ? formatUIDate(stats.lastSeen) : EMPTY_VALUE,
      description: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.stats.lastSeen',
        { defaultMessage: 'Last seen' },
      ),
    },
  ];

  return (
    <EuiFlexGrid columns={4} gutterSize='s' responsive>
      {items.map(({ key, title, description }) => (
        <EuiFlexItem key={key}>
          <EuiPanel paddingSize='s' hasBorder hasShadow={false}>
            <EuiStat
              data-test-subj={`technique-stat-${key}`}
              title={title}
              titleSize='xs'
              description={description}
              reverse
              isLoading={isLoading}
            />
          </EuiPanel>
        </EuiFlexItem>
      ))}
    </EuiFlexGrid>
  );
};
