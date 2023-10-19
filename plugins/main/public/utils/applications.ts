import { i18n } from '@osd/i18n';
import store from '../redux/store';
import {
  LogoDocker,
  LogoGitHub,
  LogoGoogleCloud,
  LogoOffice365,
} from '../components/common/logos';
import { DEFAULT_APP_CATEGORIES } from '../../../../src/core/public';

/* Applications
Convention: the order of each application must according to the order of the category
that is included.

Example:
Category order of the application: 100
Application order: one of 100-199 range: 100, 101, 102, etc...
*/

/* Categories ID
Wazuh:
Home: 0
Endpoint security: 100
Threat intelligence: 200
Security operations: 300
Cloud security: 400
Explore (added to Wazuh dashboard default categories): 500
Server management: 600
Dashboard/indexer management (added to Wazuh dashboard default categories): 9000
*/

const overview = {
  category: 'wz-category-home',
  id: 'wz-home',
  title: i18n.translate('wz-app-home', {
    defaultMessage: 'Overview',
  }),
  description: i18n.translate('overview-description', {
    defaultMessage:
      'This application provides you with an overview of Wazuh applications.',
  }),
  euiIconType: 'lensApp',
  order: 1,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/overview/',
};

export const fileIntegrityMonitoring = {
  category: 'wz-category-endpoint-security',
  id: 'file-integrity-monitoring',
  title: i18n.translate('wz-app-file-integrity-monitoring', {
    defaultMessage: 'File integrity monitoring',
  }),
  description: i18n.translate('file-integrity-monitoring-description', {
    defaultMessage:
      'Alerts related to file changes, including permissions, content, ownership, and attributes.',
  }),
  euiIconType: 'indexRollupApp',
  showInOverviewApp: true,
  showInAgentMenu: true,
  order: 102,
  redirectTo: () =>
    `/overview/?tab=fim&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const endpointSumary = {
  category: 'wz-category-server-management',
  id: 'endpoints-summary',
  title: i18n.translate('wz-app-endpoints-summary', {
    defaultMessage: 'Endpoints summary',
  }),
  description: i18n.translate('endpoints-summary-description', {
    defaultMessage: 'Summary of agents and their status.',
  }),
  euiIconType: 'usersRolesApp',
  order: 600,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/agents-preview/',
};

const malwareDetection = {
  category: 'wz-category-endpoint-security',
  id: 'malware-detection',
  title: i18n.translate('wz-app-malware-detection', {
    defaultMessage: 'Malware detection',
  }),
  description: i18n.translate('malware-detection-description', {
    defaultMessage:
      'Verify that your systems are configured according to your security policies baseline.',
  }),
  euiIconType: 'indexRollupApp',
  order: 101,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=pm&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const configurationAssessment = {
  category: 'wz-category-endpoint-security',
  id: 'configuration-assessment',
  title: i18n.translate('wz-app-configuration-assessment', {
    defaultMessage: 'Configuration assessment',
  }),
  description: i18n.translate('configuration-assessment-description', {
    defaultMessage:
      'Scan your assets as part of a configuration assessment audit.',
  }),
  order: 100,
  euiIconType: 'managementApp',
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=sca&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const threatHunting = {
  category: 'wz-category-threat-intelligence',
  id: 'threat-hunting',
  title: i18n.translate('wz-app-threat-hunting', {
    defaultMessage: 'Threat hunting',
  }),
  description: i18n.translate('threat-hunting-description', {
    defaultMessage:
      'Browse through your security alerts, identifying issues and threats in your environment.',
  }),
  euiIconType: 'securityAnalyticsApp',
  order: 200,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=general&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const vulnerabilityDetection = {
  category: 'wz-category-threat-intelligence',
  id: 'vulnerability-detection',
  title: i18n.translate('wz-app-vulnerability-detection', {
    defaultMessage: 'Vulnerability detection',
  }),
  description: i18n.translate('vulnerability-detection-description', {
    defaultMessage:
      'Discover what applications in your environment are affected by well-known vulnerabilities.',
  }),
  euiIconType: 'heartbeatApp',
  order: 201,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=vuls&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const mitreAttack = {
  category: 'wz-category-threat-intelligence',
  id: 'mitre-attack',
  title: i18n.translate('wz-app-mitre-attack', {
    defaultMessage: 'MITRE ATT&CK',
  }),
  description: i18n.translate('mitre-attack-description', {
    defaultMessage:
      'Security events from the knowledge base of adversary tactics and techniques based on real-world observations.',
  }),
  euiIconType: 'grokApp',
  order: 202,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=mitre&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const virustotal = {
  category: 'wz-category-threat-intelligence',
  id: 'virustotal',
  title: i18n.translate('wz-app-virustotal', {
    defaultMessage: 'Virustotal',
  }),
  description: i18n.translate('virustotal-description', {
    defaultMessage:
      'Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API.',
  }),
  euiIconType: 'monitoringApp',
  order: 203,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=virustotal&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const pciDss = {
  category: 'wz-category-security-operations',
  id: 'pci-dss',
  title: i18n.translate('wz-app-pci-dss', {
    defaultMessage: 'PCI DSS',
  }),
  description: i18n.translate('pci-dss-description', {
    defaultMessage:
      'Global security standard for entities that process, store, or transmit payment cardholder data.',
  }),
  euiIconType: 'sqlApp',
  order: 300,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=pci&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const hipaa = {
  category: 'wz-category-security-operations',
  id: 'hipaa',
  title: i18n.translate('wz-app-hipaa', {
    defaultMessage: 'HIPAA',
  }),
  description: i18n.translate('hipaa-description', {
    defaultMessage:
      'Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.',
  }),
  euiIconType: 'monitoringApp',
  order: 302,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=hipaa&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const gdpr = {
  category: 'wz-category-security-operations',
  id: 'gdpr',
  title: i18n.translate('wz-app-gdpr', {
    defaultMessage: 'GDPR',
  }),
  description: i18n.translate('gdpr-description', {
    defaultMessage:
      'General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.',
  }),
  euiIconType: 'sqlApp',
  order: 301,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=gdpr&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const nist80053 = {
  category: 'wz-category-security-operations',
  id: 'nist-800-53',
  title: i18n.translate('wz-app-nist-800-53', {
    defaultMessage: 'NIST 800-53',
  }),
  description: i18n.translate('nist-800-53-description', {
    defaultMessage:
      'National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.',
  }),
  euiIconType: 'notebookApp',
  showInOverviewApp: true,
  showInAgentMenu: true,
  order: 303,
  redirectTo: () =>
    `/overview/?tab=nist&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const tsc = {
  category: 'wz-category-security-operations',
  id: 'tsc',
  title: i18n.translate('wz-app-tsc', {
    defaultMessage: 'TSC',
  }),
  description: i18n.translate('tsc-description', {
    defaultMessage:
      'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy.',
  }),
  euiIconType: 'packetbeatApp',
  order: 304,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=tsc&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const itHygiene = {
  category: 'wz-category-security-operations',
  id: 'it-hygiene',
  title: i18n.translate('wz-app-it-hygiene', {
    defaultMessage: 'IT Hygiene',
  }),
  description: i18n.translate('it-hygiene-description', {
    defaultMessage:
      'Applications, network configuration, open ports, and processes running on your monitored systems.',
  }),
  euiIconType: 'visualizeApp',
  order: 305,
  showInOverviewApp: true,
  showInAgentMenu: false,
  redirectTo: () =>
    `/agents/?tab=welcome${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agent=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const amazonWebServices = {
  category: 'wz-category-cloud-security',
  id: 'amazon-web-services',
  title: i18n.translate('wz-app-amazon-web-services', {
    defaultMessage: 'Amazon Web Services',
  }),
  description: i18n.translate('amazon-web-services-description', {
    defaultMessage:
      'Security events related to your Amazon AWS services, collected directly via AWS API.',
  }),
  euiIconType: 'logoAWSMono',
  order: 400,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=aws&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const googleCloud = {
  category: 'wz-category-cloud-security',
  id: 'google-cloud',
  title: i18n.translate('wz-app-google-cloud', {
    defaultMessage: 'Google Cloud',
  }),
  description: i18n.translate('google-cloud-description', {
    defaultMessage:
      'Security events related to your Google Cloud Platform services, collected directly via GCP API.',
  }),
  euiIconType: LogoGoogleCloud,
  order: 401,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=gcp&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const github = {
  category: 'wz-category-cloud-security',
  id: 'github',
  title: i18n.translate('wz-app-github', {
    defaultMessage: 'GitHub',
  }),
  description: i18n.translate('github-description', {
    defaultMessage:
      'Monitoring events from audit logs of your GitHub organizations.',
  }),
  euiIconType: LogoGitHub,
  order: 402,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=github&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const office365 = {
  category: 'wz-category-cloud-security',
  id: 'office365',
  title: i18n.translate('wz-app-office365', {
    defaultMessage: 'Office 365',
  }),
  description: i18n.translate('office365-description', {
    defaultMessage: 'Security events related to your Office 365 services.',
  }),
  euiIconType: LogoOffice365,
  order: 403,
  showInOverviewApp: true,
  showInAgentMenu: false,
  redirectTo: () =>
    `/overview/?tab=office&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const docker = {
  category: 'wz-category-cloud-security',
  id: 'docker',
  title: i18n.translate('wz-app-docker', {
    defaultMessage: 'Docker',
  }),
  description: i18n.translate('docker-description', {
    defaultMessage:
      'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.',
  }),
  euiIconType: LogoDocker,
  order: 404,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=docker&tabView=panels${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const rules = {
  category: 'wz-category-server-management',
  id: 'rules',
  title: i18n.translate('wz-app-rules', {
    defaultMessage: 'Rules',
  }),
  description: i18n.translate('rules-description', {
    defaultMessage: 'Manage your Wazuh cluster rules.',
  }),
  euiIconType: 'indexRollupApp',
  order: 602,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=ruleset',
};

const decoders = {
  category: 'wz-category-server-management',
  id: 'decoders',
  title: i18n.translate('wz-app-decoders', {
    defaultMessage: 'Decoders',
  }),
  description: i18n.translate('decoders-description', {
    defaultMessage: 'Manage your Wazuh cluster decoders.',
  }),
  euiIconType: 'indexRollupApp',
  order: 603,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=decoders',
};

const cdbLists = {
  category: 'wz-category-server-management',
  id: 'cdb-lists',
  title: i18n.translate('wz-app-lists', {
    defaultMessage: 'CDB Lists',
  }),
  description: i18n.translate('cdb-lists-description', {
    defaultMessage: 'Manage your Wazuh cluster CDB list.',
  }),
  euiIconType: 'indexRollupApp',
  order: 604,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=lists',
};

const endpointGroups = {
  category: 'wz-category-server-management',
  id: 'endpoint-groups',
  title: i18n.translate('wz-app-endpoint-groups', {
    defaultMessage: 'Endpoint groups',
  }),
  description: i18n.translate('endpoint-groups-description', {
    defaultMessage: 'Manage your agent groups.',
  }),
  euiIconType: 'usersRolesApp',
  order: 601,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=groups',
};

const serverStatus = {
  category: 'wz-category-server-management',
  id: 'server-status',
  title: i18n.translate('wz-app-status', {
    defaultMessage: 'Status',
  }),
  description: i18n.translate('server-status-description', {
    defaultMessage: 'Manage your Wazuh cluster status.',
  }),
  euiIconType: 'indexRollupApp',
  order: 605,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=status',
};

const cluster = {
  category: 'wz-category-server-management',
  id: 'cluster',
  title: i18n.translate('wz-app-cluster', {
    defaultMessage: 'Cluster',
  }),
  description: i18n.translate('cluster-description', {
    defaultMessage: 'Manage your Wazuh cluster.',
  }),
  euiIconType: 'indexRollupApp',
  order: 606,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=monitoring',
};

const statistics = {
  category: 'wz-category-server-management',
  id: 'statistics',
  title: i18n.translate('wz-app-statistics', {
    defaultMessage: 'Statistics',
  }),
  description: i18n.translate('statistics-description', {
    defaultMessage: 'Information about the Wazuh enviroment.',
  }),
  euiIconType: 'indexRollupApp',
  order: 607,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=statistics',
};

const logs = {
  category: 'wz-category-server-management',
  id: 'logs',
  title: i18n.translate('wz-app-logs', {
    defaultMessage: 'Logs',
  }),
  description: i18n.translate('logs-description', {
    defaultMessage: 'Logs from your Wazuh cluster.',
  }),
  euiIconType: 'indexRollupApp',
  order: 608,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=logs',
};

const reporting = {
  category: 'management',
  id: 'reporting',
  title: i18n.translate('wz-app-reporting', {
    defaultMessage: 'Reporting',
  }),
  description: i18n.translate('reporting-description', {
    defaultMessage: 'Check your stored Wazuh reports.',
  }),
  euiIconType: 'indexRollupApp',
  order: 8900,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=reporting',
};

const settings = {
  category: 'wz-category-server-management',
  id: 'settings',
  title: i18n.translate('wz-app-settings', {
    defaultMessage: 'Settings',
  }),
  description: i18n.translate('settings-description', {
    defaultMessage: 'Manage your Wazuh cluster configuration.',
  }),
  euiIconType: 'indexRollupApp',
  order: 609,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=configuration',
};

const devTools = {
  category: 'wz-category-server-management',
  id: 'dev-tools',
  title: i18n.translate('wz-app-dev-tools', {
    defaultMessage: 'Dev Tools',
  }),
  description: i18n.translate('dev-tools-description', {
    defaultMessage: 'Test the Wazuh API endpoints.',
  }),
  euiIconType: 'devToolsApp',
  order: 610,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/wazuh-dev/?tab=devTools',
};

const rulesetTest = {
  category: 'wz-category-server-management',
  id: 'ruleset-test',
  title: i18n.translate('wz-app-ruleset-test', {
    defaultMessage: 'Ruleset test',
  }),
  description: i18n.translate('ruleset-test-description', {
    defaultMessage: 'Check your ruleset testing logs.',
  }),
  euiIconType: 'visualizeApp',
  order: 611,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/wazuh-dev/?tab=logtest',
};

const security = {
  category: 'wz-category-server-management',
  id: 'security',
  title: i18n.translate('wz-app-security', {
    defaultMessage: 'Security',
  }),
  description: i18n.translate('security-description', {
    defaultMessage:
      'Manage permissions to system resources based on the roles and policies.',
  }),
  euiIconType: 'securityAnalyticsApp',
  order: 612,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/security',
};

const serverApi = {
  category: 'management',
  id: 'server-api',
  title: i18n.translate('wz-app-server-api', {
    defaultMessage: 'Server API',
  }),
  description: i18n.translate('server-api-description', {
    defaultMessage: 'Manage and configure the API entries.',
  }),
  euiIconType: 'indexRollupApp',
  order: 8901,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=api',
};

const serverData = {
  category: 'management',
  id: 'server-data',
  title: i18n.translate('wz-app-server-data', {
    defaultMessage: 'Server data',
  }),
  description: i18n.translate('server-data-description', {
    defaultMessage: 'Add sample data with events to the modules.',
  }),
  euiIconType: 'indexRollupApp',
  order: 8902,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=sample_data',
};

const wazuhPluginSettings = {
  category: 'management',
  id: 'wazuh-plugin-settings',
  title: i18n.translate('wz-app-wazuh-plugin-settings', {
    defaultMessage: 'Wazuh plugin settings',
  }),
  description: i18n.translate('wazuh-plugin-settings-description', {
    defaultMessage: 'Manage your Wazuh cluster configuration.',
  }),
  euiIconType: 'indexRollupApp',
  order: 8903,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=configuration',
};

const wazuhPluginLogs = {
  category: 'management',
  id: 'wazuh-plugin-logs',
  title: i18n.translate('wz-app-wazuh-plugin-logs', {
    defaultMessage: 'Wazuh plugin logs',
  }),
  description: i18n.translate('wazuh-plugin-logs-description', {
    defaultMessage: 'Explore the logs related to the applications.',
  }),
  euiIconType: 'indexRollupApp',
  order: 8904,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=logs',
};

const wazuhPluginAbout = {
  category: 'management',
  id: 'wazuh-plugin-about',
  title: i18n.translate('wz-app-wazuh-plugin-about', {
    defaultMessage: 'Wazuh plugin about',
  }),
  description: i18n.translate('wazuh-plugin-about-description', {
    defaultMessage: 'Show information about App Versions and community links.',
  }),
  euiIconType: 'indexRollupApp',
  order: 8905,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=about',
};

export const Applications = [
  fileIntegrityMonitoring,
  overview,
  malwareDetection,
  configurationAssessment,
  threatHunting,
  vulnerabilityDetection,
  mitreAttack,
  virustotal,
  pciDss,
  hipaa,
  gdpr,
  nist80053,
  tsc,
  itHygiene,
  devTools,
  rulesetTest,
  security,
  amazonWebServices,
  googleCloud,
  github,
  office365,
  docker,
  endpointSumary,
  rules,
  decoders,
  cdbLists,
  endpointGroups,
  serverStatus,
  cluster,
  statistics,
  logs,
  settings,
  reporting,
  serverApi,
  serverData,
  wazuhPluginSettings,
  wazuhPluginLogs,
  wazuhPluginAbout,
].sort((a, b) => {
  // Sort applications by order
  if (a.order < b.order) {
    return -1;
  } else if (a.order > b.order) {
    return 1;
  } else {
    return 0;
  }
});

// Categories
export const Categories = [
  {
    id: 'wz-category-home',
    label: i18n.translate('wz-app-category-home', {
      defaultMessage: 'Home',
    }),
    order: 0,
    euiIconType: 'appSearchApp',
  },
  {
    id: 'wz-category-endpoint-security',
    label: i18n.translate('wz-app-category-endpoint-security', {
      defaultMessage: 'Endpoint security',
    }),
    order: 100,
    euiIconType: 'monitoringApp',
  },
  {
    id: 'wz-category-threat-intelligence',
    label: i18n.translate('wz-app-category-threat-intelligence', {
      defaultMessage: 'Threat intelligence',
    }),
    order: 200,
    euiIconType: 'lensApp',
  },
  {
    id: 'wz-category-security-operations',
    label: i18n.translate('wz-app-category-security-operations', {
      defaultMessage: 'Security operations',
    }),
    order: 300,
    euiIconType: 'securityApp',
  },
  {
    id: 'wz-category-cloud-security',
    label: i18n.translate('wz-app-category-cloud-security', {
      defaultMessage: 'Cloud security',
    }),
    order: 400,
    euiIconType: 'watchesApp',
  },
  {
    id: 'wz-category-server-management',
    label: i18n.translate('wz-app-category-server-management', {
      defaultMessage: 'Server management',
    }),
    order: 600,
    euiIconType: 'indexRollupApp',
  },
  DEFAULT_APP_CATEGORIES.management,
];
