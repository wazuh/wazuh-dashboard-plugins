import { i18n } from '@osd/i18n';
import store from '../redux/store';
import {
  LogoDocker,
  LogoGitHub,
  LogoGoogleCloud,
  LogoOffice365,
} from '../components/common/logos';
import { DEFAULT_APP_CATEGORIES } from '../../../../src/core/public';

export const Applications = [
  {
    category: 'wz-category-endpoint-security',
    id: 'wz-home',
    title: i18n.translate('wz-app-home', {
      defaultMessage: 'Overview',
    }),
    description: 'This application provides you with an overview of Wazuh Apps',
    euiIconType: 'lensApp',
    redirectTo: () => '/overview/',
  },
  {
    category: 'wz-category-endpoint-security',
    id: 'endpoints-summary',
    title: i18n.translate('wz-app-endpoints-summary', {
      defaultMessage: 'Endpoints summary',
    }),
    description: 'Summary of agents and their status.',
    euiIconType: 'usersRolesApp',
    redirectTo: () => '/agents-preview/',
  },
  {
    category: 'wz-category-endpoint-security',
    id: 'integrity-monitoring',
    title: i18n.translate('wz-app-integrity-monitoring', {
      defaultMessage: 'Integrity monitoring',
    }),
    description:
      'Alerts related to file changes, including permissions, content, ownership and attributes.',
    euiIconType: 'indexRollupApp',
    redirectTo: () =>
      `/overview/?tab=fim&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-endpoint-security',
    id: 'policy-monitoring',
    title: i18n.translate('wz-app-policy-monitoring', {
      defaultMessage: 'Policy monitoring',
    }),
    description:
      'Verify that your systems are configured according to your security policies baseline.',
    euiIconType: 'indexRollupApp',
    redirectTo: () =>
      `/overview/?tab=pm&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-endpoint-security',
    id: 'security-configuration-assessment',
    title: i18n.translate('wz-app-security-configuration-assessment', {
      defaultMessage: 'Security configuration assessment',
    }),
    description:
      'Scan your assets as part of a configuration assessment audit.',
    euiIconType: 'managementApp',
    redirectTo: () =>
      `/overview/?tab=sca&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-endpoint-security',
    id: 'system-auditing',
    title: i18n.translate('wz-app-system-auditing', {
      defaultMessage: 'System auditing',
    }),
    description:
      'Audit users behavior, monitoring command execution and alerting on access to critical files.',
    euiIconType: 'searchProfilerApp',
    redirectTo: () =>
      `/overview/?tab=audit&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-endpoint-security',
    id: 'openscap',
    title: i18n.translate('wz-app-openscap', {
      defaultMessage: 'OpenSCAP',
    }),
    description:
      'Configuration assessment and automation of compliance monitoring using SCAP checks.',
    euiIconType: 'metricbeatApp',
    redirectTo: () =>
      `/overview/?tab=oscap&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-endpoint-security',
    id: 'ciscat',
    title: i18n.translate('wz-app-ciscat', {
      defaultMessage: 'CIS-CAT',
    }),
    description:
      'Configuration assessment using Center of Internet Security scanner and SCAP checks.',
    euiIconType: 'metricbeatApp',
    redirectTo: () =>
      `/overview/?tab=ciscat&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-thread-intelligence',
    id: 'security-events',
    title: i18n.translate('wz-app-security-events', {
      defaultMessage: 'Security events',
    }),
    description:
      'Browse through your security alerts, identifying issues and threats in your environment.',
    euiIconType: 'securityAnalyticsApp',
    redirectTo: () =>
      `/overview/?tab=general&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-thread-intelligence',
    id: 'vulnerabilities',
    title: i18n.translate('wz-app-vulnerabilities', {
      defaultMessage: 'Vulnerabilities',
    }),
    description:
      'Discover what applications in your environment are affected by well-known vulnerabilities.',
    euiIconType: 'heartbeatApp',
    redirectTo: () =>
      `/overview/?tab=vuls&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-thread-intelligence',
    id: 'mitre-attack',
    title: i18n.translate('wz-app-mitre-attack', {
      defaultMessage: 'MITRE ATT&CK',
    }),
    description:
      'Security events from the knowledge base of adversary tactics and techniques based on real-world observations',
    euiIconType: 'grokApp',
    redirectTo: () =>
      `/overview/?tab=mitre&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-thread-intelligence',
    id: 'virustotal',
    title: i18n.translate('wz-app-virustotal', {
      defaultMessage: 'Virustotal',
    }),
    description:
      'Alerts resulting from VirusTotal analysis of suspicious files via an integration with their API.',
    euiIconType: 'monitoringApp',
    redirectTo: () =>
      `/overview/?tab=virustotal&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-security-operations',
    id: 'pci-dss',
    title: i18n.translate('wz-app-pci-dss', {
      defaultMessage: 'PCI DSS',
    }),
    description:
      'Global security standard for entities that process, store or transmit payment cardholder data.',
    euiIconType: 'sqlApp',
    redirectTo: () =>
      `/overview/?tab=pci&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-security-operations',
    id: 'hipaa',
    title: i18n.translate('wz-app-hipaa', {
      defaultMessage: 'HIPAA',
    }),
    description:
      'Health Insurance Portability and Accountability Act of 1996 (HIPAA) provides data privacy and security provisions for safeguarding medical information.',
    euiIconType: 'monitoringApp',
    redirectTo: () =>
      `/overview/?tab=hipaa&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-security-operations',
    id: 'gdpr',
    title: i18n.translate('wz-app-gdpr', {
      defaultMessage: 'GDPR',
    }),
    description:
      'General Data Protection Regulation (GDPR) sets guidelines for processing of personal data.',
    euiIconType: 'sqlApp',
    redirectTo: () =>
      `/overview/?tab=gdpr&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-security-operations',
    id: 'nist-800-53',
    title: i18n.translate('wz-app-nist-800-53', {
      defaultMessage: 'NIST 800-53',
    }),
    description:
      'National Institute of Standards and Technology Special Publication 800-53 (NIST 800-53) sets guidelines for federal information systems.',
    euiIconType: 'notebookApp',
    redirectTo: () =>
      `/overview/?tab=nist&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-security-operations',
    id: 'tsc',
    title: i18n.translate('wz-app-tsc', {
      defaultMessage: 'TSC',
    }),
    description:
      'Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy',
    euiIconType: 'packetbeatApp',
    redirectTo: () =>
      `/overview/?tab=tsc&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-security-operations',
    id: 'it-hygiene',
    title: i18n.translate('wz-app-it-hygiene', {
      defaultMessage: 'IT Hygiene',
    }),
    description:
      'Applications, network configuration, open ports and processes running on your monitored systems.',
    euiIconType: 'visualizeApp',
    redirectTo: () =>
      `/agents/?tab=welcome${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agent=${store.getState()?.appStateReducers?.currentAgentData?.id}`
          : ''
      }`,
  },
  {
    category: 'wz-category-security-operations',
    id: 'osquery',
    title: i18n.translate('wz-app-osquery', {
      defaultMessage: 'Osquery',
    }),
    description:
      'Osquery can be used to expose an operating system as a high-performance relational database.',
    euiIconType: 'sqlApp',
    redirectTo: () =>
      `/overview/?tab=osquery&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-cloud-security',
    id: 'amazon-web-services',
    title: i18n.translate('wz-app-amazon-web-services', {
      defaultMessage: 'Amazon Web Services',
    }),
    description:
      'Security events related to your Amazon AWS services, collected directly via AWS API.',
    euiIconType: 'logoAWSMono',
    redirectTo: () =>
      `/overview/?tab=aws&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-cloud-security',
    id: 'google-cloud',
    title: i18n.translate('wz-app-google-cloud', {
      defaultMessage: 'Google Cloud',
    }),
    description:
      'Security events related to your Google Cloud Platform services, collected directly via GCP API.',
    euiIconType: LogoGoogleCloud,
    redirectTo: () =>
      `/overview/?tab=gcp&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-cloud-security',
    id: 'github',
    title: i18n.translate('wz-app-github', {
      defaultMessage: 'GitHub',
    }),
    description:
      'Monitoring events from audit logs of your GitHub organitations',
    euiIconType: LogoGitHub,
    redirectTo: () =>
      `/overview/?tab=github&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-cloud-security',
    id: 'office365',
    title: i18n.translate('wz-app-office365', {
      defaultMessage: 'Office 365',
    }),
    description: 'Security events related to your Office 365 services.',
    euiIconType: LogoOffice365,
    redirectTo: () =>
      `/overview/?tab=office&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-cloud-security',
    id: 'docker-listener',
    title: i18n.translate('wz-app-docker-listener', {
      defaultMessage: 'Docker listener',
    }),
    description:
      'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events.',
    euiIconType: LogoDocker,
    redirectTo: () =>
      `/overview/?tab=docker&tabView=panels${
        store.getState()?.appStateReducers?.currentAgentData?.id
          ? `&agentId=${
              store.getState()?.appStateReducers?.currentAgentData?.id
            }`
          : ''
      }`,
  },
  {
    category: 'wz-category-server-management',
    id: 'rules',
    title: i18n.translate('wz-app-rules', {
      defaultMessage: 'Rules',
    }),
    description: 'Manage your Wazuh cluster rules',
    euiIconType: 'indexRollupApp',
    redirectTo: () => '/manager/?tab=ruleset',
  },
  {
    category: 'wz-category-server-management',
    id: 'decoders',
    title: i18n.translate('wz-app-decoders', {
      defaultMessage: 'Decoders',
    }),
    description: 'Manage your Wazuh cluster decoders',
    euiIconType: 'indexRollupApp',
    redirectTo: () => '/manager/?tab=decoders',
  },
  {
    category: 'wz-category-server-management',
    id: 'cdb-lists',
    title: i18n.translate('wz-app-lists', {
      defaultMessage: 'CDB Lists',
    }),
    description: 'Manage your Wazuh cluster CDB list',
    euiIconType: 'indexRollupApp',
    redirectTo: () => '/manager/?tab=lists',
  },
  {
    category: 'wz-category-server-management',
    id: 'groups',
    title: i18n.translate('wz-app-groups', {
      defaultMessage: 'Groups',
    }),
    description: 'Manage your agent groups',
    euiIconType: 'usersRolesApp',
    redirectTo: () => '/manager/?tab=groups',
  },
  {
    category: 'wz-category-server-management',
    id: 'server-status',
    title: i18n.translate('wz-app-status', {
      defaultMessage: 'Status',
    }),
    description: 'Manage your Wazuh cluster status',
    euiIconType: 'uptimeApp',
    redirectTo: () => '/manager/?tab=status',
  },
  {
    category: 'wz-category-server-management',
    id: 'cluster',
    title: i18n.translate('wz-app-cluster', {
      defaultMessage: 'Cluster',
    }),
    description: 'Visualize your Wazuh cluster',
    euiIconType: 'indexPatternApp',
    redirectTo: () => '/manager/?tab=monitoring',
  },
  {
    category: 'wz-category-server-management',
    id: 'statistics',
    title: i18n.translate('wz-app-statistics', {
      defaultMessage: 'Statistics',
    }),
    description: 'Information about the Wazuh enviroment',
    euiIconType: 'visualizeApp',
    redirectTo: () => '/manager/?tab=statistics',
  },
  {
    category: 'wz-category-server-management',
    id: 'logs',
    title: i18n.translate('wz-app-logs', {
      defaultMessage: 'Logs',
    }),
    description: 'Logs from your Wazuh cluster',
    euiIconType: 'filebeatApp',
    redirectTo: () => '/manager/?tab=logs',
  },
  {
    category: 'wz-category-server-management',
    id: 'reporting',
    title: i18n.translate('wz-app-reporting', {
      defaultMessage: 'Reporting',
    }),
    description: 'Check your stored Wazuh reports',
    euiIconType: 'reportingApp',
    redirectTo: () => '/manager/?tab=reporting',
  },
  {
    category: 'wz-category-server-management',
    id: 'settings',
    title: i18n.translate('wz-app-settings', {
      defaultMessage: 'Settings',
    }),
    description: 'Manage your Wazuh cluster configuration',
    euiIconType: 'managementApp',
    redirectTo: () => '/manager/?tab=configuration',
  },
  {
    category: 'wz-category-server-management',
    id: 'api-console',
    title: i18n.translate('wz-app-api-console', {
      defaultMessage: 'API console',
    }),
    description: 'Test the Wazuh API endpoints.',
    euiIconType: 'uptimeApp',
    redirectTo: () => '/wazuh-dev/?tab=devTools',
  },
  {
    category: 'wz-category-server-management',
    id: 'ruleset-test',
    title: i18n.translate('wz-app-ruleset-test', {
      defaultMessage: 'Ruleset test',
    }),
    description: 'Check your ruleset testing logs.',
    euiIconType: 'consoleApp',
    redirectTo: () => '/wazuh-dev/?tab=logtest',
  },
  {
    category: 'wz-category-server-management',
    id: 'rbac',
    title: i18n.translate('wz-app-rbac', {
      defaultMessage: 'RBAC',
    }),
    description:
      'Manage permissions to system resources based on the roles and policies.',
    euiIconType: 'managementApp',
    redirectTo: () => '/security/?tab=users',
  },
  {
    category: 'management',
    id: 'server-api',
    title: i18n.translate('wz-app-server-api', {
      defaultMessage: 'Server API',
    }),
    description: 'Manage and configure the API entries.',
    euiIconType: 'devToolsApp',
    redirectTo: () => '/settings?tab=api',
  },
  {
    category: 'management',
    id: 'modules',
    title: i18n.translate('wz-app-modules', {
      defaultMessage: 'Modules',
    }),
    description: 'Manage your Wazuh App preview.',
    euiIconType: 'gisApp',
    redirectTo: () => '/settings?tab=modules',
  },
  {
    category: 'management',
    id: 'server-data',
    title: i18n.translate('wz-app-server-data', {
      defaultMessage: 'Server data',
    }),
    description: 'Add sample data with events to the modules',
    euiIconType: 'spacesApp',
    redirectTo: () => '/settings?tab=sample_data',
  },
  {
    category: 'management',
    id: 'configuration',
    title: i18n.translate('wz-app-configuration', {
      defaultMessage: 'Configuration',
    }),
    description: 'Manage your Wazuh cluster configuration',
    euiIconType: 'devToolsApp',
    redirectTo: () => '/settings?tab=configuration',
  },
  {
    category: 'management',
    id: 'app-logs',
    title: i18n.translate('wz-app-app-logs', {
      defaultMessage: 'Logs',
    }),
    description:
      'Log file located at /usr/share/wazuh-dashboard/data/wazuh/logs/wazuhapp.log',
    euiIconType: 'filebeatApp',
    redirectTo: () => '/settings?tab=logs',
  },
  {
    category: 'management',
    id: 'about',
    title: i18n.translate('wz-app-about', {
      defaultMessage: 'About',
    }),
    description: 'Show information about App Versions and community links.',
    euiIconType: 'graphApp',
    redirectTo: () => '/settings?tab=about',
  },
];

export const Categories = [
  {
    id: 'wz-category-endpoint-security',
    label: i18n.translate('wz-app-category-endpoint-security', {
      defaultMessage: 'Endpoint security',
    }),
    order: 1,
    euiIconType: 'monitoringApp',
  },
  {
    id: 'wz-category-thread-intelligence',
    label: i18n.translate('wz-app-category-thread-intelligence', {
      defaultMessage: 'Thread intelligence',
    }),
    order: 2,
    euiIconType: 'lensApp',
  },
  {
    id: 'wz-category-security-operations',
    label: i18n.translate('wz-app-category-security-operations', {
      defaultMessage: 'Security operations',
    }),
    order: 3,
    euiIconType: 'securityApp',
  },
  {
    id: 'wz-category-cloud-security',
    label: i18n.translate('wz-app-category-cloud-security', {
      defaultMessage: 'Cloud security',
    }),
    order: 4,
    euiIconType: 'watchesApp',
  },
  {
    id: 'wz-category-server-management',
    label: i18n.translate('wz-app-category-server-management', {
      defaultMessage: 'Server management',
    }),
    order: 5,
    euiIconType: 'indexRollupApp',
  },
  DEFAULT_APP_CATEGORIES.management,
];
