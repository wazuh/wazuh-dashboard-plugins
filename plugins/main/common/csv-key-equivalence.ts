/*
 * Wazuh app - Wazuh CSV column keys
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { i18n } from '@osd/i18n';

// WORKAROUND: This defines an alternative name for the size property for some server API responses (FIM) that is incompatible with json2csvAsync
export const UnsupportedKeysJson2CsvAsyncSize = '_____tmp_size_____';

export const KeyEquivalence: { [key: string]: string } = {
  id: i18n.translate('wazuh.common.csvExport.columns.id', {
    defaultMessage: 'ID',
  }),
  timestamp: i18n.translate('wazuh.common.csvExport.columns.timestamp', {
    defaultMessage: 'Timestamp',
  }),
  url: i18n.translate('wazuh.common.csvExport.columns.url', {
    defaultMessage: 'URL',
  }),
  version: i18n.translate('wazuh.common.csvExport.columns.version', {
    defaultMessage: 'Version',
  }),
  'os.name': i18n.translate('wazuh.common.csvExport.columns.osName', {
    defaultMessage: 'OS name',
  }),
  'os.version': i18n.translate('wazuh.common.csvExport.columns.osVersion', {
    defaultMessage: 'OS version',
  }),
  'os.arch': i18n.translate('wazuh.common.csvExport.columns.osArch', {
    defaultMessage: 'OS version architecture',
  }),
  'os.build': i18n.translate('wazuh.common.csvExport.columns.osBuild', {
    defaultMessage: 'OS version build',
  }),
  'os.codename': i18n.translate('wazuh.common.csvExport.columns.osCodename', {
    defaultMessage: 'OS code name',
  }),
  'os.major': i18n.translate('wazuh.common.csvExport.columns.osMajor', {
    defaultMessage: 'OS version major',
  }),
  'os.minor': i18n.translate('wazuh.common.csvExport.columns.osMinor', {
    defaultMessage: 'OS version minor',
  }),
  'os.platform': i18n.translate('wazuh.common.csvExport.columns.osPlatform', {
    defaultMessage: 'OS platform',
  }),
  'os.uname': i18n.translate('wazuh.common.csvExport.columns.osUname', {
    defaultMessage: 'OS uname',
  }),
  status: i18n.translate('wazuh.common.csvExport.columns.status', {
    defaultMessage: 'Status',
  }),
  group: i18n.translate('wazuh.common.csvExport.columns.group', {
    defaultMessage: 'Group',
  }),
  ip: i18n.translate('wazuh.common.csvExport.columns.ip', {
    defaultMessage: 'IP address',
  }),
  description: i18n.translate('wazuh.common.csvExport.columns.description', {
    defaultMessage: 'Description',
  }),
  tag: i18n.translate('wazuh.common.csvExport.columns.tag', {
    defaultMessage: 'Tag',
  }),
  level: i18n.translate('wazuh.common.csvExport.columns.level', {
    defaultMessage: 'Level',
  }),
  conf_sum: i18n.translate('wazuh.common.csvExport.columns.confSum', {
    defaultMessage: 'Configuration checksum',
  }),
  merged_sum: i18n.translate('wazuh.common.csvExport.columns.mergedSum', {
    defaultMessage: 'Merged checksum',
  }),
  hash: i18n.translate('wazuh.common.csvExport.columns.hash', {
    defaultMessage: 'Checksum',
  }),
  filename: i18n.translate('wazuh.common.csvExport.columns.filename', {
    defaultMessage: 'File',
  }),
  file: i18n.translate('wazuh.common.csvExport.columns.file', {
    defaultMessage: 'File',
  }),
  gdpr: 'GDPR',
  pci: 'PCI',
  hipaa: 'HIPAA',
  'nist-800-53': 'NIST 800-53',
  cis: 'CIS',
  event: i18n.translate('wazuh.common.csvExport.columns.event', {
    defaultMessage: 'Event',
  }),
  groups: i18n.translate('wazuh.common.csvExport.columns.groups', {
    defaultMessage: 'Groups',
  }),
  name: i18n.translate('wazuh.common.csvExport.columns.name', {
    defaultMessage: 'Name',
  }),
  count: i18n.translate('wazuh.common.csvExport.columns.count', {
    defaultMessage: 'Count',
  }),
  'details.program_name': i18n.translate(
    'wazuh.common.csvExport.columns.detailsProgramName',
    { defaultMessage: 'Program name' },
  ),
  'details.order': i18n.translate(
    'wazuh.common.csvExport.columns.detailsOrder',
    { defaultMessage: 'Order' },
  ),
  vendor: i18n.translate('wazuh.common.csvExport.columns.vendor', {
    defaultMessage: 'Vendor',
  }),
  type: i18n.translate('wazuh.common.csvExport.columns.type', {
    defaultMessage: 'Type',
  }),
  architecture: i18n.translate('wazuh.common.csvExport.columns.architecture', {
    defaultMessage: 'Architecture',
  }),
  dateAdd: i18n.translate('wazuh.common.csvExport.columns.dateAdd', {
    defaultMessage: 'Registration date',
  }),
  manager: i18n.translate('wazuh.common.csvExport.columns.manager', {
    defaultMessage: 'Manager',
  }),
  lastKeepAlive: i18n.translate(
    'wazuh.common.csvExport.columns.lastKeepAlive',
    { defaultMessage: 'Last keep alive' },
  ),
  os: i18n.translate('wazuh.common.csvExport.columns.os', {
    defaultMessage: 'Operating system',
  }),
  path: i18n.translate('wazuh.common.csvExport.columns.path', {
    defaultMessage: 'Path',
  }),
  details: i18n.translate('wazuh.common.csvExport.columns.details', {
    defaultMessage: 'Details',
  }),
  position: i18n.translate('wazuh.common.csvExport.columns.position', {
    defaultMessage: 'Position',
  }),
  configSum: i18n.translate('wazuh.common.csvExport.columns.configSum', {
    defaultMessage: 'Configuration checksum',
  }),
  mergedSum: i18n.translate('wazuh.common.csvExport.columns.mergedSum', {
    defaultMessage: 'Merged checksum',
  }),
  key: i18n.translate('wazuh.common.csvExport.columns.key', {
    defaultMessage: 'Key',
  }),
  scan_id: i18n.translate('wazuh.common.csvExport.columns.scanId', {
    defaultMessage: 'Scan ID',
  }),
  format: i18n.translate('wazuh.common.csvExport.columns.format', {
    defaultMessage: 'Format',
  }),
  scan_time: i18n.translate('wazuh.common.csvExport.columns.scanTime', {
    defaultMessage: 'Scan date',
  }),
  state: i18n.translate('wazuh.common.csvExport.columns.state', {
    defaultMessage: 'State',
  }),
  mac: i18n.translate('wazuh.common.csvExport.columns.mac', {
    defaultMessage: 'MAC',
  }),
  gateway: i18n.translate('wazuh.common.csvExport.columns.gateway', {
    defaultMessage: 'Gateway',
  }),
  dhcp: i18n.translate('wazuh.common.csvExport.columns.dhcp', {
    defaultMessage: 'DHCP',
  }),
  iface: i18n.translate('wazuh.common.csvExport.columns.iface', {
    defaultMessage: 'Interface',
  }),
  broadcast: i18n.translate('wazuh.common.csvExport.columns.broadcast', {
    defaultMessage: 'Broadcast',
  }),
  proto: i18n.translate('wazuh.common.csvExport.columns.proto', {
    defaultMessage: 'Protocol',
  }),
  address: i18n.translate('wazuh.common.csvExport.columns.address', {
    defaultMessage: 'Address',
  }),
  protocol: i18n.translate('wazuh.common.csvExport.columns.protocol', {
    defaultMessage: 'Protocol',
  }),
  netmask: i18n.translate('wazuh.common.csvExport.columns.netmask', {
    defaultMessage: 'Netmask',
  }),
  'local.ip': i18n.translate('wazuh.common.csvExport.columns.localIp', {
    defaultMessage: 'Local IP address',
  }),
  'remote.ip': i18n.translate('wazuh.common.csvExport.columns.remoteIp', {
    defaultMessage: 'Remote IP',
  }),
  'local.port': i18n.translate('wazuh.common.csvExport.columns.localPort', {
    defaultMessage: 'Local port',
  }),
  'remote.port': i18n.translate('wazuh.common.csvExport.columns.remotePort', {
    defaultMessage: 'Remote port',
  }),
  euser: i18n.translate('wazuh.common.csvExport.columns.euser', {
    defaultMessage: 'Effective user',
  }),
  egroup: i18n.translate('wazuh.common.csvExport.columns.egroup', {
    defaultMessage: 'Effective group',
  }),
  vm_size: i18n.translate('wazuh.common.csvExport.columns.vmSize', {
    defaultMessage: 'VM size',
  }),
  processor: i18n.translate('wazuh.common.csvExport.columns.processor', {
    defaultMessage: 'Processor',
  }),
  session: i18n.translate('wazuh.common.csvExport.columns.session', {
    defaultMessage: 'Session',
  }),
  tty: i18n.translate('wazuh.common.csvExport.columns.tty', {
    defaultMessage: 'TTY',
  }),
  pid: i18n.translate('wazuh.common.csvExport.columns.pid', {
    defaultMessage: 'PID',
  }),
  ppid: i18n.translate('wazuh.common.csvExport.columns.ppid', {
    defaultMessage: 'Parent PID',
  }),
  argvs: i18n.translate('wazuh.common.csvExport.columns.argvs', {
    defaultMessage: 'Argvs',
  }),
  nice: i18n.translate('wazuh.common.csvExport.columns.nice', {
    defaultMessage: 'Priority',
  }),
  size: i18n.translate('wazuh.common.csvExport.columns.size', {
    defaultMessage: 'Size',
  }),
  uname: i18n.translate('wazuh.common.csvExport.columns.uname', {
    defaultMessage: 'User',
  }),
  gname: i18n.translate('wazuh.common.csvExport.columns.gname', {
    defaultMessage: 'Group',
  }),
  perm: i18n.translate('wazuh.common.csvExport.columns.perm', {
    defaultMessage: 'Permissions',
  }),
  inode: i18n.translate('wazuh.common.csvExport.columns.inode', {
    defaultMessage: 'Inode',
  }),
  uid: i18n.translate('wazuh.common.csvExport.columns.uid', {
    defaultMessage: 'User ID',
  }),
  gid: i18n.translate('wazuh.common.csvExport.columns.gid', {
    defaultMessage: 'Group ID',
  }),
  mtime: i18n.translate('wazuh.common.csvExport.columns.mtime', {
    defaultMessage: 'Last modified',
  }),
  priority: i18n.translate('wazuh.common.csvExport.columns.priority', {
    defaultMessage: 'Priority',
  }),
  cmd: i18n.translate('wazuh.common.csvExport.columns.cmd', {
    defaultMessage: 'Command',
  }),
  nlwp: i18n.translate('wazuh.common.csvExport.columns.nlwp', {
    defaultMessage: 'NLWP',
  }),
  process: i18n.translate('wazuh.common.csvExport.columns.process', {
    defaultMessage: 'Process',
  }),
  md5: 'MD5',
  sha1: 'SHA1',
  sha256: 'SHA256',
  title: i18n.translate('wazuh.common.csvExport.columns.title', {
    defaultMessage: 'Title',
  }),
  remediation: i18n.translate('wazuh.common.csvExport.columns.remediation', {
    defaultMessage: 'Remediation',
  }),
  references: i18n.translate('wazuh.common.csvExport.columns.references', {
    defaultMessage: 'References',
  }),
  result: i18n.translate('wazuh.common.csvExport.columns.result', {
    defaultMessage: 'Result',
  }),
  directory: i18n.translate('wazuh.common.csvExport.columns.directory', {
    defaultMessage: 'Path(s)',
  }),
  rationale: i18n.translate('wazuh.common.csvExport.columns.rationale', {
    defaultMessage: 'Rationale',
  }),
  registry: i18n.translate('wazuh.common.csvExport.columns.registry', {
    defaultMessage: 'Registry',
  }),
  date: i18n.translate('wazuh.common.csvExport.columns.date', {
    defaultMessage: 'Date',
  }),
  value: i18n.translate('wazuh.common.csvExport.columns.value', {
    defaultMessage: 'Value',
  }),
  location: i18n.translate('wazuh.common.csvExport.columns.location', {
    defaultMessage: 'Location',
  }),
  mtu: i18n.translate('wazuh.common.csvExport.columns.mtu', {
    defaultMessage: 'MTU',
  }),
  attributes: i18n.translate('wazuh.common.csvExport.columns.attributes', {
    defaultMessage: 'Attributes',
  }),
  policy_id: i18n.translate('wazuh.common.csvExport.columns.policyId', {
    defaultMessage: 'Policy ID',
  }),
  policy_ID: i18n.translate(
    'wazuh.common.csvExport.columns.policyIdUppercase',
    { defaultMessage: 'Policy ID' },
  ),
  compliance: i18n.translate('wazuh.common.csvExport.columns.compliance', {
    defaultMessage: 'Compliance',
  }),
  rules: i18n.translate('wazuh.common.csvExport.columns.rules', {
    defaultMessage: 'Rules',
  }),
  reason: i18n.translate('wazuh.common.csvExport.columns.reason', {
    defaultMessage: 'Reason',
  }),
  registerIP: i18n.translate('wazuh.common.csvExport.columns.registerIP', {
    defaultMessage: 'Register IP',
  }),
  hotfix: i18n.translate('wazuh.common.csvExport.columns.hotfix', {
    defaultMessage: 'Update code',
  }),
  'scan.time': i18n.translate('wazuh.common.csvExport.columns.scanTimeNested', {
    defaultMessage: 'Registered at',
  }),
  [UnsupportedKeysJson2CsvAsyncSize]: i18n.translate(
    'wazuh.common.csvExport.columns.tmpSize',
    { defaultMessage: 'Size' },
  ), // WORKAROUND: This defines an alternative name for the size property for some server API responses (FIM) that is incompatible with json2csvAsync
};
