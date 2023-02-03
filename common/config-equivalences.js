import { ASSETS_PUBLIC_URL, PLUGIN_PLATFORM_NAME } from './constants';
import { i18n } from '@kbn/i18n';
const descp1 = i18n.translate('wazuh.common.config.equivalence.descp1', {
  defaultMessage:
    "Default index pattern to use on the app. If there's no valid index pattern, the app will automatically create one with the name indicated in this option.",
});
const descp3 = i18n.translate('wazuh.common.config.equivalence.descp3', {
  defaultMessage: 'Set the name of the app logo stored at',
});

const descp5 = i18n.translate('wazuh.common.config.equivalence.descp5', {
  defaultMessage: 'Set the name of the sidebar logo stored at',
});

const descp7 = i18n.translate('wazuh.common.config.equivalence.descp7', {
  defaultMessage: 'Set the name of the health-check logo stored at',
});
const descp9 = i18n.translate('wazuh.common.config.equivalence.descp9', {
  defaultMessage: 'Set the name of the reports logo (.png) stored at',
});
const descp10 = i18n.translate('wazuh.common.config.equivalence.descp10', {
  defaultMessage:
    'Enable or disable the index pattern health check when opening the app.',
});

const descp12 = i18n.translate('wazuh.common.config.equivalence.descp12', {
  defaultMessage:
    'Enable or disable the template health check when opening the app.',
});

const descp14 = i18n.translate('wazuh.common.config.equivalence.descp14', {
  defaultMessage:
    'Enable or disable the API health check when opening the app.',
});

const descp16 = i18n.translate('wazuh.common.config.equivalence.descp16', {
  defaultMessage:
    'Enable or disable the setup health check when opening the app.',
});

const descp18 = i18n.translate('wazuh.common.config.equivalence.descp18', {
  defaultMessage:
    'Enable or disable the known fields health check when opening the app.',
});

const descp20 = i18n.translate('wazuh.common.config.equivalence.descp20', {
  defaultMessage: 'Change the default value of the',
});
const descp21 = i18n.translate('wazuh.common.config.equivalence.descp21', {
  defaultMessage: 'metaField configuration',
});

const descp23 = i18n.translate('wazuh.common.config.equivalence.descp23', {
  defaultMessage: 'Change the default value of the',
});
const descp24 = i18n.translate('wazuh.common.config.equivalence.descp24', {
  defaultMessage: 'timeFilter configuration',
});

const descp26 = i18n.translate('wazuh.common.config.equivalence.descp26', {
  defaultMessage: 'Change the default value of the',
});
const descp27 = i18n.translate('wazuh.common.config.equivalence.descp27', {
  defaultMessage: 'max buckets configuration',
});

const descp29 = i18n.translate('wazuh.common.config.equivalence.descp29', {
  defaultMessage: 'Enable or disable the PCI DSS tab on Overview and Agents.',
});

const descp31 = i18n.translate('wazuh.common.config.equivalence.descp31', {
  defaultMessage: 'Enable or disable the GDPR tab on Overview and Agents.',
});

const descp33 = i18n.translate('wazuh.common.config.equivalence.descp33', {
  defaultMessage: 'Enable or disable the HIPAA tab on Overview and Agents.',
});

const descp35 = i18n.translate('wazuh.common.config.equivalence.descp35', {
  defaultMessage:
    'Enable or disable the NIST 800-53 tab on Overview and Agents.',
});

const descp37 = i18n.translate('wazuh.common.config.equivalence.descp37', {
  defaultMessage: 'Enable or disable the TSC tab on Overview and Agents.',
});

const descp39 = i18n.translate('wazuh.common.config.equivalence.descp39', {
  defaultMessage: 'Enable or disable the Audit tab on Overview and Agents.',
});

const descp41 = i18n.translate('wazuh.common.config.equivalence.descp41', {
  defaultMessage: 'Enable or disable the Open SCAP tab on Overview and Agents.',
});

const descp43 = i18n.translate('wazuh.common.config.equivalence.descp43', {
  defaultMessage: 'Enable or disable the CIS-CAT tab on Overview and Agents.',
});
const descp44 = i18n.translate('wazuh.common.config.equivalence.descp44', {
  defaultMessage: 'extensions.aws',
});
const descp45 = i18n.translate('wazuh.common.config.equivalence.descp45', {
  defaultMessage: 'Enable or disable the Amazon (AWS) tab on Overview.',
});

const descp47 = i18n.translate('wazuh.common.config.equivalence.descp47', {
  defaultMessage:
    'Enable or disable the Google Cloud Platform tab on Overview.',
});

const descp49 = i18n.translate('wazuh.common.config.equivalence.descp49', {
  defaultMessage:
    'Enable or disable the VirusTotal tab on Overview and Agents.',
});

const descp51 = i18n.translate('wazuh.common.config.equivalence.descp51', {
  defaultMessage: 'Enable or disable the Osquery tab on Overview and Agents.',
});

const descp53 = i18n.translate('wazuh.common.config.equivalence.descp53', {
  defaultMessage: 'Enable or disable the MITRE tab on Overview and Agents.',
});

const descp55 = i18n.translate('wazuh.common.config.equivalence.descp55', {
  defaultMessage:
    'Enable or disable the Docker listener tab on Overview and Agents.',
});
const descp56 = i18n.translate('wazuh.common.config.equivalence.descp56', {
  defaultMessage:
    'Maximum time, in milliseconds, the app will wait for an API response when making requests to it. It will be ignored if the value is set under 1500 milliseconds.',
});

const descp58 = i18n.translate('wazuh.common.config.equivalence.descp58', {
  defaultMessage:
    'Define if the user is allowed to change the selected index pattern directly from the top menu bar.',
});

const descp60 = i18n.translate('wazuh.common.config.equivalence.descp60', {
  defaultMessage:
    'Disable certain index pattern names from being available in index pattern selector from the Wazuh app.',
});

const descp62 = i18n.translate('wazuh.common.config.equivalence.descp62', {
  defaultMessage:
    'Enable or disable the wazuh-monitoring index creation and/or visualization.',
});

const descp64 = i18n.translate('wazuh.common.config.equivalence.descp64', {
  defaultMessage:
    'Frequency, in seconds, of API requests to get the state of the agents and create a new document in the wazuh-monitoring index with this data.',
});

const descp66 = i18n.translate('wazuh.common.config.equivalence.descp66', {
  defaultMessage:
    'Define the number of shards to use for the wazuh-monitoring-* indices.',
});
const descp67 = i18n.translate('wazuh.common.config.equivalence.descp67', {
  defaultMessage:
    'Define the number of replicas to use for the wazuh-monitoring-* indices.',
});

const descp69 = i18n.translate('wazuh.common.config.equivalence.descp69', {
  defaultMessage:
    'Define the interval in which a new wazuh-monitoring index will be created.',
});

const descp71 = i18n.translate('wazuh.common.config.equivalence.descp71', {
  defaultMessage: 'Default index pattern to use for Wazuh monitoring.',
});
const descp72 = i18n.translate('wazuh.common.config.equivalence.descp72', {
  defaultMessage: 'Rule level by tactic',
});
const descp73 = i18n.translate('wazuh.common.config.equivalence.descp73', {
  defaultMessage: 'Hide the alerts of the manager in every dashboard.',
});

const descp74 = i18n.translate('wazuh.common.config.equivalence.descp75', {
  defaultMessage: 'Logging level of the App.',
});

const descp77 = i18n.translate('wazuh.common.config.equivalence.descp77', {
  defaultMessage:
    'Specifies the Wazuh registration server, used for the agent enrollment.',
});

const descp79 = i18n.translate('wazuh.common.config.equivalence.descp79', {
  defaultMessage:
    'Specifies the password used to authenticate during the agent enrollment.',
});

const descp81 = i18n.translate('wazuh.common.config.equivalence.descp81', {
  defaultMessage: 'Define the index prefix of predefined jobs.',
});

const descp83 = i18n.translate('wazuh.common.config.equivalence.descp83', {
  defaultMessage: 'Enable or disable the statistics tasks.',
});

const descp85 = i18n.translate('wazuh.common.config.equivalence.descp85', {
  defaultMessage:
    'Enter the ID of the hosts you want to save data from, leave this empty to run the task on every host.',
});

const descp87 = i18n.translate('wazuh.common.config.equivalence.descp87', {
  defaultMessage:
    'Define the frequency of task execution using cron schedule expressions.',
});

const descp89 = i18n.translate('wazuh.common.config.equivalence.descp89', {
  defaultMessage:
    'Define the name of the index in which the documents will be saved.',
});

const descp91 = i18n.translate('wazuh.common.config.equivalence.descp91', {
  defaultMessage: 'Define the interval in which a new index will be created.',
});

const descp93 = i18n.translate('wazuh.common.config.equivalence.descp93', {
  defaultMessage:
    'Define the number of shards to use for the statistics indices.',
});

const descp95 = i18n.translate('wazuh.common.config.equivalence.descp95', {
  defaultMessage:
    'Define the number of replicas to use for the statistics indices.',
});

const descp97 = i18n.translate('wazuh.common.config.equivalence.descp97', {
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
const patternGernal1 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal1',
  {
    defaultMessage: 'customization.logo.app',
  },
);
const patternGernal2 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal2',
  {
    defaultMessage: 'customization.logo.sidebar',
  },
);
const patternGernal3 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal3',
  {
    defaultMessage: 'customization.logo.healthcheck',
  },
);
const patternGernal4 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal4',
  {
    defaultMessage: 'customization.logo.reports',
  },
);
const patternGernal5 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal5',
  {
    defaultMessage: 'checks.pattern',
  },
);
const patternGernal6 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal6',
  {
    defaultMessage: 'checks.template',
  },
);
const patternGernal7 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal7',
  {
    defaultMessage: 'checks.api',
  },
);
const patternGernal8 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal8',
  {
    defaultMessage: 'checks.setup',
  },
);
const patternGernal9 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal9',
  {
    defaultMessage: 'checks.fields',
  },
);
const patternGernal10 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal10',
  {
    defaultMessage: 'checks.metaFields',
  },
);
const patternGernal11 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal11',
  {
    defaultMessage: 'checks.timeFilter',
  },
);
const patternGernal12 = i18n.translate(
  'wazuh.common.config.equivalence.patternGernal12',
  {
    defaultMessage: 'checks.maxBuckets',
  },
);
const timeOutGernal1 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal1',
  {
    defaultMessage: 'ip.selector',
  },
);
const timeOutGernal2 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal2',
  {
    defaultMessage: 'ip.ignore',
  },
);
const timeOutGernal3 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal3',
  {
    defaultMessage: 'wazuh.monitoring.enabled',
  },
);
const timeOutGernal4 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal4',
  {
    defaultMessage: 'wazuh.monitoring.frequency',
  },
);
const timeOutGernal5 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal5',
  {
    defaultMessage: 'wazuh.monitoring.shards',
  },
);
const timeOutGernal6 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal6',
  {
    defaultMessage: 'wazuh.monitoring.replicas',
  },
);
const timeOutGernal7 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal7',
  {
    defaultMessage: 'wazuh.monitoring.creation',
  },
);
const timeOutGernal8 = i18n.translate(
  'wazuh.common.config.equivalence.timeOutGernal8',
  {
    defaultMessage: 'wazuh.monitoring.pattern',
  },
);
const hideGernal1 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal1',
  {
    defaultMessage: 'logs.level',
  },
);
const hideGernal2 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal2',
  {
    defaultMessage: 'enrollment.dns',
  },
);
const hideGernal3 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal3',
  {
    defaultMessage: 'cron.prefix',
  },
);
const hideGernal4 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal4',
  {
    defaultMessage: 'cron.statistics.status',
  },
);
const hideGernal5 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal5',
  {
    defaultMessage: 'cron.statistics.apis',
  },
);
const hideGernal6 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal6',
  {
    defaultMessage: 'cron.statistics.interval',
  },
);
const hideGernal7 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal7',
  {
    defaultMessage: 'cron.statistics.index.name',
  },
);
const hideGernal8 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal8',
  {
    defaultMessage: 'cron.statistics.index.creation',
  },
);
const hideGernal9 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal9',
  {
    defaultMessage: 'cron.statistics.index.shards',
  },
);
const hideGernal10 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal10',
  {
    defaultMessage: 'cron.statistics.index.replicas',
  },
);
const hideGernal11 = i18n.translate(
  'wazuh.common.config.equivalence.hideGernal11',
  {
    defaultMessage: 'alerts.sample.prefix',
  },
);
const hourly = i18n.translate('wazuh.common.config.equivalence.Hourly', {
  defaultMessage: 'Hourly',
});
const daily = i18n.translate('wazuh.common.config.equivalence.Daily', {
  defaultMessage: 'Daily',
});
const weekly = i18n.translate('wazuh.common.config.equivalence.Weekly', {
  defaultMessage: 'Weekly',
});
const monthly = i18n.translate('wazuh.common.config.equivalence.Monthly', {
  defaultMessage: 'Monthly',
});
const textinfo1 = i18n.translate('wazuh.common.config.equivalence.textinfo1', {
  defaultMessage: 'Info',
});
const textdebug2 = i18n.translate(
  'wazuh.common.config.equivalence.textdebug2',
  {
    defaultMessage: 'Debug',
  },
);
const text1 = i18n.translate('wazuh.common.config.equivalence.text1', {
  defaultMessage: 'text',
});
const text2 = i18n.translate('wazuh.common.config.equivalence.text2', {
  defaultMessage: 'number',
});
const text3 = i18n.translate('wazuh.common.config.equivalence.text3', {
  defaultMessage: 'list',
});
const text4 = i18n.translate('wazuh.common.config.equivalence.text4', {
  defaultMessage: "boolean'",
});
const text5 = i18n.translate('wazuh.common.config.equivalence.text5', {
  defaultMessage: 'array',
});
const text6 = i18n.translate('wazuh.common.config.equivalence.text6', {
  defaultMessage: 'interval',
});
export const configEquivalences = {
  pattern: descp1,
  'customization.logo.app': `${descp3} ${ASSETS_PUBLIC_URL}`,
  'customization.logo.sidebar': ` ${descp5} ${ASSETS_PUBLIC_URL}`,
  'customization.logo.healthcheck': `${descp7} ${ASSETS_PUBLIC_URL}`,
  'customization.logo.reports': `${descp9} ${ASSETS_PUBLIC_URL}`,
  'checks.pattern': descp10,
  'checks.template': descp12,
  'checks.api': descp14,
  'checks.setup': descp16,
  'checks.fields': descp18,
  'checks.metaFields': `${descp20} ${PLUGIN_PLATFORM_NAME} ${descp21}`,
  'checks.timeFilter': ` ${descp23} ${PLUGIN_PLATFORM_NAME} ${descp24}`,
  'checks.maxBuckets': ` ${descp26} ${PLUGIN_PLATFORM_NAME} ${descp27}`,
  'extensions.pci': descp29,
  'extensions.gdpr': descp31,
  'extensions.hipaa': descp33,
  'extensions.nist': descp35,
  'extensions.tsc': descp37,
  'extensions.audit': descp39,
  'extensions.oscap': descp41,
  'extensions.ciscat': descp43,
  'extensions.aws': descp45,
  'extensions.gcp': descp47,
  'extensions.virustotal': descp49,
  'extensions.osquery': descp51,
  'extensions.mitre': descp53,
  'extensions.docker': descp55,
  timeout: descp56,
  'ip.selector': descp58,
  'ip.ignore': descp60,
  'wazuh.monitoring.enabled': descp62,
  'wazuh.monitoring.frequency': descp64,
  'wazuh.monitoring.shards': descp66,
  'wazuh.monitoring.replicas': descp67,
  'wazuh.monitoring.creation': descp69,
  'wazuh.monitoring.pattern': descp71,
  hideManagerAlerts: descp73,
  'logs.level': descp74,
  'enrollment.dns': descp77,
  'enrollment.password': descp79,
  'cron.prefix': descp81,
  'cron.statistics.status': descp83,
  'cron.statistics.apis': descp85,
  'cron.statistics.interval': descp87,
  'cron.statistics.index.name': descp89,
  'cron.statistics.index.creation': descp91,
  'cron.statistics.index.shards': descp93,
  'cron.statistics.index.replicas': descp95,
  'alerts.sample.prefix': descp97,
};

export const nameEquivalence = {
  pattern: pattern1,
  'customization.logo.app': pattern3,
  'customization.logo.sidebar': pattern5,
  'customization.logo.healthcheck': pattern7,
  'customization.logo.reports': pattern9,
  'checks.pattern': pattern11,
  'checks.template': pattern13,
  'checks.api': pattern15,
  'checks.setup': pattern17,
  'checks.fields': pattern19,
  'checks.metaFields': pattern21,
  'checks.timeFilter': pattern23,
  'checks.maxBuckets': pattern25,
  timeout: timeOut1,
  'ip.selector': timeOut3,
  'ip.ignore': timeOut5,
  'xpack.rbac.enabled': timeOut7,
  'wazuh.monitoring.enabled': timeOut9,
  'wazuh.monitoring.frequency': timeOut11,
  'wazuh.monitoring.shards': timeOut13,
  'wazuh.monitoring.replicas': timeOut15,
  'wazuh.monitoring.creation': timeOut17,
  'wazuh.monitoring.pattern': timeOut19,
  hideManagerAlerts: hide1,
  'logs.level': hide3,
  'enrollment.dns': hide5,
  'cron.prefix': hide7,
  'cron.statistics.status': hide9,
  'cron.statistics.apis': hide11,
  'cron.statistics.interval': hide13,
  'cron.statistics.index.name': hide15,
  'cron.statistics.index.creation': hide17,
  'cron.statistics.index.shards': timeOut13,
  'cron.statistics.index.replicas': hide20,
  'alerts.sample.prefix': hide22,
};

const HEALTH_CHECK = i18n.translate(
  'wazuh.common.config.equivalence.Healthcheck',
  {
    defaultMessage: 'Health Check',
  },
);
const GENERAL = i18n.translate('wazuh.common.config.equivalence.General', {
  defaultMessage: 'General',
});
const SECURITY = i18n.translate('wazuh.common.config.equivalence.Security', {
  defaultMessage: 'Security',
});
const MONITORING = i18n.translate(
  'wazuh.common.config.equivalence.Monitoring',
  {
    defaultMessage: 'Monitoring',
  },
);
const STATISTICS = i18n.translate(
  'wazuh.common.config.equivalence.Statistics',
  {
    defaultMessage: 'Statistics',
  },
);
const CUSTOMIZATION = i18n.translate('wazuh.components.logoCustomization', {
  defaultMessage: 'Logo Customization',
});
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

const TEXT = text1;
const NUMBER = text2;
const LIST = text3;
const BOOLEAN = text4;
const ARRAY = text5;
const INTERVAL = text6;

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
        { text: hourly, value: 'h' },
        { text: daily, value: 'd' },
        { text: weekly, value: 'w' },
        { text: monthly, value: 'm' },
      ],
    },
  },
  'wazuh.monitoring.pattern': { type: TEXT },
  hideManagerAlerts: { type: BOOLEAN },
  'logs.level': {
    type: LIST,
    params: {
      options: [
        { text: textinfo1, value: 'info' },
        { text: textdebug2, value: 'debug' },
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
        { text: hourly, value: 'h' },
        { text: daily, value: 'd' },
        { text: weekly, value: 'w' },
        { text: monthly, value: 'm' },
      ],
    },
  },
  'cron.statistics.index.shards': { type: NUMBER },
  'cron.statistics.index.replicas': { type: NUMBER },
  'alerts.sample.prefix': { type: TEXT },
};
