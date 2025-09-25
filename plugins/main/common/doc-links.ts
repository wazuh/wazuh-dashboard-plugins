import { webDocumentationLink } from './services/web_documentation';

export const DOC_LINKS = {
  GETTING_STARTED: {
    USE_CASES: Object.assign(
      {},
      webDocumentationLink('getting-started/use-cases/index.html'),
    ),
  },
  PCI_DSS: {
    POLICY_MONITORING: webDocumentationLink(
      'pci-dss/policy-monitoring.html',
      '4.2',
    ),
  },
  CLOUD_SECURITY: {
    GCP: webDocumentationLink('cloud-security/gcp/index.html'),
    OFFICE365: webDocumentationLink('cloud-security/office365/index.html'),
    GITHUB: webDocumentationLink('cloud-security/github/index.html'),
    AMAZON: webDocumentationLink('cloud-security/amazon/index.html'),
    AZURE: webDocumentationLink('cloud-security/azure/index.html'),
  },
  USER_MANUAL: {
    API: {
      REFERENCE: webDocumentationLink('user-manual/api/reference.html'),
      QUERIES: webDocumentationLink('user-manual/api/queries.html'),
      RBAC: {
        AUTH_CONTEXT: webDocumentationLink(
          'user-manual/api/rbac/auth-context.html',
        ),
      },
    },
    ELASTICSEARCH: {
      TROUBLESHOOTING: webDocumentationLink(
        'user-manual/elasticsearch/troubleshooting.html',
        '4.4',
      ),
    },
    WAZUH_DASHBOARD: {
      SETTINGS: webDocumentationLink(
        'user-manual/wazuh-dashboard/settings.html',
      ),
      QUERIES: webDocumentationLink('user-manual/wazuh-dashboard/queries.html'),
      TROUBLESHOOTING: webDocumentationLink(
        'user-manual/wazuh-dashboard/troubleshooting.html',
      ),
    },
    WAZUH_SERVER_CLUSTER: {
      CLUSTER_NODES_CONFIGURATION: webDocumentationLink(
        'user-manual/wazuh-server-cluster/cluster-nodes-configuration.html',
      ),
    },
    CAPABILITIES: Object.assign(
      {},
      webDocumentationLink('user-manual/capabilities/index.html'),
      {
        MALWARE_DETECTION: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/malware-detection/index.html',
          ),
          {
            VIRUS_TOTAL_INTEGRATION: webDocumentationLink(
              'user-manual/capabilities/malware-detection/virus-total-integration.html',
            ),
          },
        ),
        LOG_DATA_COLLECTION: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/log-data-collection/index.html',
          ),
          {
            MONITORING_LOG_FILES: webDocumentationLink(
              'user-manual/capabilities/log-data-collection/monitoring-log-files.html',
            ),
          },
        ),
        CONTAINER_SECURITY: {
          USE_CASES: webDocumentationLink(
            'user-manual/capabilities/container-security/use-cases.html',
          ),
        },
        VULNERABILITY_DETECTION: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/vulnerability-detection/index.html',
          ),
          {
            CONFIGURING_SCANS: webDocumentationLink(
              'user-manual/capabilities/vulnerability-detection/configuring-scans.html',
            ),
          },
        ),
        SYSTEM_INVENTORY: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/system-inventory/index.html',
          ),
          {
            OSQUERY: webDocumentationLink(
              'user-manual/capabilities/system-inventory/osquery.html',
            ),
          },
        ),
        FILE_INTEGRITY: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/file-integrity/index.html',
          ),
        ),
        POLICY_MONITORING: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/policy-monitoring/index.html',
            '4.8',
          ),
          {
            CISCAT: webDocumentationLink(
              'user-manual/capabilities/policy-monitoring/ciscat/ciscat.html',
              '4.8',
            ),
            OPENS_CAP: Object.assign(
              {},
              webDocumentationLink(
                'user-manual/capabilities/policy-monitoring/openscap/index.html',
                '4.8',
              ),
            ),
          },
        ),
        ACTIVE_RESPONSE: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/active-response/index.html',
          ),
        ),
        AGENTLESS_MONITORING: Object.assign(
          {},
          webDocumentationLink(
            'user-manual/capabilities/agentless-monitoring/index.html',
          ),
        ),
      },
    ),
    MANAGER: Object.assign(
      {},
      webDocumentationLink('user-manual/manager/index.html'),
      {
        INTEGRATION_WITH_EXTERNAL_APIS: webDocumentationLink(
          'user-manual/manager/integration-with-external-apis.html',
        ),
        ALERT_MANAGEMENT: webDocumentationLink(
          'user-manual/manager/alert-management.html',
        ),
        AUTOMATIC_REPORTS: webDocumentationLink(
          'user-manual/manager/automatic-reports.html',
          '4.6',
        ),
      },
    ),
    AGENT: {
      AGENT_ENROLLMENT: Object.assign(
        {},
        webDocumentationLink('user-manual/agent/agent-enrollment/index.html'),
        {
          SECURITY_OPTIONS: {
            USING_PASSWORD_AUTHENTICATION: webDocumentationLink(
              'user-manual/agent/agent-enrollment/security-options/using-password-authentication.html',
            ),
          },
        },
      ),
      AGENT_MANAGEMENT: {
        ANTIFLOODING: webDocumentationLink(
          'user-manual/agent/agent-management/antiflooding.html',
        ),
        AGENT_CONNECTION: webDocumentationLink(
          'user-manual/agent/agent-management/agent-connection.html',
        ),
        LABELS: webDocumentationLink(
          'user-manual/agent/agent-management/labels.html',
        ),
      },
    },
    REFERENCE: {
      DAEMONS: {
        WAZUH_REMOTED: webDocumentationLink(
          'user-manual/reference/daemons/wazuh-remoted.html',
        ),
      },
      OSSEC_CONF: Object.assign(
        {},
        webDocumentationLink('user-manual/reference/ossec-conf/index.html'),
        {
          CLIENT: webDocumentationLink(
            'user-manual/reference/ossec-conf/client.html',
          ),
          ACTIVE_RESPONSE: webDocumentationLink(
            'user-manual/reference/ossec-conf/active-response.html',
          ),
          COMMANDS: webDocumentationLink(
            'user-manual/reference/ossec-conf/commands.html',
          ),
          AGENTLESS: webDocumentationLink(
            'user-manual/reference/ossec-conf/agentless.html',
          ),
          EMAIL_ALERTS: webDocumentationLink(
            'user-manual/reference/ossec-conf/email-alerts.html',
          ),
          ALERTS: webDocumentationLink(
            'user-manual/reference/ossec-conf/alerts.html',
          ),
          LABELS: webDocumentationLink(
            'user-manual/reference/ossec-conf/labels.html',
          ),
          REPORTS: webDocumentationLink(
            'user-manual/reference/ossec-conf/reports.html',
          ),
          SYSLOG_OUTPUT: webDocumentationLink(
            'user-manual/reference/ossec-conf/syslog-output.html',
          ),
          WODLE_S3: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-s3.html',
          ),
          WODLE_AZURE_LOGS: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-azure-logs.html',
          ),
          WODLE_CISCAT: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-ciscat.html',
            '4.8',
          ),
          CLIENT_BUFFER: webDocumentationLink(
            'user-manual/reference/ossec-conf/client-buffer.html',
          ),
          GITHUB_MODULE: webDocumentationLink(
            'user-manual/reference/ossec-conf/github-module.html',
          ),
          OFFICE365_MODULE: webDocumentationLink(
            'user-manual/reference/ossec-conf/office365-module.html',
          ),
          CLUSTER: webDocumentationLink(
            'user-manual/reference/ossec-conf/cluster.html',
          ),
          WODLE_COMMAND: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-command.html',
          ),
          WODLE_DOCKER: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-docker.html',
          ),
          WODLE_OPENSCAP: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-openscap.html',
            '4.8',
          ),
          WODLE_OSQUERY: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-osquery.html',
          ),
          WODLE_SYSCOLLECTOR: webDocumentationLink(
            'user-manual/reference/ossec-conf/wodle-syscollector.html',
          ),
          SYSCHECK: webDocumentationLink(
            'user-manual/reference/ossec-conf/syscheck.html',
          ),
          GLOBAL: webDocumentationLink(
            'user-manual/reference/ossec-conf/global.html',
          ),
          LOGGING: webDocumentationLink(
            'user-manual/reference/ossec-conf/logging.html',
          ),
          REMOTE: webDocumentationLink(
            'user-manual/reference/ossec-conf/remote.html',
          ),
          GCP_PUBSUB: webDocumentationLink(
            'user-manual/reference/ossec-conf/gcp-pubsub.html',
          ),
          INTEGRATION: webDocumentationLink(
            'user-manual/reference/ossec-conf/integration.html',
          ),
          LOCALFILE: webDocumentationLink(
            'user-manual/reference/ossec-conf/localfile.html',
          ),
          SOCKET: webDocumentationLink(
            'user-manual/reference/ossec-conf/socket.html',
          ),
          ROOTCHECK: webDocumentationLink(
            'user-manual/reference/ossec-conf/rootcheck.html',
          ),
          AUTH: webDocumentationLink(
            'user-manual/reference/ossec-conf/auth.html',
          ),
          VULN_DETECTOR: webDocumentationLink(
            'user-manual/reference/ossec-conf/vuln-detector.html',
          ),
        },
      ),
    },
  },
  UPGRADE_GUIDE: {
    WAZUH_AGENT: Object.assign(
      {},
      webDocumentationLink('upgrade-guide/wazuh-agent/index.html'),
    ),
  },
  INSTALLATION_GUIDE: {
    WAZUH_AGENT: Object.assign(
      {},
      webDocumentationLink('installation-guide/wazuh-agent/index.html'),
    ),
  },
} as const;

export const DOC_LINKS_WITH_FRAGMENTS = {
  AGENT_CONNECTION_CHECKING_CONNECTION_WITH_THE_WAZUH_MANAGER:
    DOC_LINKS.USER_MANUAL.AGENT.AGENT_MANAGEMENT.AGENT_CONNECTION +
    '#checking-connection-with-the-wazuh-manager',
  ALERT_MANAGEMENT_CONFIGURING_EMAIL_ALERTS:
    DOC_LINKS.USER_MANUAL.MANAGER.ALERT_MANAGEMENT +
    '#configuring-email-alerts',
  ALERT_MANAGEMENT_SMTP_SERVER_WITH_AUTHENTICATION:
    DOC_LINKS.USER_MANUAL.MANAGER.ALERT_MANAGEMENT +
    '#smtp-server-with-authentication',
  ALERT_MANAGEMENT_CONFIGURING_SYSLOG_OUTPUT:
    DOC_LINKS.USER_MANUAL.MANAGER.ALERT_MANAGEMENT +
    '#configuring-syslog-output',
  OSSEC_CONF_CLIENT_GROUPS:
    DOC_LINKS.USER_MANUAL.REFERENCE.OSSEC_CONF.CLIENT + '#groups',
  OSSEC_CONF_CLIENT_ENROLLMENT_AGENT_NAME:
    DOC_LINKS.USER_MANUAL.REFERENCE.OSSEC_CONF.CLIENT +
    '#enrollment-agent-name',
  OSSEC_CONF_CLIENT_MANAGER_ADDRESS:
    DOC_LINKS.USER_MANUAL.REFERENCE.OSSEC_CONF.CLIENT + '#manager-address',
  WAZUH_DASHBOARD_TROUBLESHOOTING_WAZUH_SERVER_AND_WAZUH_DASHBOARD_VERSION_MISMATCH_ERROR:
    DOC_LINKS.USER_MANUAL.WAZUH_DASHBOARD.TROUBLESHOOTING +
    '#wazuh-server-and-wazuh-dashboard-version-mismatch-error',
  WAZUH_DASHBOARD_TROUBLESHOOTING_SAVED_OBJECT_FOR_INDEX_PATTERN_NOT_FOUND_ERROR:
    DOC_LINKS.USER_MANUAL.WAZUH_DASHBOARD.TROUBLESHOOTING +
    '#saved-object-for-index-pattern-not-found-error',
  VULNERABILITY_DETECTION_CONFIGURATION:
    DOC_LINKS.USER_MANUAL.CAPABILITIES.VULNERABILITY_DETECTION
      .CONFIGURING_SCANS + '#configuration',
} as const;
