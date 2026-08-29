import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wazuh.homeOverview.${id}`, { defaultMessage });

export const homeOverviewI18n = {
  overviewTitle: t('overview.title', 'Overview'),
  overviewDescription: t(
    'overview.description',
    'Fleet health, findings, and MITRE ATT&CK activity across your environment.',
  ),
  quickAccess: t('quickAccess.label', 'Quick access'),
  securityAnalytics: t('securityAnalytics.title', 'Security analytics'),
  rules: t('securityAnalytics.rules', 'Rules'),
  decoders: t('securityAnalytics.decoders', 'Decoders'),
  detectors: t('securityAnalytics.detectors', 'Detectors'),
  integrations: t('securityAnalytics.integrations', 'Integrations'),
  kvdbs: t('securityAnalytics.kvdbs', 'KVDBs'),
  filters: t('securityAnalytics.filters', 'Filters'),
  agentsByStatus: t('agentsByStatus.title', 'Agents by status'),
  agents: t('agentsByStatus.agentsLink', 'Agents'),
  noAgentsBody: t(
    'agentsByStatus.emptyBody',
    'This instance has no agents registered.',
  ),
  noAgentsHint: t(
    'agentsByStatus.emptyHint',
    'Please deploy agents to begin monitoring your endpoints.',
  ),
  deployNewAgent: t('agentsByStatus.deploy', 'Deploy new agent'),
  agentsActiveHeadline: t(
    'agentsByStatus.activeHeadline',
    '{active} of {total} agents active',
  ),
  agentStatusActive: t('agentStatus.active', 'Active'),
  agentStatusDisconnected: t('agentStatus.disconnected', 'Disconnected'),
  agentStatusPending: t('agentStatus.pending', 'Pending'),
  agentStatusNeverConnected: t(
    'agentStatus.neverConnected',
    'Never connected',
  ),
  findings: t('findings.title', 'Findings'),
  last24Hours: t('caption.last24Hours', 'Last 24 hours'),
  currentState: t('caption.currentState', 'Current state'),
  threatHunting: t('threatHunting.title', 'Threat hunting'),
  threatHuntingDescription: t(
    'threatHunting.description',
    'Hunt for threats, map activity to MITRE ATT&CK, and detect known vulnerabilities.',
  ),
  mitreTopTactics: t('mitre.topTactics', 'MITRE ATT&CK top tactics'),
  mitreAttack: t('mitre.link', 'MITRE ATT&CK'),
  noMitreTactics: t(
    'mitre.emptyTactics',
    'No MITRE ATT&CK tactics observed',
  ),
  techniquesObserved: t('mitre.techniquesObserved', 'Techniques observed'),
  top5Techniques: t('mitre.top5Techniques', 'Top 5 techniques'),
  noTechniques: t('mitre.emptyTechniques', 'No techniques observed'),
  totalFindings: t('findings.total', 'Total findings'),
  top5Rules: t('findings.top5Rules', 'Top 5 rules'),
  noRulesTriggered: t('findings.noRules', 'No rules triggered'),
  endpointSecurity: t('endpointSecurity.title', 'Endpoint security'),
  endpointSecurityDescription: t(
    'endpointSecurity.description',
    'Harden configurations, detect malware, and monitor file integrity across your fleet.',
  ),
  overallScore: t('sca.overallScore', 'Overall score'),
  top5Benchmarks: t('sca.top5Benchmarks', 'Top 5 benchmarks'),
  noScaBenchmarks: t('sca.emptyBenchmarks', 'No SCA benchmarks found'),
  osName: t('itHygiene.osName', 'OS name'),
  fileIntegrityBaselined: t(
    'fim.baselinedFleetWide',
    'File integrity baselined fleet-wide',
  ),
  top5ModifiedFiles: t('fim.top5ModifiedFiles', 'Top 5 modified files'),
  noFilesOrRegistry: t(
    'fim.emptyFiles',
    'No files or registry objects found',
  ),
  count: t('table.count', 'Count'),
  iocMatches: t('malware.iocMatches', 'IOC matches'),
  top5IocFeedTypes: t('malware.top5IocFeedTypes', 'Top 5 IOC feed types'),
  noIocsInFeed: t('malware.emptyFeed', 'No IOCs in the threat-intel feed'),
  threatIntelFeed: t('threatIntel.title', 'Threat intelligence feed'),
  threatIntelDescription: t(
    'threatIntel.description',
    'What the platform is detecting with — detection content and knowledge base.',
  ),
  threatCatalog: t('threatCatalog.title', 'Threat catalog'),
  manageContent: t('threatIntel.manageContent', 'Manage content'),
  topIocsByThreatType: t(
    'threatCatalog.topIocsByType',
    'Top IOCs by threat type',
  ),
  noThreatTypes: t(
    'threatCatalog.emptyTypes',
    'No threat types in the catalog',
  ),
  securityOperations: t('securityOperations.title', 'Security operations'),
  securityOperationsDescription: t(
    'securityOperations.description',
    'Fleet inventory scale, automated response activity, and the regulatory frameworks you can jump to.',
  ),
  actionsTriggered24h: t(
    'activeResponse.actionsTriggered24h',
    'Actions triggered, last 24 hours',
  ),
  controlsImplicated24h: t(
    'compliance.controlsImplicated24h',
    'Controls implicated, last 24 hours',
  ),
  controlsImplicatedTooltip: t(
    'compliance.controlsImplicatedTooltip',
    'Distinct controls implicated, last 24 hours',
  ),
  top5OperatingSystems: t(
    'itHygiene.top5OperatingSystems',
    'Top 5 operating systems',
  ),
  noOperatingSystems: t(
    'itHygiene.emptyOperatingSystems',
    'No operating systems found',
  ),
  noMoreOperatingSystems: t(
    'itHygiene.noMoreOperatingSystems',
    'No more operating systems to display',
  ),
  top5NetworkServices: t(
    'itHygiene.top5NetworkServices',
    'Top 5 network services',
  ),
  processName: t('itHygiene.processName', 'Process name'),
  noNetworkServices: t(
    'itHygiene.emptyNetworkServices',
    'No network services found',
  ),
  noMoreNetworkServices: t(
    'itHygiene.noMoreNetworkServices',
    'No more network services detected',
  ),
  operatingSystems: t('itHygiene.operatingSystems', 'Operating systems'),
  packages: t('itHygiene.packages', 'Packages'),
  users: t('itHygiene.users', 'Users'),
  services: t('itHygiene.services', 'Services'),
  itHygiene: t('itHygiene.link', 'IT Hygiene'),
  top5PackageName: t('vulnerabilities.top5PackageName', 'Top 5 package name'),
  noVulnerabilities: t(
    'vulnerabilities.empty',
    'No vulnerabilities found',
  ),
  cloudSecurity: t('cloudSecurity.title', 'Cloud security'),
  cloudSecurityDescription: t(
    'cloudSecurity.description',
    'Reach your cloud and SaaS integrations from the Overview.',
  ),
  passed: t('sca.passed', 'Passed'),
  failed: t('sca.failed', 'Failed'),
  severityCritical: t('severity.critical', 'Critical'),
  severityHigh: t('severity.high', 'High'),
  severityMedium: t('severity.medium', 'Medium'),
  severityLow: t('severity.low', 'Low'),
  severityInformational: t('severity.informational', 'Informational'),
  clickToSeeField: (field: string, band: string) =>
    i18n.translate('wazuh.homeOverview.findings.clickToSeeField', {
      defaultMessage: 'Click to see {field}: {band}',
      values: { field, band },
    }),
  manageIndexPatterns: t(
    'widget.manageIndexPatterns',
    'Manage index patterns',
  ),
  couldNotLoadData: t('widget.couldNotLoadData', 'Could not load data'),
  notAvailable: t('widget.notAvailable', 'Not available'),
};

export const agentStatusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return homeOverviewI18n.agentStatusActive;
    case 'disconnected':
      return homeOverviewI18n.agentStatusDisconnected;
    case 'pending':
      return homeOverviewI18n.agentStatusPending;
    case 'never_connected':
      return homeOverviewI18n.agentStatusNeverConnected;
    default:
      return status;
  }
};
