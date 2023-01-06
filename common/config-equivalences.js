import { ASSETS_PUBLIC_URL, PLUGIN_PLATFORM_NAME } from './constants';
import { i18n } from '@kbn/i18n';
const descp1 = i18n.translate('wazuh.common.config.equivalence.descp1', {
  defaultMessage:
    "Default index pattern to use on the app. If there's no valid index pattern, the app will automatically create one with the name indicated in this option.",
});
const descp2 = i18n.translate('wazuh.common.config.equivalence.descp2', {
  defaultMessage: 'customization.logo.app',
});
const descp3 = i18n.translate('wazuh.common.config.equivalence.descp3', {
  defaultMessage: 'Set the name of the app logo stored at',
});
const descp4 = i18n.translate('wazuh.common.config.equivalence.descp4', {
  defaultMessage: 'customization.logo.sidebar',
});
const descp5 = i18n.translate('wazuh.common.config.equivalence.descp5', {
  defaultMessage: 'Set the name of the sidebar logo stored at',
});
const descp6 = i18n.translate('wazuh.common.config.equivalence.descp6', {
  defaultMessage: 'customization.logo.healthcheck',
});
const descp7 = i18n.translate('wazuh.common.config.equivalence.descp7', {
  defaultMessage: 'Set the name of the health-check logo stored at',
});
const descp8 = i18n.translate('wazuh.common.config.equivalence.descp8', {
  defaultMessage: 'customization.logo.reports',
});
const descp9 = i18n.translate('wazuh.common.config.equivalence.descp9', {
  defaultMessage: 'Set the name of the reports logo (.png) stored at',
});
const descp10 = i18n.translate('wazuh.common.config.equivalence.descp', {
  defaultMessage: 'checks.pattern',
});
const descp11 = i18n.translate('wazuh.common.config.equivalence.descp11', {
  defaultMessage: 'checks.template',
});
const descp12 = i18n.translate('wazuh.common.config.equivalence.descp12', {
  defaultMessage:
    'Enable or disable the template health check when opening the app.',
});
const descp13 = i18n.translate('wazuh.common.config.equivalence.descp13', {
  defaultMessage: 'checks.api',
});
const descp14 = i18n.translate('wazuh.common.config.equivalence.descp14', {
  defaultMessage:
    'Enable or disable the API health check when opening the app.',
});
const descp15 = i18n.translate('wazuh.common.config.equivalence.descp15', {
  defaultMessage: 'checks.setup',
});
const descp16 = i18n.translate('wazuh.common.config.equivalence.descp16', {
  defaultMessage:
    'Enable or disable the setup health check when opening the app.',
});
const descp17 = i18n.translate('wazuh.common.config.equivalence.descp17', {
  defaultMessage: 'checks.fields',
});
const descp18 = i18n.translate('wazuh.common.config.equivalence.descp18', {
  defaultMessage:
    'Enable or disable the known fields health check when opening the app.',
});
const descp19 = i18n.translate('wazuh.common.config.equivalence.descp19', {
  defaultMessage: 'checks.metaFields',
});
const descp20 = i18n.translate('wazuh.common.config.equivalence.descp20', {
  defaultMessage: 'Change the default value of the',
});
const descp21 = i18n.translate('wazuh.common.config.equivalence.descp21', {
  defaultMessage: 'metaField configuration',
});
const descp22 = i18n.translate('wazuh.common.config.equivalence.descp22', {
  defaultMessage: 'checks.timeFilter',
});
const descp23 = i18n.translate('wazuh.common.config.equivalence.descp23', {
  defaultMessage: 'Change the default value of the',
});
const descp24 = i18n.translate('wazuh.common.config.equivalence.descp24', {
  defaultMessage: 'timeFilter configuration',
});
const descp25 = i18n.translate('wazuh.common.config.equivalence.descp25', {
  defaultMessage: 'checks.maxBuckets',
});
const descp26 = i18n.translate('wazuh.common.config.equivalence.descp26', {
  defaultMessage: 'Change the default value of the',
});
const descp27 = i18n.translate('wazuh.common.config.equivalence.descp27', {
  defaultMessage: 'max buckets configuration',
});
const descp28 = i18n.translate('wazuh.ccommon.config.equivalence.descp28', {
  defaultMessage: 'extensions.pci',
});
const descp29 = i18n.translate('wazuh.ccommon.config.equivalence.descp29', {
  defaultMessage: 'Enable or disable the PCI DSS tab on Overview and Agents.',
});
const descp30 = i18n.translate('wazuh.ccommon.config.equivalence.descp30', {
  defaultMessage: 'extensions.gdpr',
});
const descp31 = i18n.translate('wazuh.ccommon.config.equivalence.descp31', {
  defaultMessage: 'Enable or disable the GDPR tab on Overview and Agents.',
});
const descp32 = i18n.translate('wazuh.ccommon.config.equivalence.descp32', {
  defaultMessage: 'extensions.hipaa',
});
const descp33 = i18n.translate('wazuh.ccommon.config.equivalence.descp33', {
  defaultMessage: 'Enable or disable the HIPAA tab on Overview and Agents.',
});
const descp34 = i18n.translate('wazuh.ccommon.config.equivalence.descp34', {
  defaultMessage: 'extensions.nist',
});
const descp35 = i18n.translate('wazuh.ccommon.config.equivalence.descp35', {
  defaultMessage:
    'Enable or disable the NIST 800-53 tab on Overview and Agents.',
});
const descp36 = i18n.translate('wazuh.ccommon.config.equivalence.descp36', {
  defaultMessage: 'extensions.tsc',
});
const descp37 = i18n.translate('wazuh.ccommon.config.equivalence.descp37', {
  defaultMessage: 'Enable or disable the TSC tab on Overview and Agents.',
});
const descp38 = i18n.translate('wazuh.ccommon.config.equivalence.descp38', {
  defaultMessage: 'extensions.audit',
});
const descp39 = i18n.translate('wazuh.ccommon.config.equivalence.descp39', {
  defaultMessage: 'Enable or disable the Audit tab on Overview and Agents.',
});
const descp40 = i18n.translate('wazuh.ccommon.config.equivalence.descp40', {
  defaultMessage: 'extensions.oscap',
});
const descp41 = i18n.translate('wazuh.ccommon.config.equivalence.descp41', {
  defaultMessage: 'Enable or disable the Open SCAP tab on Overview and Agents.',
});
const descp42 = i18n.translate('wazuh.ccommon.config.equivalence.descp42', {
  defaultMessage: 'extensions.ciscat',
});
const descp43 = i18n.translate('wazuh.ccommon.config.equivalence.descp43', {
  defaultMessage: 'Enable or disable the CIS-CAT tab on Overview and Agents.',
});
const descp44 = i18n.translate('wazuh.ccommon.config.equivalence.descp44', {
  defaultMessage: 'extensions.aws',
});
const descp45 = i18n.translate('wazuh.ccommon.config.equivalence.descp45', {
  defaultMessage: 'Enable or disable the Amazon (AWS) tab on Overview.',
});
const descp46 = i18n.translate('wazuh.ccommon.config.equivalence.descp46', {
  defaultMessage: 'extensions.gcp',
});
const descp47 = i18n.translate('wazuh.ccommon.config.equivalence.descp47', {
  defaultMessage:
    'Enable or disable the Google Cloud Platform tab on Overview.',
});
const descp48 = i18n.translate('wazuh.ccommon.config.equivalence.descp48', {
  defaultMessage: 'extensions.virustotal',
});
const descp49 = i18n.translate('wazuh.ccommon.config.equivalence.descp49', {
  defaultMessage:
    'Enable or disable the VirusTotal tab on Overview and Agents.',
});
const descp50 = i18n.translate('wazuh.ccommon.config.equivalence.descp50', {
  defaultMessage: 'extensions.osquery',
});
const descp51 = i18n.translate('wazuh.ccommon.config.equivalence.descp51', {
  defaultMessage: 'Enable or disable the Osquery tab on Overview and Agents.',
});
const descp52 = i18n.translate('wazuh.ccommon.config.equivalence.descp52', {
  defaultMessage: 'extensions.mitre',
});
const descp53 = i18n.translate('wazuh.ccommon.config.equivalence.descp53', {
  defaultMessage: 'Enable or disable the MITRE tab on Overview and Agents.',
});
const descp54 = i18n.translate('wazuh.ccommon.config.equivalence.descp54', {
  defaultMessage: 'extensions.docker',
});
const descp55 = i18n.translate('wazuh.ccommon.config.equivalence.descp55', {
  defaultMessage:
    'Enable or disable the Docker listener tab on Overview and Agents.',
});
const descp56 = i18n.translate('wazuh.ccommon.config.equivalence.descp56', {
  defaultMessage:
    'Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.',
});
const descp57 = i18n.translate('wazuh.ccommon.config.equivalence.descp57', {
  defaultMessage: 'ip.selector',
});
const descp58 = i18n.translate('wazuh.ccommon.config.equivalence.descp58', {
  defaultMessage:
    'Define if the user is allowed to change the selected index pattern directly from the top menu bar.',
});
const descp59 = i18n.translate('wazuh.ccommon.config.equivalence.descp59', {
  defaultMessage: 'ip.ignore',
});
const descp60 = i18n.translate('wazuh.ccommon.config.equivalence.descp60', {
  defaultMessage:
    'Disable certain index pattern names from being available in index pattern selector from the Wazuh app.',
});
const descp61 = i18n.translate('wazuh.ccommon.config.equivalence.descp61', {
  defaultMessage: 'wazuh.monitoring.enabled',
});
const descp62 = i18n.translate('wazuh.ccommon.config.equivalence.descp62', {
  defaultMessage:
    'Enable or disable the wazuh-monitoring index creation and/or visualization.',
});
const descp63 = i18n.translate('wazuh.ccommon.config.equivalence.descp63', {
  defaultMessage: 'wazuh.monitoring.frequency',
});
const descp64 = i18n.translate('wazuh.ccommon.config.equivalence.descp64', {
  defaultMessage:
    'Frequency, in seconds, of API requests to get the state of the agents and create a new document in the wazuh-monitoring index with this data.',
});
const descp65 = i18n.translate('wazuh.ccommon.config.equivalence.descp65', {
  defaultMessage: 'wazuh.monitoring.shards',
});
const descp66 = i18n.translate('wazuh.ccommon.config.equivalence.descp66', {
  defaultMessage:
    'Define the number of shards to use for the wazuh-monitoring-* indices.',
});
const descp67 = i18n.translate('wazuh.ccommon.config.equivalence.descp67', {
  defaultMessage: 'wazuh.monitoring.replicas',
});
const descp68 = i18n.translate('wazuh.ccommon.config.equivalence.descp68', {
  defaultMessage: 'wazuh.monitoring.creation',
});
const descp69 = i18n.translate('wazuh.ccommon.config.equivalence.descp69', {
  defaultMessage:
    'Define the interval in which a new wazuh-monitoring index will be created.',
});
const descp70 = i18n.translate('wazuh.ccommon.config.equivalence.descp70', {
  defaultMessage: 'wazuh.monitoring.pattern',
});
const descp71 = i18n.translate('wazuh.ccommon.config.equivalence.descp71', {
  defaultMessage: 'Default index pattern to use for Wazuh monitoring.',
});
const descp72 = i18n.translate('wazuh.ccommon.config.equivalence.descp72', {
  defaultMessage: 'Rule level by tactic',
});
const descp73 = i18n.translate('wazuh.ccommon.config.equivalence.descp73', {
  defaultMessage: 'Hide the alerts of the manager in every dashboard.',
});
const descp74 = i18n.translate('wazuh.ccommon.config.equivalence.descp74', {
  defaultMessage: 'logs.level',
});
const descp75 = i18n.translate('wazuh.ccommon.config.equivalence.descp75', {
  defaultMessage: 'Logging level of the App.',
});
const descp76 = i18n.translate('wazuh.ccommon.config.equivalence.descp76', {
  defaultMessage: 'enrollment.dns',
});
const descp77 = i18n.translate('wazuh.ccommon.config.equivalence.descp77', {
  defaultMessage:
    'Specifies the Wazuh registration server, used for the agent enrollment.',
});
const descp78 = i18n.translate('wazuh.ccommon.config.equivalence.descp78', {
  defaultMessage: 'enrollment.password',
});
const descp79 = i18n.translate('wazuh.ccommon.config.equivalence.descp79', {
  defaultMessage:
    'Specifies the password used to authenticate during the agent enrollment.',
});
const descp80 = i18n.translate('wazuh.ccommon.config.equivalence.descp80', {
  defaultMessage: 'cron.prefix',
});
const descp81 = i18n.translate('wazuh.ccommon.config.equivalence.descp81', {
  defaultMessage: 'Define the index prefix of predefined jobs.',
});
const descp82 = i18n.translate('wazuh.ccommon.config.equivalence.descp82', {
  defaultMessage: 'cron.statistics.status',
});
const descp83 = i18n.translate('wazuh.ccommon.config.equivalence.descp83', {
  defaultMessage: 'Enable or disable the statistics tasks.',
});
const descp84 = i18n.translate('wazuh.ccommon.config.equivalence.descp84', {
  defaultMessage: 'cron.statistics.apis',
});
const descp85 = i18n.translate('wazuh.ccommon.config.equivalence.descp85', {
  defaultMessage:
    'Enter the ID of the hosts you want to save data from, leave this empty to run the task on every host.',
});
const descp86 = i18n.translate('wazuh.ccommon.config.equivalence.descp86', {
  defaultMessage: 'cron.statistics.interval',
});
const descp87 = i18n.translate('wazuh.ccommon.config.equivalence.descp87', {
  defaultMessage:
    'Define the frequency of task execution using cron schedule expressions.',
});
const descp88 = i18n.translate('wazuh.ccommon.config.equivalence.descp88', {
  defaultMessage: 'cron.statistics.index.name',
});
const descp89 = i18n.translate('wazuh.ccommon.config.equivalence.descp89', {
  defaultMessage:
    'Define the name of the index in which the documents will be saved.',
});
const descp90 = i18n.translate('wazuh.ccommon.config.equivalence.descp90', {
  defaultMessage: 'cron.statistics.index.creation',
});
const descp91 = i18n.translate('wazuh.ccommon.config.equivalence.descp91', {
  defaultMessage: 'Define the interval in which a new index will be created.',
});
const descp92 = i18n.translate('wazuh.ccommon.config.equivalence.descp92', {
  defaultMessage: 'cron.statistics.index.shards',
});
const descp93 = i18n.translate('wazuh.ccommon.config.equivalence.descp93', {
  defaultMessage:
    'Define the number of shards to use for the statistics indices.',
});
const descp94 = i18n.translate('wazuh.ccommon.config.equivalence.descp94', {
  defaultMessage: 'cron.statistics.index.replicas',
});
const descp95 = i18n.translate('wazuh.ccommon.config.equivalence.descp95', {
  defaultMessage:
    'Define the number of replicas to use for the statistics indices.',
});
const descp96 = i18n.translate('wazuh.ccommon.config.equivalence.descp96', {
  defaultMessage: 'alerts.sample.prefix',
});
const descp97 = i18n.translate('wazuh.ccommon.config.equivalence.descp97', {
  defaultMessage:
    'Define the index name prefix of sample alerts. It must match the template used by the index pattern to avoid unknown fields in dashboards.',
});
const pattern1 = i18n.translate('wazuh.common.config.equivalence.pattern1', {
  defaultMessage: 'Index pattern',
});
const pattern2 = i18n.translate('wazuh.common.config.equivalence.pattern2', {
  defaultMessage: 'customization.logo.app',
});
const pattern3 = i18n.translate('wazuh.common.config.equivalence.pattern3', {
  defaultMessage: 'Logo App',
});
const pattern4 = i18n.translate('wazuh.common.config.equivalence.pattern4', {
  defaultMessage: 'customization.logo.sidebar',
});
const pattern5 = i18n.translate('wazuh.common.config.equivalence.pattern5', {
  defaultMessage: 'Logo Sidebar',
});
const pattern6 = i18n.translate('wazuh.common.config.equivalence.pattern6', {
  defaultMessage: 'customization.logo.healthcheck',
});
const pattern7 = i18n.translate('wazuh.common.config.equivalence.pattern7', {
  defaultMessage: 'Logo Health Check',
});
const pattern8 = i18n.translate('wazuh.common.config.equivalence.pattern8', {
  defaultMessage: 'customization.logo.reports',
});
const pattern9 = i18n.translate('wazuh.common.config.equivalence.pattern9', {
  defaultMessage: 'Logo Reports',
});
const pattern10 = i18n.translate('wazuh.common.config.equivalence.pattern10', {
  defaultMessage: 'checks.pattern',
});
const pattern11 = i18n.translate('wazuh.common.config.equivalence.pattern11', {
  defaultMessage: 'Index pattern',
});
const pattern12 = i18n.translate('wazuh.common.config.equivalence.pattern12', {
  defaultMessage: 'checks.template',
});
const pattern13 = i18n.translate('wazuh.common.config.equivalence.pattern13', {
  defaultMessage: 'Index template',
});
const pattern14 = i18n.translate('wazuh.common.config.equivalence.pattern14', {
  defaultMessage: 'checks.api',
});
const pattern15 = i18n.translate('wazuh.common.config.equivalence.pattern15', {
  defaultMessage: 'API connection',
});
const pattern16 = i18n.translate('wazuh.common.config.equivalence.pattern16', {
  defaultMessage: 'checks.setup',
});
const pattern17 = i18n.translate('wazuh.common.config.equivalence.pattern17', {
  defaultMessage: 'API version',
});
const pattern18 = i18n.translate('wazuh.common.config.equivalence.pattern18', {
  defaultMessage: 'checks.fields',
});
const pattern19 = i18n.translate('wazuh.common.config.equivalence.pattern19', {
  defaultMessage: 'Known fields',
});
const pattern20 = i18n.translate('wazuh.common.config.equivalence.pattern20', {
  defaultMessage: 'checks.metaFields',
});
const pattern21 = i18n.translate('wazuh.common.config.equivalence.pattern21', {
  defaultMessage: 'Remove meta fields',
});
const pattern22 = i18n.translate('wazuh.common.config.equivalence.pattern22', {
  defaultMessage: 'checks.timeFilter',
});
const pattern23 = i18n.translate('wazuh.common.config.equivalence.pattern23', {
  defaultMessage: 'Set time filter to 24h',
});
const pattern24 = i18n.translate('wazuh.common.config.equivalence.pattern24', {
  defaultMessage: 'checks.maxBuckets',
});
const pattern25 = i18n.translate('wazuh.common.config.equivalence.pattern25', {
  defaultMessage: 'Set max buckets to 200000',
});
const timeOut1 = i18n.translate('wazuh.common.config.equivalence.timeOut1', {
  defaultMessage: 'Request timeout',
});
const timeOut2 = i18n.translate('wazuh.common.config.equivalence.timeOut2', {
  defaultMessage: 'ip.selector',
});
const timeOut3 = i18n.translate('wazuh.common.config.equivalence.timeOut3', {
  defaultMessage: 'IP selector',
});
const timeOut4 = i18n.translate('wazuh.common.config.equivalence.timeOut4', {
  defaultMessage: 'ip.ignore',
});
const timeOut5 = i18n.translate('wazuh.common.config.equivalence.timeOut5', {
  defaultMessage: 'IP ignore',
});
const timeOut6 = i18n.translate('wazuh.common.config.equivalence.timeOut6', {
  defaultMessage: 'xpack.rbac.enabled',
});
const timeOut7 = i18n.translate('wazuh.common.config.equivalence.timeOut7', {
  defaultMessage: 'X-Pack RBAC',
});
const timeOut8 = i18n.translate('wazuh.common.config.equivalence.timeOut8', {
  defaultMessage: 'cwazuh.monitoring.enabled',
});
const timeOut9 = i18n.translate('wazuh.common.config.equivalence.timeOut9', {
  defaultMessage: 'Status',
});
const timeOut10 = i18n.translate('wazuh.common.config.equivalence.timeOut10', {
  defaultMessage: 'wazuh.monitoring.frequency',
});
const timeOut11 = i18n.translate('wazuh.common.config.equivalence.timeOut11', {
  defaultMessage: 'Frequency',
});
const timeOut12 = i18n.translate('wazuh.common.config.equivalence.timeOut12', {
  defaultMessage: 'wazuh.monitoring.shards',
});
const timeOut13 = i18n.translate('wazuh.common.config.equivalence.timeOut13', {
  defaultMessage: 'Index shards',
});
const timeOut14 = i18n.translate('wazuh.common.config.equivalence.timeOut14', {
  defaultMessage: 'wazuh.monitoring.replicas',
});
const timeOut15 = i18n.translate('wazuh.common.config.equivalence.timeOut15', {
  defaultMessage: 'Index replicas',
});
const timeOut16 = i18n.translate('wazuh.common.config.equivalence.timeOut16', {
  defaultMessage: 'wazuh.monitoring.creation',
});
const timeOut17 = i18n.translate('wazuh.common.config.equivalence.timeOut17', {
  defaultMessage: 'Index creation',
});
const timeOut18 = i18n.translate('wazuh.common.config.equivalence.timeOut18', {
  defaultMessage: 'wazuh.monitoring.pattern',
});
const timeOut19 = i18n.translate('wazuh.common.config.equivalence.timeOut19', {
  defaultMessage: 'Index pattern',
});
const hide1 = i18n.translate('wazuh.common.config.equivalence.hide1', {
  defaultMessage: 'Hide manager alerts',
});
const hide2 = i18n.translate('wazuh.common.config.equivalence.hide2', {
  defaultMessage: 'logs.level',
});
const hide3 = i18n.translate('wazuh.common.config.equivalence.hide3', {
  defaultMessage: 'Log level',
});
const hide4 = i18n.translate('wazuh.common.config.equivalence.hide4', {
  defaultMessage: 'enrollment.dns',
});
const hide5 = i18n.translate('wazuh.common.config.equivalence.hide5', {
  defaultMessage: 'Enrollment DNS',
});
const hide6 = i18n.translate('wazuh.common.config.equivalence.hide6', {
  defaultMessage: 'cron.prefix',
});
const hide7 = i18n.translate('wazuh.common.config.equivalence.hide7', {
  defaultMessage: 'Cron prefix',
});
const hide8 = i18n.translate('wazuh.common.config.equivalence.hide8', {
  defaultMessage: 'cron.statistics.status',
});
const hide9 = i18n.translate('wazuh.common.config.equivalence.hide9', {
  defaultMessage: 'Status',
});
const hide10 = i18n.translate('wazuh.common.config.equivalence.hide10', {
  defaultMessage: 'cron.statistics.apis',
});
const hide11 = i18n.translate('wazuh.common.config.equivalence.hide11', {
  defaultMessage: 'Includes apis',
});
const hide12 = i18n.translate('wazuh.common.config.equivalence.hide12', {
  defaultMessage: 'cron.statistics.interval',
});
const hide13 = i18n.translate('wazuh.common.config.equivalence.hide13', {
  defaultMessage: 'Interval',
});
const hide14 = i18n.translate('wazuh.common.config.equivalence.hide14', {
  defaultMessage: 'cron.statistics.index.name',
});
const hide15 = i18n.translate('wazuh.common.config.equivalence.hide15', {
  defaultMessage: 'Index name',
});
const hide16 = i18n.translate('wazuh.common.config.equivalence.hide16', {
  defaultMessage: 'cron.statistics.index.creation',
});
const hide17 = i18n.translate('wazuh.common.config.equivalence.hide17', {
  defaultMessage: 'Index creation',
});
const hide18 = i18n.translate('wazuh.common.config.equivalence.hide18', {
  defaultMessage: "cron.statistics.index.shards'",
});
const hide19 = i18n.translate('wazuh.common.config.equivalence.hide19', {
  defaultMessage: 'cron.statistics.index.replicas',
});
const hide20 = i18n.translate('wazuh.common.config.equivalence.hide20', {
  defaultMessage: 'Index replicas',
});
const hide21 = i18n.translate('wazuh.common.config.equivalence.hide21', {
  defaultMessage: 'alerts.sample.prefix',
});
const hide22 = i18n.translate('wazuh.common.config.equivalence.hide22', {
  defaultMessage: 'Sample alerts prefix',
});
export const configEquivalences = {
  pattern: descp1,
  descp2: `${descp3} ${ASSETS_PUBLIC_URL}`,
  descp4: ` ${descp5} ${ASSETS_PUBLIC_URL}`,
  descp6: `${descp7} ${ASSETS_PUBLIC_URL}`,
  descp8: `${descp9} ${ASSETS_PUBLIC_URL}`,
  descp10: { descp10 },
  descp11: { descp12 },
  descp13: { descp14 },
  descp15: { descp16 },
  descp17: { descp18 },
  descp19: `${descp20} ${PLUGIN_PLATFORM_NAME} ${descp21}`,
  descp22: ` ${descp23} ${PLUGIN_PLATFORM_NAME} ${descp24}`,
  descp25: ` ${descp26} ${PLUGIN_PLATFORM_NAME} ${descp27}`,
  descp28: descp29,
  descp30: descp31,
  descp32: descp33,
  descp34: descp35,
  descp36: descp37,
  descp38: descp39,
  descp40: descp41,
  descp42: descp43,
  descp44: descp45,
  descp46: descp47,
  descp48: descp49,
  descp50: descp51,
  descp52: descp53,
  descp54: descp55,
  timeout: descp56,
  descp57: descp58,
  descp59: descp60,
  descp61: descp62,
  descp63: descp64,
  descp65: descp66,
  descp67: descp68,
  descp69: descp70,
  descp71: descp72,
  hideManagerAlerts: descp73,
  descp74: descp75,
  descp76: descp77,
  descp78: descp79,
  descp80: descp81,
  descp82: descp83,
  descp84: descp85,
  descp86: descp87,
  descp88: descp89,
  descp90: descp91,
  descp92: descp93,
  descp94: descp95,
  descp96: descp97,
};

export const nameEquivalence = {
  pattern: pattern1,
  pattern2: pattern3,
  pattern4: pattern5,
  pattern6: pattern7,
  pattern8: pattern9,
  pattern10: pattern11,
  pattern12: pattern13,
  pattern14: pattern15,
  pattern16: pattern17,
  pattern18: pattern19,
  pattern20: pattern21,
  pattern22: pattern23,
  pattern24: pattern25,
  timeout: timeOut1,
  timeOu2: timeOut3,
  timeOut4: timeOut5,
  timeOut6: timeOut7,
  timeOut8: timeOut9,
  timeOut10: timeOut11,
  timeOut12: timeOut13,
  timeOut14: timeOut15,
  timeOut16: timeOut17,
  timeOut18: timeOut19,
  hideManagerAlerts: hide1,
  hide2: hide3,
  hide4: hide5,
  hide6: hide7,
  hide8: hide9,
  hide10: hide11,
  hide12: hide13,
  hide14: hide15,
  hide16: hide17,
  hide18: timeOut13,
  hide19: hide20,
  hide21: hide22,
};

const HEALTH_CHECK = i18n.translate('wazuh.common.config.equivalence.Healthcheck', {
  defaultMessage: 'Health Check',
});
const GENERAL = i18n.translate('wazuh.common.config.equivalence.General', {
  defaultMessage: 'General',
});
const SECURITY = i18n.translate('wazuh.common.config.equivalence.Security', {
  defaultMessage: 'Security',
});
const MONITORING = i18n.translate('wazuh.common.config.equivalence.Monitoring', {
  defaultMessage: 'Monitoring',
});
const STATISTICS = i18n.translate('wazuh.common.config.equivalence.Statistics', {
  defaultMessage: 'Statistics',
});
const CUSTOMIZATION = i18n.translate("wazuh.components.logoCustomization",
  {
    defaultMessage: 'Logo Customization',
  },
);
('');
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
