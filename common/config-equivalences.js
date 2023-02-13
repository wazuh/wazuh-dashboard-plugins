import { ASSETS_PUBLIC_URL, PLUGIN_PLATFORM_NAME } from './constants';
import { i18n } from '@kbn/i18n';

const patternIndex = i18n.translate(
  'wazuh.common.config.equivalences.patternIndex',
  {
    defaultMessage:
      "Default index pattern to use on the app. If there's no valid index pattern, the app will automatically create one with the name indicated in this option.",
  },
);
const reqTimeout = i18n.translate(
  'wazuh.common.config.equivalences.reqTimeout',
  {
    defaultMessage:
      'Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.',
  },
);
const ipSelector = i18n.translate(
  'wazuh.common.config.equivalences.ipSelector',
  {
    defaultMessage:
      'Define if the user is allowed to change the selected index pattern directly from the top menu bar.',
  },
);
const ipIgnore = i18n.translate('wazuh.common.config.equivalences.ipIgnore', {
  defaultMessage:
    'Disable certain index pattern names from being available in index pattern selector from the Wazuh app.',
});
const cornPrefix = i18n.translate(
  'wazuh.common.config.equivalences.cornPrefix',
  {
    defaultMessage: 'Define the index prefix of predefined jobs.',
  },
);
const sampleAlertPrefix = i18n.translate(
  'wazuh.common.config.equivalences.sampleAlertPrefix',
  {
    defaultMessage:
      'Define the index name prefix of sample alerts. It must match the template used by the index pattern to avoid unknown fields in dashboards.',
  },
);
const hideManager = i18n.translate(
  'wazuh.common.config.equivalences.hideManager',
  {
    defaultMessage: 'Hide the alerts of the manager in every dashboard.',
  },
);
const logLevel = i18n.translate('wazuh.common.config.equivalences.logLevel', {
  defaultMessage: 'Logging level of the App.',
});
const enrollmentDNS = i18n.translate(
  'wazuh.common.config.equivalences.enrollmentDNS',
  {
    defaultMessage:
      'Specifies the Wazuh registration server, used for the agent enrollment.',
  },
);
const healthIndexPattern = i18n.translate(
  'wazuh.common.config.equivalences.healthIndexPattern',
  {
    defaultMessage:
      'Enable or disable the index pattern health check when opening the app.',
  },
);
const healthIndexTemplate = i18n.translate(
  'wazuh.common.config.equivalences.healthIndexTemplate',
  {
    defaultMessage:
      'Enable or disable the template health check when opening the app.',
  },
);
const healthAPIConnection = i18n.translate(
  'wazuh.common.config.equivalences.healthAPIConnection',
  {
    defaultMessage:
      'Enable or disable the API health check when opening the app.',
  },
);
const healthAPIVersion = i18n.translate(
  'wazuh.common.config.equivalences.healthAPIVersion',
  {
    defaultMessage:
      'Enable or disable the setup health check when opening the app.',
  },
);
const healthKnownFields = i18n.translate(
  'wazuh.common.config.equivalences.healthKnownFields',
  {
    defaultMessage:
      'Enable or disable the known fields health check when opening the app.',
  },
);
const removeMeta1 = i18n.translate(
  'wazuh.common.config.equivalences.removeMeta1',
  {
    defaultMessage: 'Change the default value of the',
  },
);
const removeMeta3 = i18n.translate(
  'wazuh.common.config.equivalences.removeMeta3',
  {
    defaultMessage: 'metaField configuration',
  },
);
const removeMeta4 = i18n.translate(
  'wazuh.common.config.equivalences.removeMeta4',
  {
    defaultMessage: 'timeFilter configuration',
  },
);
const removeMeta5 = i18n.translate(
  'wazuh.common.config.equivalences.removeMeta5',
  {
    defaultMessage: 'max buckets configuration',
  },
);
const monitoringStatus = i18n.translate(
  'wazuh.common.config.equivalences.monitoringStatus',
  {
    defaultMessage:
      'Enable or disable the wazuh-monitoring index creation and/or visualization.',
  },
);
const monitoringFrquency = i18n.translate(
  'wazuh.common.config.equivalences.monitoringFrquency',
  {
    defaultMessage:
      'Frequency, in seconds, of API requests to get the state of the agents and create a new document in the wazuh-monitoring index with this data.',
  },
);
const monitoringIndex = i18n.translate(
  'wazuh.common.config.equivalences.monitoringIndex',
  {
    defaultMessage:
      'Define the number of shards to use for the wazuh-monitoring-* indices.',
  },
);
const monitoringIndexRep = i18n.translate(
  'wazuh.common.config.equivalences.monitoringIndexRep',
  {
    defaultMessage:
      'Define the number of replicas to use for the wazuh-monitoring-* indices.',
  },
);
const monitoringIndexCreation = i18n.translate(
  'wazuh.common.config.equivalences.monitoringIndexCreation',
  {
    defaultMessage:
      'Define the interval in which a new wazuh-monitoring index will be created.',
  },
);
const monitoringIndexPattern = i18n.translate(
  'wazuh.common.config.equivalences.monitoringIndexPattern',
  {
    defaultMessage: 'Default index pattern to use for Wazuh monitoring.',
  },
);
const statStatus = i18n.translate(
  'wazuh.common.config.equivalences.statStatus',
  {
    defaultMessage: 'Enable or disable the statistics tasks.',
  },
);
const statAPIs = i18n.translate('wazuh.common.config.equivalences.statAPIs', {
  defaultMessage:
    'Enter the ID of the hosts you want to save data from, leave this empty to run the task on every host.',
});
const statInterval = i18n.translate(
  'wazuh.common.config.equivalences.statInterval',
  {
    defaultMessage:
      'Define the frequency of task execution using cron schedule expressions.',
  },
);
const statIndexName = i18n.translate(
  'wazuh.common.config.equivalences.statIndexName',
  {
    defaultMessage:
      'Define the name of the index in which the documents will be saved.',
  },
);
const statIndexCreation = i18n.translate(
  'wazuh.common.config.equivalences.statIndexCreation',
  {
    defaultMessage: 'Define the interval in which a new index will be created.',
  },
);
const statIndexShards = i18n.translate(
  'wazuh.common.config.equivalences.statIndexShards',
  {
    defaultMessage:
      'Define the number of shards to use for the statistics indices.',
  },
);
const statIndexReplicas = i18n.translate(
  'wazuh.common.config.equivalences.statIndexReplicas',
  {
    defaultMessage:
      'Define the number of replicas to use for the statistics indices.',
  },
);
const logo1 = i18n.translate('wazuh.common.config.equivalences.logo1', {
  defaultMessage: 'Set the name of the app logo stored at',
});
const logo3 = i18n.translate('wazuh.common.config.equivalences.logo3', {
  defaultMessage: 'Set the name of the sidebar logo stored at',
});
const logo4 = i18n.translate('wazuh.common.config.equivalences.logo4', {
  defaultMessage: 'Set the name of the health-check logo stored at',
});
const logo5 = i18n.translate('wazuh.common.config.equivalences.logo5', {
  defaultMessage: 'Set the name of the reports logo (.png) stored at',
});
const title1 = i18n.translate('wazuh.common.config.equivalences.title1', {
  defaultMessage: 'Index pattern',
});
const title3 = i18n.translate('wazuh.common.config.equivalences.title3', {
  defaultMessage: 'Request timeout',
});
const title4 = i18n.translate('wazuh.common.config.equivalences.title4', {
  defaultMessage: 'IP selector',
});
const title5 = i18n.translate('wazuh.common.config.equivalences.title5', {
  defaultMessage: 'IP ignore',
});
const title6 = i18n.translate('wazuh.common.config.equivalences.title6', {
  defaultMessage: 'Cron prefix',
});
const title7 = i18n.translate('wazuh.common.config.equivalences.title7', {
  defaultMessage: 'Sample alerts prefix',
});
const title8 = i18n.translate('wazuh.common.config.equivalences.title8', {
  defaultMessage: 'Hide manager alerts',
});
const title9 = i18n.translate('wazuh.common.config.equivalences.title9', {
  defaultMessage: 'Log level',
});
const title10 = i18n.translate('wazuh.common.config.equivalences.title10', {
  defaultMessage: 'Enrollment DNS',
});
const title11 = i18n.translate('wazuh.common.config.equivalences.title11', {
  defaultMessage: 'Health Check',
});
const title13 = i18n.translate('wazuh.common.config.equivalences.title13', {
  defaultMessage: 'Index pattern',
});
const title14 = i18n.translate('wazuh.common.config.equivalences.title14', {
  defaultMessage: 'Index template',
});
const title15 = i18n.translate('wazuh.common.config.equivalences.title15', {
  defaultMessage: 'API connection',
});
const title16 = i18n.translate('wazuh.common.config.equivalences.title16', {
  defaultMessage: 'API version',
});
const title17 = i18n.translate('wazuh.common.config.equivalences.title17', {
  defaultMessage: 'Known fields',
});
const title18 = i18n.translate('wazuh.common.config.equivalences.title18', {
  defaultMessage: 'Remove meta fields',
});
const title19 = i18n.translate('wazuh.common.config.equivalences.title19', {
  defaultMessage: 'Set time filter to 24h',
});
const title30 = i18n.translate('wazuh.common.config.equivalences.title30', {
  defaultMessage: 'Set max buckets to 200000',
});
const title31 = i18n.translate('wazuh.common.config.equivalences.title31', {
  defaultMessage: 'General',
});
const title33 = i18n.translate('wazuh.common.config.equivalences.title33', {
  defaultMessage: 'Security',
});
const title34 = i18n.translate('wazuh.common.config.equivalences.title34', {
  defaultMessage: 'Monitoring',
});
const title35 = i18n.translate('wazuh.common.config.equivalences.title35', {
  defaultMessage: 'Statistics',
});
const title36 = i18n.translate('wazuh.common.config.equivalences.title36', {
  defaultMessage: 'Logo Customization',
});
const title37 = i18n.translate('wazuh.common.config.equivalences.title37', {
  defaultMessage: 'Status',
});
const title38 = i18n.translate('wazuh.common.config.equivalences.title38', {
  defaultMessage: 'Frequency',
});
const title39 = i18n.translate('wazuh.common.config.equivalences.title39', {
  defaultMessage: 'Index shards',
});
const title40 = i18n.translate('wazuh.common.config.equivalences.title40', {
  defaultMessage: 'Index replicas',
});
const title41 = i18n.translate('wazuh.common.config.equivalences.title41', {
  defaultMessage: 'Index creation',
});
const title43 = i18n.translate('wazuh.common.config.equivalences.title43', {
  defaultMessage: 'Index pattern',
});
const title44 = i18n.translate('wazuh.common.config.equivalences.title44', {
  defaultMessage: 'Status',
});
const title45 = i18n.translate('wazuh.common.config.equivalences.title45', {
  defaultMessage: 'Includes apis',
});
const title46 = i18n.translate('wazuh.common.config.equivalences.title46', {
  defaultMessage: 'Interval',
});
const title47 = i18n.translate('wazuh.common.config.equivalences.title47', {
  defaultMessage: 'Index name',
});
const title48 = i18n.translate('wazuh.common.config.equivalences.title48', {
  defaultMessage: 'Index creation',
});
const title49 = i18n.translate('wazuh.common.config.equivalences.title49', {
  defaultMessage: 'Index shards',
});
const title50 = i18n.translate('wazuh.common.config.equivalences.title50', {
  defaultMessage: 'Index replicas',
});
const title51 = i18n.translate('wazuh.common.config.equivalences.title51', {
  defaultMessage: 'Logo App',
});
const title53 = i18n.translate('wazuh.common.config.equivalences.title53', {
  defaultMessage: 'Logo Sidebar',
});
const title54 = i18n.translate('wazuh.common.config.equivalences.title54', {
  defaultMessage: 'Logo Health Check',
});
const title55 = i18n.translate('wazuh.common.config.equivalences.title55', {
  defaultMessage: 'Logo Reports',
});
export const configEquivalences = {
  pattern: patternIndex,
  'customization.logo.app': `${logo1} ${ASSETS_PUBLIC_URL}`,
  'customization.logo.sidebar': `${logo3} ${ASSETS_PUBLIC_URL}`,
  'customization.logo.healthcheck': `${logo4} ${ASSETS_PUBLIC_URL}`,
  'customization.logo.reports': `${logo5} ${ASSETS_PUBLIC_URL}`,
  'checks.pattern': healthIndexPattern,
  'checks.template': healthIndexTemplate,
  'checks.api': healthAPIConnection,
  'checks.setup': healthAPIVersion,
  'checks.fields': healthKnownFields,
  'checks.metaFields': `${removeMeta1} ${PLUGIN_PLATFORM_NAME} ${removeMeta3}`,
  'checks.timeFilter': `${removeMeta1} ${PLUGIN_PLATFORM_NAME}${removeMeta4} `,
  'checks.maxBuckets': `${removeMeta1} ${PLUGIN_PLATFORM_NAME} ${removeMeta5}`,
  'extensions.pci': 'Enable or disable the PCI DSS tab on Overview and Agents.',
  'extensions.gdpr': 'Enable or disable the GDPR tab on Overview and Agents.',
  'extensions.hipaa': 'Enable or disable the HIPAA tab on Overview and Agents.',
  'extensions.nist':
    'Enable or disable the NIST 800-53 tab on Overview and Agents.',
  'extensions.tsc': 'Enable or disable the TSC tab on Overview and Agents.',
  'extensions.audit': 'Enable or disable the Audit tab on Overview and Agents.',
  'extensions.oscap':
    'Enable or disable the Open SCAP tab on Overview and Agents.',
  'extensions.ciscat':
    'Enable or disable the CIS-CAT tab on Overview and Agents.',
  'extensions.aws': 'Enable or disable the Amazon (AWS) tab on Overview.',
  'extensions.gcp':
    'Enable or disable the Google Cloud Platform tab on Overview.',
  'extensions.virustotal':
    'Enable or disable the VirusTotal tab on Overview and Agents.',
  'extensions.osquery':
    'Enable or disable the Osquery tab on Overview and Agents.',
  'extensions.mitre': 'Enable or disable the MITRE tab on Overview and Agents.',
  'extensions.docker':
    'Enable or disable the Docker listener tab on Overview and Agents.',
  timeout: reqTimeout,
  'ip.selector': ipSelector,
  'ip.ignore': ipIgnore,
  'wazuh.monitoring.enabled': monitoringStatus,
  'wazuh.monitoring.frequency': monitoringFrquency,
  'wazuh.monitoring.shards': monitoringIndex,
  'wazuh.monitoring.replicas': monitoringIndexRep,
  'wazuh.monitoring.creation': monitoringIndexCreation,
  'wazuh.monitoring.pattern': monitoringIndexPattern,
  hideManagerAlerts: hideManager,
  'logs.level': logLevel,
  'enrollment.dns': enrollmentDNS,
  'enrollment.password':
    'Specifies the password used to authenticate during the agent enrollment.',
  'cron.prefix': cornPrefix,
  'cron.statistics.status': statStatus,
  'cron.statistics.apis': statAPIs,
  'cron.statistics.interval': statInterval,
  'cron.statistics.index.name': statIndexName,
  'cron.statistics.index.creation': statIndexCreation,
  'cron.statistics.index.shards': statIndexShards,
  'cron.statistics.index.replicas': statIndexReplicas,
  'alerts.sample.prefix': sampleAlertPrefix,
};

export const nameEquivalence = {
  pattern: title1,
  'customization.logo.app': title51,
  'customization.logo.sidebar': title53,
  'customization.logo.healthcheck': title54,
  'customization.logo.reports': title55,
  'checks.pattern': title13,
  'checks.template': title14,
  'checks.api': title15,
  'checks.setup': title16,
  'checks.fields': title17,
  'checks.metaFields': title18,
  'checks.timeFilter': title19,
  'checks.maxBuckets': title30,
  timeout: title3,
  'ip.selector': title4,
  'ip.ignore': title5,
  'xpack.rbac.enabled': 'X-Pack RBAC',
  'wazuh.monitoring.enabled': title37,
  'wazuh.monitoring.frequency': title38,
  'wazuh.monitoring.shards': title39,
  'wazuh.monitoring.replicas': title40,
  'wazuh.monitoring.creation': title41,
  'wazuh.monitoring.pattern': title43,
  hideManagerAlerts: title8,
  'logs.level': title9,
  'enrollment.dns': title10,
  'cron.prefix': title6,
  'cron.statistics.status': title44,
  'cron.statistics.apis': title45,
  'cron.statistics.interval': title46,
  'cron.statistics.index.name': title47,
  'cron.statistics.index.creation': title48,
  'cron.statistics.index.shards': title49,
  'cron.statistics.index.replicas': title50,
  'alerts.sample.prefix': title7,
};

const HEALTH_CHECK = title11;
const GENERAL = title31;
const SECURITY = title33;
const MONITORING = title34;
const STATISTICS = title35;
const CUSTOMIZATION = title36;
export const categoriesNames = [
  HEALTH_CHECK,
  GENERAL,
  SECURITY,
  MONITORING,
  STATISTICS,
  CUSTOMIZATION,
];

export const categoriesEquivalence = {
  pattern: GENERAL,
  'customization.logo.app': CUSTOMIZATION,
  'customization.logo.sidebar': CUSTOMIZATION,
  'customization.logo.healthcheck': CUSTOMIZATION,
  'customization.logo.reports': CUSTOMIZATION,
  'checks.pattern': HEALTH_CHECK,
  'checks.template': HEALTH_CHECK,
  'checks.api': HEALTH_CHECK,
  'checks.setup': HEALTH_CHECK,
  'checks.fields': HEALTH_CHECK,
  'checks.metaFields': HEALTH_CHECK,
  'checks.timeFilter': HEALTH_CHECK,
  'checks.maxBuckets': HEALTH_CHECK,
  timeout: GENERAL,
  'ip.selector': GENERAL,
  'ip.ignore': GENERAL,
  'wazuh.monitoring.enabled': MONITORING,
  'wazuh.monitoring.frequency': MONITORING,
  'wazuh.monitoring.shards': MONITORING,
  'wazuh.monitoring.replicas': MONITORING,
  'wazuh.monitoring.creation': MONITORING,
  'wazuh.monitoring.pattern': MONITORING,
  hideManagerAlerts: GENERAL,
  'logs.level': GENERAL,
  'enrollment.dns': GENERAL,
  'cron.prefix': GENERAL,
  'cron.statistics.status': STATISTICS,
  'cron.statistics.apis': STATISTICS,
  'cron.statistics.interval': STATISTICS,
  'cron.statistics.index.name': STATISTICS,
  'cron.statistics.index.creation': STATISTICS,
  'cron.statistics.index.shards': STATISTICS,
  'cron.statistics.index.replicas': STATISTICS,
  'alerts.sample.prefix': GENERAL,
};

const TEXT = 'text';
const NUMBER = 'number';
const LIST = 'list';
const BOOLEAN = 'boolean';
const ARRAY = 'array';
const INTERVAL = 'interval';

export const formEquivalence = {
  pattern: { type: TEXT },
  'customization.logo.app': { type: TEXT },
  'customization.logo.sidebar': { type: TEXT },
  'customization.logo.healthcheck': { type: TEXT },
  'customization.logo.reports': { type: TEXT },
  'checks.pattern': { type: BOOLEAN },
  'checks.template': { type: BOOLEAN },
  'checks.api': { type: BOOLEAN },
  'checks.setup': { type: BOOLEAN },
  'checks.fields': { type: BOOLEAN },
  'checks.metaFields': { type: BOOLEAN },
  'checks.timeFilter': { type: BOOLEAN },
  'checks.maxBuckets': { type: BOOLEAN },
  timeout: { type: NUMBER },
  'ip.selector': { type: BOOLEAN },
  'ip.ignore': { type: ARRAY },
  'xpack.rbac.enabled': { type: BOOLEAN },
  'wazuh.monitoring.enabled': { type: BOOLEAN },
  'wazuh.monitoring.frequency': { type: NUMBER },
  'wazuh.monitoring.shards': { type: NUMBER },
  'wazuh.monitoring.replicas': { type: NUMBER },
  'wazuh.monitoring.creation': {
    type: LIST,
    params: {
      options: [
        { text: 'Hourly', value: 'h' },
        { text: 'Daily', value: 'd' },
        { text: 'Weekly', value: 'w' },
        { text: 'Monthly', value: 'm' },
      ],
    },
  },
  'wazuh.monitoring.pattern': { type: TEXT },
  hideManagerAlerts: { type: BOOLEAN },
  'logs.level': {
    type: LIST,
    params: {
      options: [
        { text: 'Info', value: 'info' },
        { text: 'Debug', value: 'debug' },
      ],
    },
  },
  'enrollment.dns': { type: TEXT },
  'cron.prefix': { type: TEXT },
  'cron.statistics.status': { type: BOOLEAN },
  'cron.statistics.apis': { type: ARRAY },
  'cron.statistics.interval': { type: INTERVAL },
  'cron.statistics.index.name': { type: TEXT },
  'cron.statistics.index.creation': {
    type: LIST,
    params: {
      options: [
        { text: 'Hourly', value: 'h' },
        { text: 'Daily', value: 'd' },
        { text: 'Weekly', value: 'w' },
        { text: 'Monthly', value: 'm' },
      ],
    },
  },
  'cron.statistics.index.shards': { type: NUMBER },
  'cron.statistics.index.replicas': { type: NUMBER },
  'alerts.sample.prefix': { type: TEXT },
};
