import { i18n } from '@osd/i18n';
import store from '../redux/store';
import {
  LogoDocker,
  LogoGitHub,
  LogoGoogleCloud,
  LogoMicrosoftGraphAPI,
  LogoOffice365,
} from '../components/common/logos';
import { getWzCurrentAppID } from '../kibana-services';

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
  title: i18n.translate('wazuh.home.app.title', {
    defaultMessage: 'Overview',
  }),
  breadcrumbLabel: i18n.translate('wazuh.home.app.breadcrumbLabel', {
    defaultMessage: 'Overview',
  }),
  description: i18n.translate('wazuh.home.app.description', {
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
  title: i18n.translate('wazuh.configurationAssessment.app.title', {
    defaultMessage: 'Configuration Assessment',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.configurationAssessment.app.breadcrumbLabel',
    {
      defaultMessage: 'Configuration Assessment',
    },
  ),
  description: i18n.translate('wazuh.configurationAssessment.app.description', {
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
  title: i18n.translate('wazuh.malwareDetection.app.title', {
    defaultMessage: 'Malware Detection',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.malwareDetection.app.breadcrumbLabel',
    {
      defaultMessage: 'Malware Detection',
    },
  ),
  description: i18n.translate('wazuh.malwareDetection.app.description', {
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
  title: i18n.translate('wazuh.fileIntegrityMonitoring.app.title', {
    defaultMessage: 'File Integrity Monitoring',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.fileIntegrityMonitoring.app.breadcrumbLabel',
    {
      defaultMessage: 'File Integrity Monitoring',
    },
  ),
  description: i18n.translate('wazuh.fileIntegrityMonitoring.app.description', {
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
  title: i18n.translate('wazuh.threatHunting.app.title', {
    defaultMessage: 'Threat Hunting',
  }),
  breadcrumbLabel: i18n.translate('wazuh.threatHunting.app.breadcrumbLabel', {
    defaultMessage: 'Threat Hunting',
  }),
  description: i18n.translate('wazuh.threatHunting.app.description', {
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
  title: i18n.translate('wazuh.vulnerabilityDetection.app.title', {
    defaultMessage: 'Vulnerability Detection',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.vulnerabilityDetection.app.breadcrumbLabel',
    {
      defaultMessage: 'Vulnerability Detection',
    },
  ),
  description: i18n.translate('wazuh.vulnerabilityDetection.app.description', {
    defaultMessage:
      'Discover what applications in your environment are affected by well-known vulnerabilities.',
  }),
  euiIconType: 'heartbeatApp',
  order: 302,
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
  title: i18n.translate('wazuh.mitreAttack.app.title', {
    defaultMessage: 'MITRE ATT&CK',
  }),
  breadcrumbLabel: i18n.translate('wazuh.mitreAttack.app.breadcrumbLabel', {
    defaultMessage: 'MITRE ATT&CK',
  }),
  description: i18n.translate('wazuh.mitreAttack.app.description', {
    defaultMessage:
      'Explore security alerts mapped to adversary tactics and techniques for better threat understanding.',
  }),
  euiIconType: 'grokApp',
  order: 301,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=mitre&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const caseManagement = {
  category: 'wz-category-threat-intelligence',
  id: 'case-management',
  title: i18n.translate('wazuh.caseManagement.app.title', {
    defaultMessage: 'Case Management',
  }),
  breadcrumbLabel: i18n.translate('wazuh.caseManagement.app.breadcrumbLabel', {
    defaultMessage: 'Case Management',
  }),
  description: i18n.translate('wazuh.caseManagement.app.description', {
    defaultMessage:
      'Track, triage, and manage cases created from security findings across your environment.',
  }),
  euiIconType: 'securityApp',
  order: 303,
  showInOverviewApp: true,
  showInAgentMenu: false,
  redirectTo: () =>
    `/overview/?tab=caseManagement&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const ITHygiene = {
  category: 'wz-category-security-operations',
  id: 'it-hygiene',
  title: i18n.translate('wazuh.itHygiene.app.title', {
    defaultMessage: 'IT Hygiene',
  }),
  breadcrumbLabel: i18n.translate('wazuh.itHygiene.app.breadcrumbLabel', {
    defaultMessage: 'IT Hygiene',
  }),
  description: i18n.translate('wazuh.itHygiene.app.description', {
    defaultMessage:
      'Assess system, software, processes, and network layers to detect misconfigurations, unauthorized changes, and anomalies.',
  }),
  euiIconType: 'indexPatternApp',
  order: 400,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=it-hygiene&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const activeResponses = {
  category: 'wz-category-security-operations',
  id: 'incident-response-dashboard',
  title: i18n.translate('wazuh.incidentResponse.app.title', {
    defaultMessage: 'Incident Response',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.incidentResponse.app.breadcrumbLabel',
    {
      defaultMessage: 'Incident Response',
    },
  ),
  description: i18n.translate('wazuh.incidentResponse.app.description', {
    defaultMessage:
      'Analyze the active response actions triggered across your environment.',
  }),
  euiIconType: 'bolt',
  order: 402,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=incident-response-dashboard&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const regulatoryCompliance = {
  category: 'wz-category-security-operations',
  id: 'regulatory-compliance',
  title: i18n.translate('wazuh.regulatoryCompliance.app.title', {
    defaultMessage: 'Regulatory Compliance',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.regulatoryCompliance.app.breadcrumbLabel',
    {
      defaultMessage: 'Regulatory Compliance',
    },
  ),
  description: i18n.translate('wazuh.regulatoryCompliance.app.description', {
    defaultMessage:
      'Assess compliance with regulatory frameworks including PCI DSS, GDPR, HIPAA, NIST 800-53, TSC, CMMC, FedRAMP, ISO 27001, NIST2 and NIST 800-171.',
  }),
  euiIconType: 'usersRolesApp',
  order: 401,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=regulatory-compliance&tabView=pci-dss&tabSubView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const docker = {
  category: 'wz-category-cloud-security',
  id: 'docker',
  title: i18n.translate('wazuh.docker.app.title', {
    defaultMessage: 'Docker',
  }),
  breadcrumbLabel: i18n.translate('wazuh.docker.app.breadcrumbLabel', {
    defaultMessage: 'Docker',
  }),
  description: i18n.translate('wazuh.docker.app.description', {
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
  title: i18n.translate('wazuh.amazonWebServices.app.title', {
    defaultMessage: 'Amazon Web Services',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.amazonWebServices.app.breadcrumbLabel',
    {
      defaultMessage: 'Amazon Web Services',
    },
  ),
  description: i18n.translate('wazuh.amazonWebServices.app.description', {
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
  title: i18n.translate('wazuh.googleCloud.app.title', {
    defaultMessage: 'Google Cloud',
  }),
  breadcrumbLabel: i18n.translate('wazuh.googleCloud.app.breadcrumbLabel', {
    defaultMessage: 'Google Cloud',
  }),
  description: i18n.translate('wazuh.googleCloud.app.description', {
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
  title: i18n.translate('wazuh.github.app.title', {
    defaultMessage: 'GitHub',
  }),
  breadcrumbLabel: i18n.translate('wazuh.github.app.breadcrumbLabel', {
    defaultMessage: 'GitHub',
  }),
  description: i18n.translate('wazuh.github.app.description', {
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
  title: i18n.translate('wazuh.office365.app.title', {
    defaultMessage: 'Office 365',
  }),
  breadcrumbLabel: i18n.translate('wazuh.office365.app.breadcrumbLabel', {
    defaultMessage: 'Office 365',
  }),
  description: i18n.translate('wazuh.office365.app.description', {
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

export const microsoftGraphAPI = {
  category: 'wz-category-cloud-security',
  id: 'microsoft-graph-api',
  title: i18n.translate('wazuh.microsoftGraphApi.app.title', {
    defaultMessage: 'Microsoft Graph API',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.microsoftGraphApi.app.breadcrumbLabel',
    {
      defaultMessage: 'Microsoft Graph API',
    },
  ),
  description: i18n.translate('wazuh.microsoftGraphApi.app.description', {
    defaultMessage:
      'Security events related to your Microsoft Graph services, collected directly via Microsoft Graph API.',
  }),
  euiIconType: LogoMicrosoftGraphAPI,
  order: 505,
  showInOverviewApp: true,
  showInAgentMenu: true,
  redirectTo: () =>
    `/overview/?tab=microsoftGraphAPI&tabView=dashboard${
      store.getState()?.appStateReducers?.currentAgentData?.id
        ? `&agentId=${store.getState()?.appStateReducers?.currentAgentData?.id}`
        : ''
    }`,
};

export const CloudSecurityApplications = [
  docker,
  amazonWebServices,
  googleCloud,
  github,
  office365,
  microsoftGraphAPI,
];

export const endpointSummary = {
  category: 'wz-category-agents-management',
  id: 'endpoints-summary',
  title: i18n.translate('wazuh.endpointsSummary.app.title', {
    defaultMessage: 'Summary',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.endpointsSummary.app.breadcrumbLabel',
    {
      defaultMessage: 'Summary',
    },
  ),
  description: i18n.translate('wazuh.endpointsSummary.app.description', {
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
  title: i18n.translate('wazuh.endpointGroups.app.title', {
    defaultMessage: 'Groups',
  }),
  breadcrumbLabel: i18n.translate('wazuh.endpointGroups.app.breadcrumbLabel', {
    defaultMessage: 'Groups',
  }),
  description: i18n.translate('wazuh.endpointGroups.app.description', {
    defaultMessage: 'Manage your agent groups.',
  }),
  euiIconType: 'usersRolesApp',
  order: 601,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/manager/?tab=groups',
};

export const enrollmentTokens = {
  category: 'wz-category-agents-management',
  id: 'enrollment-tokens',
  title: i18n.translate('wazuh.enrollmentTokens.app.title', {
    defaultMessage: 'Enrollment tokens',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.enrollmentTokens.app.breadcrumbLabel',
    {
      defaultMessage: 'Enrollment tokens',
    },
  ),
  description: i18n.translate('wazuh.enrollmentTokens.app.description', {
    defaultMessage: 'Create, review and revoke the tokens agents enroll with.',
  }),
  euiIconType: 'lock',
  order: 602,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/enrollment-tokens/',
};

export const serverStatus = {
  category: 'wz-category-server-management',
  id: 'server-status',
  title: i18n.translate('wazuh.serverStatus.app.title', {
    defaultMessage: 'Status',
  }),
  breadcrumbLabel: i18n.translate('wazuh.serverStatus.app.breadcrumbLabel', {
    defaultMessage: 'Status',
  }),
  description: i18n.translate('wazuh.serverStatus.app.description', {
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
  title: i18n.translate('wazuh.cluster.app.title', {
    defaultMessage: 'Cluster',
  }),
  breadcrumbLabel: i18n.translate('wazuh.cluster.app.breadcrumbLabel', {
    defaultMessage: 'Cluster',
  }),
  description: i18n.translate('wazuh.cluster.app.description', {
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
  title: i18n.translate('wazuh.statistics.app.title', {
    defaultMessage: 'Statistics',
  }),
  breadcrumbLabel: i18n.translate('wazuh.statistics.app.breadcrumbLabel', {
    defaultMessage: 'Statistics',
  }),
  description: i18n.translate('wazuh.statistics.app.description', {
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
  title: i18n.translate('wazuh.logs.app.title', {
    defaultMessage: 'Logs',
  }),
  breadcrumbLabel: i18n.translate('wazuh.logs.app.breadcrumbLabel', {
    defaultMessage: 'Logs',
  }),
  description: i18n.translate('wazuh.logs.app.description', {
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
  title: i18n.translate('wazuh.dashboardsSettings.app.title', {
    defaultMessage: 'Settings',
  }),
  breadcrumbLabel: i18n.translate(
    'wazuh.dashboardsSettings.app.breadcrumbLabel',
    {
      defaultMessage: 'Settings',
    },
  ),
  description: i18n.translate('wazuh.dashboardsSettings.app.description', {
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
  title: i18n.translate('wazuh.devTools.app.title', {
    defaultMessage: 'Dev Tools',
  }),
  breadcrumbLabel: i18n.translate('wazuh.devTools.app.breadcrumbLabel', {
    defaultMessage: 'Dev Tools',
  }),
  description: i18n.translate('wazuh.devTools.app.description', {
    defaultMessage: 'Test the API endpoints.',
  }),
  euiIconType: 'devToolsApp',
  order: 708,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/wazuh-dev?tab=devTools',
};

export const security = {
  category: 'wz-category-server-management',
  id: 'security',
  title: i18n.translate('wazuh.security.app.title', {
    defaultMessage: 'Security',
  }),
  breadcrumbLabel: i18n.translate('wazuh.security.app.breadcrumbLabel', {
    defaultMessage: 'Security',
  }),
  description: i18n.translate('wazuh.security.app.description', {
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
  title: i18n.translate('wazuh.sampleData.app.title', {
    defaultMessage: 'Sample Data',
  }),
  breadcrumbLabel: i18n.translate('wazuh.sampleData.app.breadcrumbLabel', {
    defaultMessage: 'Sample Data',
  }),
  description: i18n.translate('wazuh.sampleData.app.description', {
    defaultMessage: 'Add sample data with events to the modules.',
  }),
  euiIconType: 'indexRollupApp',
  order: 9040,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=sample_data',
};

export const indexerSettings = {
  category: 'management',
  id: 'indexer-settings',
  title: i18n.translate('wazuh.indexerSettings.app.title', {
    defaultMessage: 'Settings',
  }),
  breadcrumbLabel: i18n.translate('wazuh.indexerSettings.app.breadcrumbLabel', {
    defaultMessage: 'Settings',
  }),
  description: i18n.translate('wazuh.indexerSettings.app.description', {
    defaultMessage: 'Configure Indexer settings.',
  }),
  euiIconType: 'indexRollupApp',
  order: 9070,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=indexer_settings',
};

export const serverApis = {
  category: 'wz-category-dashboard-management',
  id: 'server-apis',
  title: i18n.translate('wazuh.serverApis.app.title', {
    defaultMessage: 'Server API',
  }),
  breadcrumbLabel: i18n.translate('wazuh.serverApis.app.breadcrumbLabel', {
    defaultMessage: 'Server API',
  }),
  description: i18n.translate('wazuh.serverApis.app.description', {
    defaultMessage: 'View and manage the server API connection.',
  }),
  euiIconType: 'indexRollupApp',
  order: 10003,
  showInOverviewApp: false,
  showInAgentMenu: false,
  redirectTo: () => '/settings?tab=api',
};

const about = {
  category: 'wz-category-dashboard-management',
  id: 'about',
  title: i18n.translate('wazuh.about.app.title', {
    defaultMessage: 'About',
  }),
  breadcrumbLabel: i18n.translate('wazuh.about.app.breadcrumbLabel', {
    defaultMessage: 'About',
  }),
  description: i18n.translate('wazuh.about.app.description', {
    defaultMessage: 'Show information about App Versions and community links.',
  }),
  euiIconType: 'indexRollupApp',
  order: 10006,
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
  caseManagement,
  regulatoryCompliance,
  devTools,
  security,
  amazonWebServices,
  microsoftGraphAPI,
  googleCloud,
  office365,
  github,
  docker,
  endpointSummary,
  endpointGroups,
  enrollmentTokens,
  serverStatus,
  // cluster,
  statistics,
  logs,
  settings,
  serverApis,
  indexerSettings,
  // sampleData,
  about,
  ITHygiene,
  activeResponses,
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

// Derives a `?tab=...` search string from the currently active app's own
// redirectTo(), so query-param routers can fall back to their current
// app's default tab instead of rendering blank on an unknown/missing tab.
export const getCurrentAppDefaultTabSearch = (
  fallbackSearch: string,
): string => {
  const currentApp = Applications.find(({ id }) => getWzCurrentAppID() === id);
  const redirectPath = currentApp?.redirectTo();

  if (redirectPath) {
    const queryIndex = redirectPath.indexOf('?');

    if (queryIndex !== -1) {
      return redirectPath.slice(queryIndex);
    }
  }

  return fallbackSearch;
};

// Categories
export const Categories = [
  {
    id: 'wz-category-home',
    label: i18n.translate('wazuh.core.appCategories.home', {
      defaultMessage: 'Home',
    }),
    order: 0,
    euiIconType: 'appSearchApp',
  },
  {
    id: 'wz-category-endpoint-security',
    label: i18n.translate('wazuh.core.appCategories.endpointSecurity', {
      defaultMessage: 'Endpoint security',
    }),
    order: 200,
    euiIconType: 'monitoringApp',
  },
  {
    id: 'wz-category-threat-intelligence',
    label: i18n.translate('wazuh.core.appCategories.threatIntelligence', {
      defaultMessage: 'Threat intelligence',
    }),
    order: 300,
    euiIconType: 'lensApp',
  },
  {
    id: 'wz-category-security-operations',
    label: i18n.translate('wazuh.core.appCategories.securityOperations', {
      defaultMessage: 'Security operations',
    }),
    order: 400,
    euiIconType: 'securityApp',
  },
  {
    id: 'wz-category-cloud-security',
    label: i18n.translate('wazuh.core.appCategories.cloudSecurity', {
      defaultMessage: 'Cloud security',
    }),
    order: 500,
    euiIconType: 'watchesApp',
  },
  {
    id: 'wz-category-agents-management',
    label: i18n.translate('wazuh.core.appCategories.agentsManagement', {
      defaultMessage: 'Agents management',
    }),
    order: 600,
    euiIconType: 'graphApp',
  },
  {
    id: 'wz-category-system-inventory',
    label: i18n.translate('wazuh.core.appCategories.systemInventory', {
      defaultMessage: 'System inventory',
    }),
    order: 650,
    euiIconType: 'packetbeatApp',
  },
  {
    id: 'wz-category-server-management',
    label: i18n.translate('wazuh.core.appCategories.serverManagement', {
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
    label: i18n.translate('wazuh.core.appCategories.dashboardManagement', {
      defaultMessage: 'Dashboard management',
    }),
    order: 6e3,
    euiIconType: 'dashboardApp',
  },
];
