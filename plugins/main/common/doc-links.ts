import { buildWebDocUrl } from './services/web_documentation';

export const DOC_LINKS = {
  GETTING_STARTED: {
    USE_CASES: {
      INDEX: buildWebDocUrl('getting-started/use-cases/index.html'),
    },
  },
  PCI_DSS: {
    POLICY_MONITORING: buildWebDocUrl('pci-dss/policy-monitoring.html', '4.2'),
  },
  CLOUD_SECURITY: {
    GCP: {
      INDEX: buildWebDocUrl('cloud-security/gcp/index.html'),
    },
    OFFICE365: {
      INDEX: buildWebDocUrl('cloud-security/office365/index.html'),
    },
    GITHUB: {
      INDEX: buildWebDocUrl('cloud-security/github/index.html'),
    },
    AMAZON: {
      INDEX: buildWebDocUrl('cloud-security/amazon/index.html'),
    },
    AZURE: {
      INDEX: buildWebDocUrl('cloud-security/azure/index.html'),
    },
  },
  USER_MANUAL: {
    API: {
      REFERENCE: buildWebDocUrl('user-manual/api/reference.html'),
      QUERIES: buildWebDocUrl('user-manual/api/queries.html'),
      RBAC: {
        AUTH_CONTEXT: buildWebDocUrl('user-manual/api/rbac/auth-context.html'),
      },
    },
    ELASTICSEARCH: {
      TROUBLESHOOTING: buildWebDocUrl(
        'user-manual/elasticsearch/troubleshooting.html',
        '4.4',
      ),
    },
    WAZUH_DASHBOARD: {
      SETTINGS: buildWebDocUrl('user-manual/wazuh-dashboard/settings.html'),
      QUERIES: buildWebDocUrl('user-manual/wazuh-dashboard/queries.html'),
      TROUBLESHOOTING: buildWebDocUrl(
        'user-manual/wazuh-dashboard/troubleshooting.html',
      ),
    },
    WAZUH_SERVER_CLUSTER: {
      CLUSTER_NODES_CONFIGURATION: buildWebDocUrl(
        'user-manual/wazuh-server-cluster/cluster-nodes-configuration.html',
      ),
    },
    CAPABILITIES: {
      MALWARE_DETECTION: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/malware-detection/index.html',
        ),
        VIRUS_TOTAL_INTEGRATION: buildWebDocUrl(
          'user-manual/capabilities/malware-detection/virus-total-integration.html',
        ),
      },
      LOG_DATA_COLLECTION: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/log-data-collection/index.html',
        ),
        MONITORING_LOG_FILES: buildWebDocUrl(
          'user-manual/capabilities/log-data-collection/monitoring-log-files.html',
        ),
      },
      CONTAINER_SECURITY: {
        USE_CASES: buildWebDocUrl(
          'user-manual/capabilities/container-security/use-cases.html',
        ),
      },
      VULNERABILITY_DETECTION: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/vulnerability-detection/index.html',
        ),
        CONFIGURING_SCANS: buildWebDocUrl(
          'user-manual/capabilities/vulnerability-detection/configuring-scans.html',
        ),
      },
      SYSTEM_INVENTORY: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/system-inventory/index.html',
        ),
        OSQUERY: buildWebDocUrl(
          'user-manual/capabilities/system-inventory/osquery.html',
        ),
      },
      FILE_INTEGRITY: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/file-integrity/index.html',
        ),
      },
      POLICY_MONITORING: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/policy-monitoring/index.html',
          '4.8',
        ),
        CISCAT: buildWebDocUrl(
          'user-manual/capabilities/policy-monitoring/ciscat/ciscat.html',
          '4.8',
        ),
        OPENS_CAP: {
          INDEX: buildWebDocUrl(
            'user-manual/capabilities/policy-monitoring/openscap/index.html',
            '4.8',
          ),
        },
      },
      INDEX: buildWebDocUrl('user-manual/capabilities/index.html'),
      ACTIVE_RESPONSE: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/active-response/index.html',
        ),
      },
      AGENTLESS_MONITORING: {
        INDEX: buildWebDocUrl(
          'user-manual/capabilities/agentless-monitoring/index.html',
        ),
      },
    },
    MANAGER: {
      INTEGRATION_WITH_EXTERNAL_APIS: buildWebDocUrl(
        'user-manual/manager/integration-with-external-apis.html',
      ),
      INDEX: buildWebDocUrl('user-manual/manager/index.html'),
      ALERT_MANAGEMENT: buildWebDocUrl(
        'user-manual/manager/alert-management.html',
      ),
      AUTOMATIC_REPORTS: buildWebDocUrl(
        'user-manual/manager/automatic-reports.html',
        '4.6',
      ),
    },
    AGENT: {
      AGENT_ENROLLMENT: {
        INDEX: buildWebDocUrl('user-manual/agent/agent-enrollment/index.html'),
        SECURITY_OPTIONS: {
          USING_PASSWORD_AUTHENTICATION: buildWebDocUrl(
            'user-manual/agent/agent-enrollment/security-options/using-password-authentication.html',
          ),
        },
      },
      AGENT_MANAGEMENT: {
        ANTIFLOODING: buildWebDocUrl(
          'user-manual/agent/agent-management/antiflooding.html',
        ),
        AGENT_CONNECTION: buildWebDocUrl(
          'user-manual/agent/agent-management/agent-connection.html',
        ),
        LABELS: buildWebDocUrl(
          'user-manual/agent/agent-management/labels.html',
        ),
      },
    },
    REFERENCE: {
      DAEMONS: {
        WAZUH_REMOTED: buildWebDocUrl(
          'user-manual/reference/daemons/wazuh-remoted.html',
        ),
      },
      OSSEC_CONF: {
        INDEX: buildWebDocUrl('user-manual/reference/ossec-conf/index.html'),
        CLIENT: buildWebDocUrl('user-manual/reference/ossec-conf/client.html'),
        ACTIVE_RESPONSE: buildWebDocUrl(
          'user-manual/reference/ossec-conf/active-response.html',
        ),
        COMMANDS: buildWebDocUrl(
          'user-manual/reference/ossec-conf/commands.html',
        ),
        AGENTLESS: buildWebDocUrl(
          'user-manual/reference/ossec-conf/agentless.html',
        ),
        EMAIL_ALERTS: buildWebDocUrl(
          'user-manual/reference/ossec-conf/email-alerts.html',
        ),
        ALERTS: buildWebDocUrl('user-manual/reference/ossec-conf/alerts.html'),
        LABELS: buildWebDocUrl('user-manual/reference/ossec-conf/labels.html'),
        REPORTS: buildWebDocUrl(
          'user-manual/reference/ossec-conf/reports.html',
        ),
        SYSLOG_OUTPUT: buildWebDocUrl(
          'user-manual/reference/ossec-conf/syslog-output.html',
        ),
        WODLE_S3: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-s3.html',
        ),
        WODLE_AZURE_LOGS: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-azure-logs.html',
        ),
        WODLE_CISCAT: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-ciscat.html',
          '4.8',
        ),
        CLIENT_BUFFER: buildWebDocUrl(
          'user-manual/reference/ossec-conf/client-buffer.html',
        ),
        GITHUB_MODULE: buildWebDocUrl(
          'user-manual/reference/ossec-conf/github-module.html',
        ),
        OFFICE365_MODULE: buildWebDocUrl(
          'user-manual/reference/ossec-conf/office365-module.html',
        ),
        CLUSTER: buildWebDocUrl(
          'user-manual/reference/ossec-conf/cluster.html',
        ),
        WODLE_COMMAND: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-command.html',
        ),
        WODLE_DOCKER: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-docker.html',
        ),
        WODLE_OPENSCAP: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-openscap.html',
          '4.8',
        ),
        WODLE_OSQUERY: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-osquery.html',
        ),
        WODLE_SYSCOLLECTOR: buildWebDocUrl(
          'user-manual/reference/ossec-conf/wodle-syscollector.html',
        ),
        SYSCHECK: buildWebDocUrl(
          'user-manual/reference/ossec-conf/syscheck.html',
        ),
        GLOBAL: buildWebDocUrl('user-manual/reference/ossec-conf/global.html'),
        LOGGING: buildWebDocUrl(
          'user-manual/reference/ossec-conf/logging.html',
        ),
        REMOTE: buildWebDocUrl('user-manual/reference/ossec-conf/remote.html'),
        GCP_PUBSUB: buildWebDocUrl(
          'user-manual/reference/ossec-conf/gcp-pubsub.html',
        ),
        INTEGRATION: buildWebDocUrl(
          'user-manual/reference/ossec-conf/integration.html',
        ),
        LOCALFILE: buildWebDocUrl(
          'user-manual/reference/ossec-conf/localfile.html',
        ),
        SOCKET: buildWebDocUrl('user-manual/reference/ossec-conf/socket.html'),
        ROOTCHECK: buildWebDocUrl(
          'user-manual/reference/ossec-conf/rootcheck.html',
        ),
        AUTH: buildWebDocUrl('user-manual/reference/ossec-conf/auth.html'),
        VULN_DETECTOR: buildWebDocUrl(
          'user-manual/reference/ossec-conf/vuln-detector.html',
        ),
      },
    },
  },
  UPGRADE_GUIDE: {
    WAZUH_AGENT: {
      INDEX: buildWebDocUrl('upgrade-guide/wazuh-agent/index.html'),
    },
  },
  INSTALLATION_GUIDE: {
    WAZUH_AGENT: {
      INDEX: buildWebDocUrl('installation-guide/wazuh-agent/index.html'),
    },
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
