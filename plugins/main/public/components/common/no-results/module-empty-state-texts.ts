import { i18n } from '@osd/i18n';

export interface ModuleEmptyStateTexts {
  /** What is empty. */
  title: string;
  /**
   * Paragraphs in reading order: what to try first, then why the tab can be empty. One short idea
   * each, so the text can be scanned.
   */
  description: string[];
}

/** First paragraph of the tabs filtered by the search and the time range. */
export const getSearchOrTimeRangeHint = () =>
  i18n.translate('wazuh.common.moduleEmptyState.searchOrTimeRangeHint', {
    defaultMessage: 'Try changing the search or time range.',
  });

/** First paragraph of the tabs that show the current state, filtered only by the search. */
export const getSearchHint = () =>
  i18n.translate('wazuh.common.moduleEmptyState.searchHint', {
    defaultMessage: 'Try changing the search.',
  });

const cloudTexts = (): ModuleEmptyStateTexts => ({
  title: i18n.translate('wazuh.cloudSecurity.emptyState.title', {
    defaultMessage: 'No findings found',
  }),
  description: [
    getSearchOrTimeRangeHint(),
    i18n.translate('wazuh.cloudSecurity.emptyState.description', {
      defaultMessage:
        'Findings appear after the module is configured with the credentials of the service and its first collection runs.',
    }),
  ],
});

/**
 * Text of the no results prompt for each module, by application id, for the modules that do not
 * render their own empty state. Functions, so the locale is read when the prompt renders.
 */
const MODULE_EMPTY_STATE_TEXTS: Record<string, () => ModuleEmptyStateTexts> = {
  'vulnerability-detection': () => ({
    title: i18n.translate('wazuh.vulnerabilityDetection.emptyState.title', {
      defaultMessage: 'No vulnerabilities found',
    }),
    description: [
      getSearchHint(),
      i18n.translate('wazuh.vulnerabilityDetection.emptyState.description', {
        defaultMessage:
          'Vulnerabilities appear after the agents report their inventory and the scanner matches it against the vulnerability feed.',
      }),
    ],
  }),
  'configuration-assessment': () => ({
    title: i18n.translate('wazuh.configurationAssessment.emptyState.title', {
      defaultMessage: 'No checks found',
    }),
    description: [
      getSearchHint(),
      i18n.translate('wazuh.configurationAssessment.emptyState.description', {
        defaultMessage: 'Checks appear after an agent reports its first scan.',
      }),
      i18n.translate('wazuh.configurationAssessment.emptyState.findingsScope', {
        defaultMessage:
          'Findings only list the checks whose result changed between scans. The Findings tab can be empty while the Dashboard and Inventory show the current results.',
      }),
    ],
  }),
  'it-hygiene': () => ({
    title: i18n.translate('wazuh.itHygiene.emptyState.title', {
      defaultMessage: 'No inventory data found',
    }),
    description: [
      getSearchHint(),
      i18n.translate('wazuh.itHygiene.emptyState.description', {
        defaultMessage:
          'The inventory appears after an agent reports its first scan, and only for the inventory types it collects.',
      }),
    ],
  }),
  'incident-response-dashboard': () => ({
    title: i18n.translate('wazuh.incidentResponse.emptyState.title', {
      defaultMessage: 'No active responses triggered',
    }),
    description: [
      getSearchOrTimeRangeHint(),
      i18n.translate('wazuh.incidentResponse.emptyState.description', {
        defaultMessage:
          'This page reports the active responses that ran. It stays empty until one is triggered.',
      }),
      i18n.translate('wazuh.incidentResponse.emptyState.createHint', {
        defaultMessage:
          'Create the active responses you need in the Active Responses page.',
      }),
    ],
  }),
  'case-management': () => ({
    title: i18n.translate('wazuh.caseManagement.emptyState.title', {
      defaultMessage: 'No cases found',
    }),
    description: [
      getSearchHint(),
      i18n.translate('wazuh.caseManagement.emptyState.description', {
        defaultMessage:
          'Cases are created from a finding. Open a finding and create a case from it.',
      }),
    ],
  }),
  'mitre-attack': () => ({
    title: i18n.translate('wazuh.mitreAttack.emptyState.title', {
      defaultMessage: 'No MITRE ATT&CK findings found',
    }),
    description: [
      getSearchOrTimeRangeHint(),
      i18n.translate('wazuh.mitreAttack.emptyState.description', {
        defaultMessage:
          'Only findings that match a rule mapped to a MITRE technique appear here.',
      }),
    ],
  }),
  'regulatory-compliance': () => ({
    title: i18n.translate('wazuh.regulatoryCompliance.emptyState.title', {
      defaultMessage: 'No compliance findings found',
    }),
    description: [
      getSearchOrTimeRangeHint(),
      i18n.translate('wazuh.regulatoryCompliance.emptyState.description', {
        defaultMessage:
          'Findings appear when an event of an agent matches a rule mapped to a requirement of this framework. A new one can take a minute to show up.',
      }),
    ],
  }),
  'amazon-web-services': cloudTexts,
  'google-cloud': cloudTexts,
  github: cloudTexts,
  office365: cloudTexts,
  'microsoft-graph-api': cloudTexts,
  statistics: () => ({
    title: i18n.translate('wazuh.statistics.emptyState.title', {
      defaultMessage: 'No statistics found',
    }),
    description: [
      getSearchOrTimeRangeHint(),
      i18n.translate('wazuh.statistics.emptyState.description', {
        defaultMessage:
          'Statistics appear once the server reports its metrics.',
      }),
    ],
  }),
};

/** Text of the no results prompt of a module, or `undefined` when it has none. */
export const getModuleEmptyStateTexts = (
  appId?: string,
): ModuleEmptyStateTexts | undefined =>
  appId ? MODULE_EMPTY_STATE_TEXTS[appId]?.() : undefined;
