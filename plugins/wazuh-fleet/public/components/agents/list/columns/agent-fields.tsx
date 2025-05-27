/**
 * Dictionary of friendly agent names for technical fields
 * Used to display more user-friendly names
 */
export const agentFields: Record<string, string> = {
  // Agent fields
  'agent.name': 'Name',
  'agent.id': 'Agent ID',
  'agent.version': 'Version',
  'agent.status': 'Status',
  'agent.groups': 'Groups',
  'agent.type': 'Agent Type',
  'agent.key': 'Key',
  'agent.last_login': 'Last Login',

  // Host fields
  'agent.host.ip': 'IP Address',
  'agent.host.name': 'Host Name',
  'agent.host.hostname': 'Hostname',
  'agent.host.architecture': 'Architecture',
  'agent.host.os.name': 'OS',
  'agent.host.os.version': 'OS Version',
  'agent.host.os.family': 'OS Family',
  'agent.host.os.full': 'Full OS',
  'agent.host.os.kernel': 'Kernel',
  'agent.host.os.platform': 'Platform',
  'agent.host.os.type': 'OS Type',
  'agent.host.boot.id': 'Boot ID',
  'agent.host.mac': 'MAC Address',
  'agent.host.domain': 'Domain',
  'agent.host.id': 'Host ID',
  'agent.host.uptime': 'Uptime',
  'agent.host.pid_ns_ino': 'PID Namespace ID',
  'agent.host.type': 'Host Type',

  // Resource fields
  'agent.host.cpu.usage': 'CPU Usage',
  'agent.host.disk.read.bytes': 'Disk Read',
  'agent.host.disk.write.bytes': 'Disk Write',
  'agent.host.network.egress.bytes': 'Network Out',
  'agent.host.network.egress.packets': 'Packets Out',
  'agent.host.network.ingress.bytes': 'Network In',
  'agent.host.network.ingress.packets': 'Packets In',

  // Risk fields
  'agent.host.risk.calculated_level': 'Risk Level',
  'agent.host.risk.calculated_score': 'Risk Score',
  'agent.host.risk.calculated_score_norm': 'Risk Score Norm',
  'agent.host.risk.static_level': 'Static Risk',
  'agent.host.risk.static_score': 'Static Score',
  'agent.host.risk.static_score_norm': 'Static Score Norm',

  // Geographic fields
  'agent.host.geo.city_name': 'City',
  'agent.host.geo.continent_code': 'Continent Code',
  'agent.host.geo.continent_name': 'Continent',
  'agent.host.geo.country_iso_code': 'Country Code',
  'agent.host.geo.country_name': 'Country',
  'agent.host.geo.location': 'Location',
  'agent.host.geo.name': 'Geo Name',
  'agent.host.geo.postal_code': 'Postal Code',
  'agent.host.geo.region_iso_code': 'Region Code',
  'agent.host.geo.region_name': 'Region',
  'agent.host.geo.timezone': 'Timezone',

  // Common fields
  '_id': 'ID',
  '_index': 'Index',
  '_score': 'Score',
  // '_source': 'Source',
  '_type': 'Type'
};

/**
 * Gets the IDs of special fields that require custom rendering
 */
export const specialColumnIds = [
  'agent.name',
  'agent.groups',
  'agent.version',
  'agent.host.os.full',
  'agent.host.ip'
];

/**
 * Gets the IDs of standard fields, excluding special fields
 */
export const standardColumnIds =
  Object.keys(agentFields).filter(
    fieldId => !specialColumnIds.includes(fieldId)
  );

/**
 * Function to get the friendly name of an agent field
 * @param fieldId - Technical field ID
 * @returns Friendly name or original ID if no translation exists
 */
export const getFriendlyFieldName = (fieldId: string): string => {
  return agentFields[fieldId] || fieldId;
};
