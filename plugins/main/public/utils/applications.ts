import { i18n } from '@osd/i18n';
import store from '../redux/store';
import {
  LogoDocker,
  LogoGitHub,
  LogoGoogleCloud,
  LogoOffice365,
} from '../components/common/logos';

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
Explore (added to Wazuh dashboard default categories): 100
Endpoint security: 200
Threat intelligence: 300
Security operations: 400
Cloud security: 500
Agents management: 600
Server management: 700
Indexer management (added to Wazuh dashboard default categories): 9000
Dashboard management
*/

export const overview = {
  category: 'wz-category-home',
  id: 'wz-home',
  title: i18n.translate('wz-app-home-title', {
    defaultMessage: 'Overview',
  }),
  breadcrumbLabel: i18n.translate('wz-app-home-breadcrumbLabel', {
    defaultMessage: 'Overview',
  }),
  description: i18n.translate('wz-app-overview-description', {
    defaultMessage:
      'This application provides you with an overview of applications.',
  }),
  euiIconType: 'lensApp',
  order: 1,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () =>
    `/overview/${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `?agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const configurationAssessment = {
  category: 'wz-category-endpoint-security',
  id: 'configuration-assessment',
  title: i18n.translate('wz-app-configuration-assessment-title', {
    defaultMessage: 'Configuration Assessment',
  }),
  breadcrumbLabel: i18n.translate(
    'wz-app-configuration-assessment-breadcrumbLabel',
    {
      defaultMessage: 'Configuration Assessment',
    },
  ),
  description: i18n.translate('wz-app-configuration-assessment-description', {
    defaultMessage:
      'Scan your assets as part of a configuration assessment audit.',
  }),
  order: 200,
  euiIconType: 'managementApp',
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=sca&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const malwareDetection = {
  category: 'wz-category-endpoint-security',
  id: 'malware-detection',
  title: i18n.translate('wz-app-malware-detection-title', {
    defaultMessage: 'Malware Detection',
  }),
  breadcrumbLabel: i18n.translate('wz-app-malware-detection-breadcrumbLabel', {
    defaultMessage: 'Malware Detection',
  }),
  description: i18n.translate('wz-app-malware-detection-description', {
    defaultMessage:
      'Check indicators of compromise triggered by malware infections or cyberattacks.',
  }),
  euiIconType: 'indexRollupApp',
  order: 201,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=pm&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const fileIntegrityMonitoring = {
  category: 'wz-category-endpoint-security',
  id: 'file-integrity-monitoring',
  title: i18n.translate('wz-app-file-integrity-monitoring-title', {
    defaultMessage: 'File Integrity Monitoring',
  }),
  breadcrumbLabel: i18n.translate(
    'wz-app-file-integrity-monitoring-breadcrumbLabel',
    {
      defaultMessage: 'File Integrity Monitoring',
    },
  ),
  description: i18n.translate('wz-app-file-integrity-monitoring-description', {
    defaultMessage:
      'Alerts related to file changes, including permissions, content, ownership, and attributes.',
  }),
  euiIconType: 'sqlApp',
  showInOverviewApp: true,
  showInAgentMenu: true,
  order: 202,
  redirectTo: () =>
    `/overview/?tab=fim&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const threatHunting = {
  category: 'wz-category-threat-intelligence',
  id: 'threat-hunting',
  title: i18n.translate('wz-app-threat-hunting-title', {
    defaultMessage: 'Threat Hunting',
  }),
  breadcrumbLabel: i18n.translate('wz-app-threat-hunting-breadcrumbLabel', {
    defaultMessage: 'Threat Hunting',
  }),
  description: i18n.translate('wz-app-threat-hunting-description', {
    defaultMessage:
      'Browse through your security alerts, identifying issues and threats in your environment.',
  }),
  euiIconType: 'securityAnalyticsApp',
  order: 300,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=general&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const vulnerabilityDetection = {
  category: 'wz-category-threat-intelligence',
  id: 'vulnerability-detection',
  title: i18n.translate('wz-app-vulnerability-detection-title', {
    defaultMessage: 'Vulnerability Detection',
  }),
  breadcrumbLabel: i18n.translate(
    'wz-app-vulnerability-detection-breadcrumbLabel',
    {
      defaultMessage: 'Vulnerability Detection',
    },
  ),
  description: i18n.translate('wz-app-vulnerability-detection-description', {
    defaultMessage:
      'Discover what applications in your environment are affected by well-known vulnerabilities.',
  }),
  euiIconType: 'heartbeatApp',
  order: 301,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=vuls&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const mitreAttack = {
  category: 'wz-category-threat-intelligence',
  id: 'mitre-attack',
  title: i18n.translate('wz-app-mitre-attack-title', {
    defaultMessage: 'MITRE ATT&CK',
  }),
  breadcrumbLabel: i18n.translate('wz-app-mitre-attack-breadcrumbLabel', {
    defaultMessage: 'MITRE ATT&CK',
  }),
  description: i18n.translate('wz-app-mitre-attack-description', {
    defaultMessage:
      'Explore security alerts mapped to adversary tactics and techniques for better threat understanding.',
  }),
  euiIconType: 'grokApp',
  order: 302,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=mitre&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const pciDss = {
  category: 'wz-category-security-operations',
  id: 'pci-dss',
  title: i18n.translate('wz-app-pci-dss-title', {
    defaultMessage: 'PCI DSS',
  }),
  breadcrumbLabel: i18n.translate('wz-app-pci-dss-breadcrumbLabel', {
    defaultMessage: 'PCI DSS',
  }),
  description: i18n.translate('wz-app-pci-dss-description', {
    defaultMessage:
      'Global security standard for entities that process, store, or transmit payment cardholder data.',
  }),
  euiIconType: 'visTagCloud',
  order: 400,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=pci&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const gdpr = {
  category: 'wz-category-security-operations',
  id: 'gdpr',
  title: i18n.translate('wz-app-gdpr-title', {
    defaultMessage: 'GDPR',
  }),
  breadcrumbLabel: i18n.translate('wz-app-gdpr-breadcrumbLabel', {
    defaultMessage: 'GDPR',
  }),
  description: i18n.translate('wz-app-gdpr-description', {
    defaultMessage:
      'General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.',
  }),
  euiIconType: 'visBarVertical',
  order: 401,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=gdpr&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const hipaa = {
  category: 'wz-category-security-operations',
  id: 'hipaa',
  title: i18n.translate('wz-app-hipaa-title', {
    defaultMessage: 'HIPAA',
  }),
  breadcrumbLabel: i18n.translate('wz-app-hipaa-breadcrumbLabel', {
    defaultMessage: 'HIPAA',
  }),
  description: i18n.translate('wz-app-hipaa-description', {
    defaultMessage:
      'Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.',
  }),
  euiIconType: 'monitoringApp',
  order: 402,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=hipaa&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const nist80053 = {
  category: 'wz-category-security-operations',
  id: 'nist-800-53',
  title: i18n.translate('wz-app-nist-800-53-title', {
    defaultMessage: 'NIST 800-53',
  }),
  breadcrumbLabel: i18n.translate('wz-app-nist-800-53-breadcrumbLabel', {
    defaultMessage: 'NIST 800-53',
  }),
  description: i18n.translate('wz-app-nist-800-53-description', {
    defaultMessage:
      'National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.',
  }),
  euiIconType: 'notebookApp',
  showInOverviewApp: true,
  showInAgentMenu: true,
  order: 403,
  redirectTo: () =>
    `/overview/?tab=nist&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

const tsc = {
  category: 'wz-category-security-operations',
  id: 'tsc',
  title: i18n.translate('wz-app-tsc-title', {
    defaultMessage: 'TSC',
  }),
  breadcrumbLabel: i18n.translate('wz-app-tsc-breadcrumbLabel', {
    defaultMessage: 'TSC',
  }),
  description: i18n.translate('wz-app-tsc-description', {
    defaultMessage:
      'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy.',
  }),
  euiIconType: 'packetbeatApp',
  order: 404,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=tsc&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const docker = {
  category: 'wz-category-cloud-security',
  id: 'docker',
  title: i18n.translate('wz-app-docker-title', {
    defaultMessage: 'Docker',
  }),
  breadcrumbLabel: i18n.translate('wz-app-docker-breadcrumbLabel', {
    defaultMessage: 'Docker',
  }),
  description: i18n.translate('wz-app-docker-description', {
    defaultMessage:
      'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.',
  }),
  euiIconType: LogoDocker,
  order: 500,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=docker&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const amazonWebServices = {
  category: 'wz-category-cloud-security',
  id: 'amazon-web-services',
  title: i18n.translate('wz-app-amazon-web-services-title', {
    defaultMessage: 'Amazon Web Services',
  }),
  breadcrumbLabel: i18n.translate(
    'wz-app-amazon-web-services-breadcrumbLabel',
    {
      defaultMessage: 'Amazon Web Services',
    },
  ),
  description: i18n.translate('wz-app-amazon-web-services-description', {
    defaultMessage:
      'Security events related to your Amazon AWS services, collected directly via AWS API.',
  }),
  euiIconType: 'logoAWSMono',
  order: 501,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=aws&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const googleCloud = {
  category: 'wz-category-cloud-security',
  id: 'google-cloud',
  title: i18n.translate('wz-app-google-cloud-title', {
    defaultMessage: 'Google Cloud',
  }),
  breadcrumbLabel: i18n.translate('wz-app-google-cloud-breadcrumbLabel', {
    defaultMessage: 'Google Cloud',
  }),
  description: i18n.translate('wz-app-google-cloud-description', {
    defaultMessage:
      'Security events related to your Google Cloud Platform services, collected directly via GCP API.',
  }),
  euiIconType: LogoGoogleCloud,
  order: 502,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=gcp&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const github = {
  category: 'wz-category-cloud-security',
  id: 'github',
  title: i18n.translate('wz-app-github-title', {
    defaultMessage: 'GitHub',
  }),
  breadcrumbLabel: i18n.translate('wz-app-github-breadcrumbLabel', {
    defaultMessage: 'GitHub',
  }),
  description: i18n.translate('wz-app-github-description', {
    defaultMessage:
      'Monitoring events from audit logs of your GitHub organizations.',
  }),
  euiIconType: LogoGitHub,
  order: 503,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=github&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const office365 = {
  category: 'wz-category-cloud-security',
  id: 'office365',
  title: i18n.translate('wz-app-office365-title', {
    defaultMessage: 'Office 365',
  }),
  breadcrumbLabel: i18n.translate('wz-app-office365-breadcrumbLabel', {
    defaultMessage: 'Office 365',
  }),
  description: i18n.translate('wz-app-office365-description', {
    defaultMessage: 'Security events related to your Office 365 services.',
  }),
  euiIconType: LogoOffice365,
  order: 504,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=office&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const azure = {
  category: 'wz-category-cloud-security',
  id: 'azure',
  title: i18n.translate('wz-app-azure-title', {
    defaultMessage: 'Azure',
  }),
  breadcrumbLabel: i18n.translate('wz-app-azure-breadcrumbLabel', {
    defaultMessage: 'Azure',
  }),
  description: i18n.translate('wz-app-azure-description', {
    defaultMessage:
      'Security events related to your Azure services, collected directly via Azure API.',
  }),
  euiIconType: 'logoAzureMono',
  order: 505,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=azure&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const endpointSummary = {
  category: 'wz-category-agents-management',
  id: 'endpoints-summary',
  title: i18n.translate('wz-app-endpoints-summary-title', {
    defaultMessage: 'Summary',
  }),
  breadcrumbLabel: i18n.translate('wz-app-endpoints-summary-breadcrumbLabel', {
    defaultMessage: 'Endpoints',
  }),
  description: i18n.translate('wz-app-endpoints-summary-description', {
    defaultMessage: 'Summary of agents and their status.',
  }),
  euiIconType: 'spacesApp',
  order: 600,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/agents-preview/',
};

export const endpointGroups = {
  category: 'wz-category-agents-management',
  id: 'endpoint-groups',
  title: i18n.translate('wz-app-endpoint-groups-title', {
    defaultMessage: 'Groups',
  }),
  breadcrumbLabel: i18n.translate('wz-app-endpoint-groups-breadcrumbLabel', {
    defaultMessage: 'Groups',
  }),
  description: i18n.translate('wz-app-endpoint-groups-description', {
    defaultMessage: 'Manage your agent groups.',
  }),
  euiIconType: 'usersRolesApp',
  order: 601,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=groups',
};

export const rules = {
  category: 'wz-category-server-management',
  id: 'rules',
  title: i18n.translate('wz-app-rules-title', {
    defaultMessage: 'Rules',
  }),
  breadcrumbLabel: i18n.translate('wz-app-rules-breadcrumbLabel', {
    defaultMessage: 'Rules',
  }),
  description: i18n.translate('wz-app-rules-description', {
    defaultMessage: 'Manage your cluster rules.',
  }),
  euiIconType: 'indexRollupApp',
  order: 700,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=ruleset',
};

export const decoders = {
  category: 'wz-category-server-management',
  id: 'decoders',
  title: i18n.translate('wz-app-decoders-title', {
    defaultMessage: 'Decoders',
  }),
  breadcrumbLabel: i18n.translate('wz-app-decoders-breadcrumbLabel', {
    defaultMessage: 'Decoders',
  }),
  description: i18n.translate('wz-app-decoders-description', {
    defaultMessage: 'Manage your cluster decoders.',
  }),
  euiIconType: 'indexRollupApp',
  order: 701,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=decoders',
};

export const cdbLists = {
  category: 'wz-category-server-management',
  id: 'cdb-lists',
  title: i18n.translate('wz-app-lists-title', {
    defaultMessage: 'CDB Lists',
  }),
  breadcrumbLabel: i18n.translate('wz-app-cdb-lists-breadcrumbLabel', {
    defaultMessage: 'CDB Lists',
  }),
  description: i18n.translate('wz-app-cdb-lists-description', {
    defaultMessage: 'Manage your cluster CDB list.',
  }),
  euiIconType: 'indexRollupApp',
  order: 702,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=lists',
};

export const serverStatus = {
  category: 'wz-category-server-management',
  id: 'server-status',
  title: i18n.translate('wz-app-status-title', {
    defaultMessage: 'Status',
  }),
  breadcrumbLabel: i18n.translate('wz-app-server-status-breadcrumbLabel', {
    defaultMessage: 'Status',
  }),
  description: i18n.translate('wz-app-server-status-description', {
    defaultMessage: 'Manage your cluster status.',
  }),
  euiIconType: 'indexRollupApp',
  order: 703,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=status',
};

export const cluster = {
  category: 'wz-category-server-management',
  id: 'cluster',
  title: i18n.translate('wz-app-cluster-title', {
    defaultMessage: 'Cluster',
  }),
  breadcrumbLabel: i18n.translate('wz-app-cluster-breadcrumbLabel', {
    defaultMessage: 'Cluster',
  }),
  description: i18n.translate('wz-app-cluster-description', {
    defaultMessage: 'Manage your cluster.',
  }),
  euiIconType: 'indexRollupApp',
  order: 704,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=monitoring',
};

export const statistics = {
  category: 'wz-category-server-management',
  id: 'statistics',
  title: i18n.translate('wz-app-statistics-title', {
    defaultMessage: 'Statistics',
  }),
  breadcrumbLabel: i18n.translate('wz-app-statistics-breadcrumbLabel', {
    defaultMessage: 'Statistics',
  }),
  description: i18n.translate('wz-app-statistics-description', {
    defaultMessage: 'Information about the enviroment.',
  }),
  euiIconType: 'indexRollupApp',
  order: 705,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=statistics',
};

export const logs = {
  category: 'wz-category-server-management',
  id: 'logs',
  title: i18n.translate('wz-app-logs-title', {
    defaultMessage: 'Logs',
  }),
  breadcrumbLabel: i18n.translate('wz-app-logs-breadcrumbLabel', {
    defaultMessage: 'Logs',
  }),
  description: i18n.translate('wz-app-logs-description', {
    defaultMessage: 'Logs from your cluster.',
  }),
  euiIconType: 'indexRollupApp',
  order: 706,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=logs',
};

export const settings = {
  category: 'wz-category-server-management',
  id: 'dashboards-settings',
  title: i18n.translate('wz-app-settings-title', {
    defaultMessage: 'Settings',
  }),
  breadcrumbLabel: i18n.translate('wz-app-settings-breadcrumbLabel', {
    defaultMessage: 'Settings',
  }),
  description: i18n.translate('wz-app-settings-description', {
    defaultMessage: 'Manage your cluster configuration.',
  }),
  euiIconType: 'indexRollupApp',
  order: 707,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=configuration',
};

export const devTools = {
  category: 'wz-category-server-management',
  id: 'dev-tools',
  title: i18n.translate('wz-app-dev-tools-title', {
    defaultMessage: 'Dev Tools',
  }),
  breadcrumbLabel: i18n.translate('wz-app-dev-tools-breadcrumbLabel', {
    defaultMessage: 'Dev Tools',
  }),
  description: i18n.translate('wz-app-dev-tools-description', {
    defaultMessage: 'Test the API endpoints.',
  }),
  euiIconType: 'devToolsApp',
  order: 708,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/wazuh-dev?tab=devTools',
};

export const rulesetTest = {
  category: 'wz-category-server-management',
  id: 'ruleset-test',
  title: i18n.translate('wz-app-ruleset-test-title', {
    defaultMessage: 'Ruleset Test',
  }),
  breadcrumbLabel: i18n.translate('wz-app-ruleset-test-breadcrumbLabel', {
    defaultMessage: 'Ruleset Test',
  }),
  description: i18n.translate('wz-app-ruleset-test-description', {
    defaultMessage: 'Check your ruleset testing logs.',
  }),
  euiIconType: 'visualizeApp',
  order: 709,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/wazuh-dev?tab=logtest',
};

export const security = {
  category: 'wz-category-server-management',
  id: 'security',
  title: i18n.translate('wz-app-security-title', {
    defaultMessage: 'Security',
  }),
  breadcrumbLabel: i18n.translate('wz-app-security-breadcrumbLabel', {
    defaultMessage: 'Security',
  }),
  description: i18n.translate('wz-app-security-description', {
    defaultMessage:
      'Manage permissions to system resources based on the roles and policies.',
  }),
  euiIconType: 'securityAnalyticsApp',
  order: 710,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/security?tab=users',
};

export const sampleData = {
  category: 'management',
  id: 'sample-data',
  title: i18n.translate('wz-app-sample-data-title', {
    defaultMessage: 'Sample Data',
  }),
  breadcrumbLabel: i18n.translate('wz-app-sample-data-breadcrumbLabel', {
    defaultMessage: 'Sample Data',
  }),
  description: i18n.translate('wz-app-sample-data-description', {
    defaultMessage: 'Add sample data with events to the modules.',
  }),
  euiIconType: 'indexRollupApp',
  order: 9040,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=sample_data',
};

export const reporting = {
  category: 'wz-category-dashboard-management',
  id: 'reporting',
  title: i18n.translate('wz-app-reporting-title', {
    defaultMessage: 'Reporting',
  }),
  breadcrumbLabel: i18n.translate('wz-app-reporting-breadcrumbLabel', {
    defaultMessage: 'Reporting',
  }),
  description: i18n.translate('wz-app-reporting-description', {
    defaultMessage: 'Check your stored reports.',
  }),
  euiIconType: 'indexRollupApp',
  order: 10002,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=reporting',
};

export const serverApis = {
  category: 'wz-category-dashboard-management',
  id: 'server-apis',
  title: i18n.translate('wz-app-server-apis-title', {
    defaultMessage: 'Server APIs',
  }),
  breadcrumbLabel: i18n.translate('wz-app-server-apis-breadcrumbLabel', {
    defaultMessage: 'Server APIs',
  }),
  description: i18n.translate('wz-app-server-apis-description', {
    defaultMessage: 'Manage and configure the API entries.',
  }),
  euiIconType: 'indexRollupApp',
  order: 10003,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=api',
};

export const appSettings = {
  category: 'wz-category-dashboard-management',
  id: 'app-settings',
  title: i18n.translate('wz-app-settings-title', {
    defaultMessage: 'App Settings',
  }),
  breadcrumbLabel: i18n.translate('wz-app-settings-breadcrumbLabel', {
    defaultMessage: 'App Settings',
  }),
  description: i18n.translate('wz-app-settings-description', {
    defaultMessage: 'Manage your cluster configuration.',
  }),
  euiIconType: 'indexRollupApp',
  order: 10004,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=configuration',
};

const about = {
  category: 'wz-category-dashboard-management',
  id: 'about',
  title: i18n.translate('wz-app-about-title', {
    defaultMessage: 'About',
  }),
  breadcrumbLabel: i18n.translate('wz-app-about-breadcrumbLabel', {
    defaultMessage: 'About',
  }),
  description: i18n.translate('wz-app-about-description', {
    defaultMessage: 'Show information about App Versions and community links.',
  }),
  euiIconType: 'indexRollupApp',
  order: 10006,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=about',
};

export const ITHygiene = {
  category: 'wz-category-security-operations',
  id: 'it-hygiene',
  title: i18n.translate('wz-app-it-hygiene-title', {
    defaultMessage: 'IT Hygiene',
  }),
  breadcrumbLabel: i18n.translate('wz-app-it-hygiene-breadcrumbLabel', {
    defaultMessage: 'IT Hygiene',
  }),
  description: i18n.translate('wz-app-it-hygiene-description', {
    defaultMessage: 'Show information about IT Hygiene.',
  }),
  euiIconType: 'indexPatternApp',
  order: 405,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=it-hygiene&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const Applications = [
  fileIntegrityMonitoring,
  overview,
  malwareDetection,
  configurationAssessment,
  threatHunting,
  vulnerabilityDetection,
  mitreAttack,
  pciDss,
  hipaa,
  gdpr,
  nist80053,
  tsc,
  devTools,
  rulesetTest,
  security,
  azure,
  amazonWebServices,
  googleCloud,
  github,
  office365,
  docker,
  endpointSummary,
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
  serverApis,
  sampleData,
  appSettings,
  about,
  ITHygiene,
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
    order: 200,
    euiIconType: 'monitoringApp',
  },
  {
    id: 'wz-category-threat-intelligence',
    label: i18n.translate('wz-app-category-threat-intelligence', {
      defaultMessage: 'Threat intelligence',
    }),
    order: 300,
    euiIconType: 'lensApp',
  },
  {
    id: 'wz-category-security-operations',
    label: i18n.translate('wz-app-category-security-operations', {
      defaultMessage: 'Security operations',
    }),
    order: 400,
    euiIconType: 'securityApp',
  },
  {
    id: 'wz-category-cloud-security',
    label: i18n.translate('wz-app-category-cloud-security', {
      defaultMessage: 'Cloud security',
    }),
    order: 500,
    euiIconType: 'watchesApp',
  },
  {
    id: 'wz-category-agents-management',
    label: i18n.translate('wz-app-category-agents-management', {
      defaultMessage: 'Agents management',
    }),
    order: 600,
    euiIconType: 'graphApp',
  },
  {
    id: 'wz-category-system-inventory',
    label: i18n.translate('wz-app-category-system-inventory', {
      defaultMessage: 'System inventory',
    }),
    order: 650,
    euiIconType: 'packetbeatApp',
  },
  {
    id: 'wz-category-server-management',
    label: i18n.translate('wz-app-category-server-management', {
      defaultMessage: 'Server management',
    }),
    order: 700,
    euiIconType: 'indexRollupApp',
  },
  {
    id: 'management',
    label: 'Indexer management',
    order: 5e3,
    euiIconType: 'managementApp',
  },
  {
    id: 'wz-category-dashboard-management',
    label: i18n.translate('wz-app-category-dashboard-management', {
      defaultMessage: 'Dashboard management',
    }),
    order: 6e3,
    euiIconType: 'dashboardApp',
  },
];
