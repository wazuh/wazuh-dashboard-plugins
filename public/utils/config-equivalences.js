export const configEquivalences = {
  pattern: 'Default index pattern to use on the app.',
  'checks.pattern':
    'Enable or disable the index pattern health check when opening the app.',
  'checks.template':
    'Enable or disable the template health check when opening the app.',
  'checks.api': 'Enable or disable the API health check when opening the app.',
  'checks.setup':
    'Enable or disable the setup health check when opening the app.',
  'extensions.pci': 'Enable or disable the PCI DSS tab on Overview and Agents.',
  'extensions.gdpr': 'Enable or disable the GDPR tab on Overview and Agents.',
  'extensions.audit': 'Enable or disable the Audit tab on Overview and Agents.',
  'extensions.oscap':
    'Enable or disable the Open SCAP tab on Overview and Agents.',
  'extensions.ciscat':
    'Enable or disable the CIS-CAT tab on Overview and Agents.',
  'extensions.aws': 'Enable or disable the Amazon (AWS) tab on Overview.',
  'extensions.virustotal':
    'Enable or disable the VirusTotal tab on Overview and Agents.',
  'extensions.osquery':
    'Enable or disable the Osquery tab on Overview and Agents.',
  'extensions.docker':
    'Enable or disable the Docker listener tab on Overview and Agents.',
  timeout:
    'Defines the maximum time the app will wait for an API response when making requests to it.',
  'wazuh.shards': 'Define the number of shards to use for the .wazuh index.',
  'wazuh.replicas':
    'Define the number of replicas to use for the .wazuh index.',
  'wazuh-version.shards':
    'Define the number of shards to use for the .wazuh-version index.',
  'wazuh-version.replicas':
    'Define the number of replicas to use for the .wazuh-version index.',
  'ip.selector':
    'Defines if the user is allowed to change the selected index pattern directly from the top menu bar.',
  'ip.ignore':
    'Disable certain index pattern names from being available in index pattern selector from the Wazuh app.',
  'xpack.rbac.enabled':
    'Enable or disable X-Pack RBAC security capabilities when using the app.',
  'wazuh.monitoring.enabled':
    'Enable or disable the wazuh-monitoring index creation and/or visualization.',
  'wazuh.monitoring.frequency':
    'Define in seconds the frequency the app generates a new document on the wazuh-monitoring index.',
  'wazuh.monitoring.shards':
    'Define the number of shards to use for the wazuh-monitoring-3.x-* indices.',
  'wazuh.monitoring.replicas':
    'Define the number of replicas to use for the wazuh-monitoring-3.x-* indices.',
  'wazuh.monitoring.creation':
    'Define the interval in which the wazuh-monitoring index will be created.',
  'wazuh.monitoring.pattern':
    'Default index pattern to use on the app for Wazuh monitoring.',
  admin:
    'Enable or disable administrator requests to the Wazuh API when using the app.',
  'logs.level':
    'Set the app logging level, allowed values are info and debug. Default is info.'
};
