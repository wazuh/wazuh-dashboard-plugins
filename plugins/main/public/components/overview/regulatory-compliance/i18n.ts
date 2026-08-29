import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wazuh.compliance.${id}`, { defaultMessage });

export const complianceI18n = {
  controls: t('controls', 'Controls'),
  options: t('options', 'Options'),
  selectAll: t('selectAll', 'Select all'),
  unselectAll: t('unselectAll', 'Unselect all'),
  requirement: t('requirement', 'Requirement'),
  requirementLabel: (id: string) =>
    i18n.translate('wazuh.compliance.requirementLabel', {
      defaultMessage: 'Requirement {id}',
      values: { id },
    }),
  filterRequirements: t('filterRequirements', 'Filter requirements'),
  filterRequirementsAria: t(
    'filterRequirementsAria',
    'Filter requirements',
  ),
  noResults: t('noResults', 'There are no results.'),
  details: t('details', 'Details'),
  goals: t('goals', 'Goals'),
  requirementDescription: t(
    'requirementDescription',
    'Requirement description',
  ),
  recentEvents: t('recentEvents', 'Recent events'),
  errorComplianceData: (section: string) =>
    i18n.translate('wazuh.compliance.errorComplianceData', {
      defaultMessage: 'Compliance ({section}) data could not be fetched',
      values: { section },
    }),
  errorAlertsNotFetched: t(
    'errorAlertsNotFetched',
    'Alerts could not be fetched:',
  ),
  columnTime: t('columnTime', 'Time'),
  columnRequirements: t('columnRequirements', 'Requirement(s)'),
  columnRequirement: t('columnRequirement', 'Requirement'),
  columnIntegration: t('columnIntegration', 'Integration'),
  columnDecoders: t('columnDecoders', 'Decoders'),
  columnAgent: t('columnAgent', 'Agent'),
  columnAgentName: t('columnAgentName', 'Agent name'),
  columnRuleTitle: t('columnRuleTitle', 'Rule title'),
  count: t('count', 'Count'),
  other: t('other', 'Other'),
  missing: t('missing', 'Missing'),
  requirements: t('requirements', 'Requirements'),
  agents: t('agents', 'Agents'),
  agent: t('agent', 'Agent'),
  agentId: t('agentId', 'Agent ID'),
  level: t('level', 'Level'),
  lastAlerts: t('lastAlerts', 'Last alerts'),
  requirementsByAgent: t(
    'requirementsByAgent',
    'Requirements by agent',
  ),
  ruleLevelDistribution: t(
    'ruleLevelDistribution',
    'Rule level distribution',
  ),
  topRequirementsOverTime: t(
    'topRequirementsOverTime',
    'Top requirements over time',
  ),
  top10AgentsByAlerts: t(
    'top10AgentsByAlerts',
    'Top 10 agents by alerts count',
  ),
  top5RuleGroups: t('top5RuleGroups', 'Top 5 rule groups'),
  top5Rules: t('top5Rules', 'Top 5 rules'),
  stats: t('stats', 'Stats'),
  totalAlerts: t('totalAlerts', 'Total alerts'),
  maxRuleLevelDetected: t(
    'maxRuleLevelDetected',
    'Max rule level detected',
  ),
  maxRuleLevel: t('maxRuleLevel', 'Max rule level'),
  mostActiveAgents: t('mostActiveAgents', 'Most active agents'),
  mostCommonAlerts: t('mostCommonAlerts', 'Most common alerts'),
  alertsVolumeByAgent: t(
    'alertsVolumeByAgent',
    'Alerts volume by agent',
  ),
  requirementsDistributionByAgent: t(
    'requirementsDistributionByAgent',
    'Requirements distribution by agent',
  ),
  requirementsOverTime: t(
    'requirementsOverTime',
    'Requirements over time',
  ),
  requirementsEvolutionOverTime: t(
    'requirementsEvolutionOverTime',
    'Requirements evolution over time',
  ),
  requirementsDistributionByLevel: t(
    'requirementsDistributionByLevel',
    'Requirements distribution by level',
  ),
  requirementsDistributedByLevel: t(
    'requirementsDistributedByLevel',
    'Requirements distributed by level',
  ),
  timestamp: t('timestamp', 'Timestamp'),
  pciTop10Requirements: t(
    'pciTop10Requirements',
    'Top 10 PCI DSS requirements',
  ),
  pciRequirements: t('pciRequirements', 'PCI DSS requirements'),
  pciRequirementsLabel: t(
    'pciRequirementsLabel',
    'PCI DSS Requirements',
  ),
  pciTop5Requirements: t(
    'pciTop5Requirements',
    'Top 5 PCI DSS requirements',
  ),
  gdprRequirements: t('gdprRequirements', 'GDPR requirements'),
  gdprRequirementsLabel: t('gdprRequirementsLabel', 'GDPR Requirements'),
  gdprRequirementsLower: t(
    'gdprRequirementsLower',
    'GDPR requirements',
  ),
  hipaaRequirements: t('hipaaRequirements', 'HIPAA requirements'),
  tscRequirements: t('tscRequirements', 'TSC requirements'),
  tscRequirementsLabel: t('tscRequirementsLabel', 'TSC Requirements'),
};
