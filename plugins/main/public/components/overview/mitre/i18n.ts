import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wazuh.mitre.${id}`, { defaultMessage });

export const mitreI18n = {
  intelligence: t('intelligence', 'Intelligence'),
  framework: t('framework', 'Framework'),
  tactics: t('tactics', 'Tactics'),
  techniques: t('techniques', 'Techniques'),
  options: t('options', 'Options'),
  selectAll: t('selectAll', 'Select all'),
  unselectAll: t('unselectAll', 'Unselect all'),
  tacticsOptionsAria: t('tacticsOptionsAria', 'tactics options'),
  actions: t('actions', 'Actions'),
  filterForValue: t('filterForValue', 'Filter for value'),
  filterOutValue: t('filterOutValue', 'Filter out value'),
  viewTechniqueDetails: t('viewTechniqueDetails', 'View technique details'),
  noResults: t('noResults', 'There are no results.'),
  hideTechniquesNoFindings: t(
    'hideTechniquesNoFindings',
    'Hide techniques with no findings',
  ),
  filterTechniquesPlaceholder: t(
    'filterTechniquesPlaceholder',
    'Filter techniques of selected tactic/s',
  ),
  filterTechniquesAria: t(
    'filterTechniquesAria',
    'Filter techniques of selected tactics',
  ),
  errorAlertsNotFetched: t(
    'errorAlertsNotFetched',
    'Mitre alerts could not be fetched',
  ),
  errorTechniquesNotFetched: t(
    'errorTechniquesNotFetched',
    'Mitre techniques could not be fetched',
  ),
  errorTechniqueNotObtained: t(
    'errorTechniqueNotObtained',
    'Error obtaining the requested technique',
  ),
  errorGettingSuggestions: t(
    'errorGettingSuggestions',
    'Error getting suggestions',
  ),
  id: t('id', 'ID'),
  name: t('name', 'Name'),
  description: t('description', 'Description'),
  version: t('version', 'Version'),
  createdTime: t('createdTime', 'Created Time'),
  modifiedTime: t('modifiedTime', 'Modified Time'),
  techniqueDetails: t('techniqueDetails', 'Technique details'),
  recentEvents: t('recentEvents', 'Recent events'),
  details: t('details', 'Details'),
  openTechniqueInIntelligence: (id: string) =>
    i18n.translate('wazuh.mitre.openTechniqueInIntelligence', {
      defaultMessage:
        'Open {id} details in the Intelligence section',
      values: { id },
    }),
  openTacticInIntelligence: (name: string) =>
    i18n.translate('wazuh.mitre.openTacticInIntelligence', {
      defaultMessage: 'Open {name} details in the Intelligence section',
      values: { name },
    }),
  searchAllResources: t('searchAllResources', 'Search in all resources'),
  noResultsFound: t('noResultsFound', 'No results found'),
  seeMoreResults: t('seeMoreResults', 'See more results'),
  resourceGroups: t('resourceGroups', 'Groups'),
  resourceMitigations: t('resourceMitigations', 'Mitigations'),
  resourceSoftware: t('resourceSoftware', 'Software'),
  resourceTactics: t('resourceTactics', 'Tactics'),
  resourceTechniques: t('resourceTechniques', 'Techniques'),
  fieldDescription: t('fieldDescription', 'description'),
  fieldExternalId: t('fieldExternalId', 'external ID'),
  fieldName: t('fieldName', 'name'),
  filterByField: (name: string) =>
    i18n.translate('wazuh.mitre.filterByField', {
      defaultMessage: 'filter by {name}',
      values: { name },
    }),
  columnTime: t('columnTime', 'Time'),
  columnAgent: t('columnAgent', 'Agent'),
  columnAgentName: t('columnAgentName', 'Agent Name'),
  columnTechniques: t('columnTechniques', 'Technique(s)'),
  columnTactics: t('columnTactics', 'Tactic(s)'),
  columnLevel: t('columnLevel', 'Level'),
  columnRuleId: t('columnRuleId', 'Rule ID'),
  columnTitle: t('columnTitle', 'Title'),
  tabTable: t('tabTable', 'Table'),
  tabJson: t('tabJson', 'JSON'),
  documentDetailsAria: t('documentDetailsAria', 'Document details'),
  information: t('information', 'Information'),
  compliance: t('compliance', 'Compliance'),
  viewInRules: t('viewInRules', 'View in Rules'),
  filterByRuleId: (id: string) =>
    i18n.translate('wazuh.mitre.filterByRuleId', {
      defaultMessage: 'Filter by this rule ID: {id}',
      values: { id },
    }),
  filterByLevel: (level: string | number) =>
    i18n.translate('wazuh.mitre.filterByLevel', {
      defaultMessage: 'Filter by this level: {level}',
      values: { level },
    }),
  file: t('file', 'File'),
  path: t('path', 'Path'),
  groups: t('groups', 'Groups'),
  count: t('count', 'Count'),
  other: t('other', 'Other'),
  missing: t('missing', 'Missing'),
  alertsEvolution: t('alertsEvolution', 'Alerts evolution over time'),
  topTactics: t('topTactics', 'Top tactics'),
  attacksByTechnique: t('attacksByTechnique', 'Attacks by technique'),
  topTacticsByAgent: t('topTacticsByAgent', 'Top tactics by agent'),
  techniquesByAgent: t('techniquesByAgent', 'Mitre techniques by agent'),
  ruleLevelByAttack: t('ruleLevelByAttack', 'Rule level by attack'),
  mitreAttacksByTactic: t('mitreAttacksByTactic', 'MITRE attacks by tactic'),
  ruleLevelByTactic: t('ruleLevelByTactic', 'Rule level by tactic'),
  techniqueName: t('techniqueName', 'Technique Name'),
  tacticName: t('tacticName', 'Tactic Name'),
  ruleLevel: t('ruleLevel', 'Rule level'),
};

export const mitreResourceLabels: Record<string, string> = {
  groups: mitreI18n.resourceGroups,
  mitigations: mitreI18n.resourceMitigations,
  software: mitreI18n.resourceSoftware,
  tactics: mitreI18n.resourceTactics,
  techniques: mitreI18n.resourceTechniques,
};
