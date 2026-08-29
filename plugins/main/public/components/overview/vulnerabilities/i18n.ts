import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wazuh.vulnerabilities.${id}`, { defaultMessage });

export const vulnerabilitiesI18n = {
  inventory: t('inventory', 'Inventory'),
  warning: t('warning', 'Warning'),
  moduleNotEnabled: t(
    'moduleNotEnabled',
    'Vulnerabilies detection module is not enabled. You can learn to how to configure following the',
  ),
  documentation: t('documentation', 'documentation'),
  errorCheckingModule: t(
    'errorCheckingModule',
    'Error checking if the module is enabled',
  ),
  evaluated: t('evaluated', 'Evaluated'),
  underEvaluation: t('underEvaluation', 'Under evaluation'),
  inspectVulnerabilityDetails: t(
    'inspectVulnerabilityDetails',
    'Inspect vulnerability details',
  ),
  inventoryTable: t('inventoryTable', 'Vulnerabilities Inventory Table'),
  vulnerabilityDetails: t('vulnerabilityDetails', 'Vulnerability details'),
  exportFormatted: t('exportFormatted', 'Export Formatted'),
  filterCves: t('filterCves', 'CVEs'),
  filterSeverity: t('filterSeverity', 'Severity'),
  filterPackageName: t('filterPackageName', 'Package name'),
  indexPatternMissingTitle: t(
    'indexPatternMissingTitle',
    'Vulnerability detection seems to be disabled or has a problem',
  ),
  indexPatternMissingBody: t(
    'indexPatternMissingBody',
    'If this is enabled, then this could be caused by an error in: server side, server-indexer connection or indexer side. Review the server and indexer logs.',
  ),
  indexPatternMissingDocsIntro: t(
    'indexPatternMissingDocsIntro',
    'Also, you can check the',
  ),
  indexPatternMissingDocs: t(
    'indexPatternMissingDocs',
    'vulnerability detection documentation.',
  ),
  refresh: t('refresh', 'Refresh'),
  severityCritical: t('severityCritical', 'Critical'),
  severityHigh: t('severityHigh', 'High'),
  severityMedium: t('severityMedium', 'Medium'),
  severityLow: t('severityLow', 'Low'),
  severityLabel: t('severityLabel', 'Severity'),
  evaluation: t('evaluation', 'Evaluation'),
  pending: t('pending', 'Pending'),
  count: t('count', 'Count'),
  other: t('other', 'Other'),
  missing: t('missing', 'Missing'),
  topVulnerabilities: t('topVulnerabilities', 'Top vulnerabilities'),
  top5Vulnerabilities: t('top5Vulnerabilities', 'Top 5 vulnerabilities'),
  topOsVulnerabilities: t(
    'topOsVulnerabilities',
    'Top operating system vulnerabilities',
  ),
  top5Os: t('top5Os', 'Top 5 OS'),
  agentFilter: t('agentFilter', 'Agent filter'),
  top5Agents: t('top5Agents', 'Top 5 agents'),
  topPackagesVulnerabilities: t(
    'topPackagesVulnerabilities',
    'Top packages vulnerabilities',
  ),
  top5Packages: t('top5Packages', 'Top 5 packages'),
  mostCommonScore: t(
    'mostCommonScore',
    'Most common vulnerability score',
  ),
  vulnerabilityBaseScore: t(
    'vulnerabilityBaseScore',
    'Vulnerability base score',
  ),
  mostVulnerableOsTypes: t(
    'mostVulnerableOsTypes',
    'Most vulnerable OS types',
  ),
  hostOsType: t('hostOsType', 'Host OS type'),
  vulnerabilitiesByYear: t(
    'vulnerabilitiesByYear',
    'Vulnerabilities by year of publication',
  ),
  yearPublished: t('yearPublished', 'Year published'),
  queryResultsExceeded: (limit: string) =>
    i18n.translate('wazuh.vulnerabilities.queryResultsExceeded', {
      defaultMessage:
        'The query results has exceeded the limit of {limit} hits. To provide a better experience the table only shows the first {limit} hits.',
      values: { limit },
    }),
};
