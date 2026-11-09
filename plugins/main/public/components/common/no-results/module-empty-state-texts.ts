import { i18n } from '@osd/i18n';

export interface ModuleEmptyStateTexts {
  /** What is empty. */
  title: string;
  /** Why it can be empty and what to try. */
  description: string;
}

const cloudTexts = (): ModuleEmptyStateTexts => ({
  title: i18n.translate('wazuh.cloudSecurity.emptyState.title', {
    defaultMessage: 'No findings found',
  }),
  description: i18n.translate('wazuh.cloudSecurity.emptyState.description', {
    defaultMessage:
      'Findings appear after the module is configured with the credentials of the service and its first collection runs. Try changing the search or time range.',
  }),
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
    description: i18n.translate(
      'wazuh.vulnerabilityDetection.emptyState.description',
      {
        defaultMessage:
          'Vulnerabilities appear after the agents report their inventory and the scanner matches it against the vulnerability feed. Try changing the search.',
      },
    ),
  }),
  'configuration-assessment': () => ({
    title: i18n.translate('wazuh.configurationAssessment.emptyState.title', {
      defaultMessage: 'No checks found',
    }),
    description: i18n.translate(
      'wazuh.configurationAssessment.emptyState.description',
      {
        defaultMessage:
          'Checks appear after an agent reports its first scan. Findings only list the checks whose result changed between scans, so the Findings tab can be empty while the Dashboard and Inventory show the current results.',
      },
    ),
  }),
  'it-hygiene': () => ({
    title: i18n.translate('wazuh.itHygiene.emptyState.title', {
      defaultMessage: 'No inventory data found',
    }),
    description: i18n.translate('wazuh.itHygiene.emptyState.description', {
      defaultMessage:
        'The inventory appears after an agent reports its first scan, and only for the inventory types it collects. Try changing the search.',
    }),
  }),
  'incident-response-dashboard': () => ({
    title: i18n.translate('wazuh.incidentResponse.emptyState.title', {
      defaultMessage: 'No active responses triggered',
    }),
    description: i18n.translate(
      'wazuh.incidentResponse.emptyState.description',
      {
        defaultMessage:
          'This page reports the active responses that ran. It stays empty until one is triggered. Create the active responses you need in the Active Responses page.',
      },
    ),
  }),
  'case-management': () => ({
    title: i18n.translate('wazuh.caseManagement.emptyState.title', {
      defaultMessage: 'No cases found',
    }),
    description: i18n.translate('wazuh.caseManagement.emptyState.description', {
      defaultMessage:
        'Cases are created from a finding. Open a finding and create a case from it, or change the search.',
    }),
  }),
  'mitre-attack': () => ({
    title: i18n.translate('wazuh.mitreAttack.emptyState.title', {
      defaultMessage: 'No MITRE ATT&CK findings found',
    }),
    description: i18n.translate('wazuh.mitreAttack.emptyState.description', {
      defaultMessage:
        'Only findings that match a rule mapped to a MITRE technique appear here. Try changing the search or time range.',
    }),
  }),
  'regulatory-compliance': () => ({
    title: i18n.translate('wazuh.regulatoryCompliance.emptyState.title', {
      defaultMessage: 'No compliance findings found',
    }),
    description: i18n.translate(
      'wazuh.regulatoryCompliance.emptyState.description',
      {
        defaultMessage:
          'Findings appear when a rule mapped to a requirement of this standard matched. Try changing the search or time range.',
      },
    ),
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
    description: i18n.translate('wazuh.statistics.emptyState.description', {
      defaultMessage:
        'Statistics appear once the server reports its metrics. Try changing the search or time range.',
    }),
  }),
};

/** Text of the no results prompt of a module, or `undefined` when it has none. */
export const getModuleEmptyStateTexts = (
  appId?: string,
): ModuleEmptyStateTexts | undefined =>
  appId ? MODULE_EMPTY_STATE_TEXTS[appId]?.() : undefined;
