/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const EventsSelectedFiles = {
  fim: [
    'syscheck.path',
    'syscheck.event',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  mitre: [
    'rule.mitre.id',
    'rule.mitre.tactics',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  sca: [
    'data.sca.check.title',
    'data.sca.check.file',
    'data.sca.check.result',
    'data.sca.policy',
  ],
  general: [
    'agent.id',
    'rule.description',
    'rule.level',
    'rule.id',
  ],
  aws: [
    'data.aws.source',
    'rule.description',
    'rule.level',
    'rule.id',
  ],
  gcp: [
    'data.jsonPayload.vmInstanceName',
    'data.resource.labels.location',
    'data.resource.labels.project_id',
    'data.resource.type',
    'data.severity',
  ],
  pm: [
    'data.title',
    'rule.description',
    'rule.level',
    'rule.id',
  ],
  audit: [
    'data.audit.command',
    'data.audit.pid',
    'rule.description',
    'rule.level',
    'rule.id',
  ],
  oscap: [
    'data.oscap.check.title',
    'data.oscap.check.description',
    'data.oscap.check.result',
    'data.oscap.check.severity',
  ],
  ciscat: [
    'data.cis.benchmark',
    'data.cis.group',
    'data.cis.pass',
    'data.cis.fail',
    'data.cis.unknown',
    'data.cis.result',
  ],
  ciscat: [
    'data.cis.benchmark',
    'data.cis.group',
    'data.cis.pass',
    'data.cis.fail',
    'data.cis.unknown',
    'data.cis.result',
  ],
  vuls: [
    'agent.name',
    'data.vulnerability.package.name',
    'data.vulnerability.cve',
    'data.vulnerability.severity'
  ],
  virustotal: [
    'data.virustotal.source.file',
    'data.virustotal.permalink',
    'data.virustotal.malicious',
    'data.virustotal.positives',
    'data.virustotal.total',
  ],
  osquery: [
    'data.osquery.name',
    'data.osquery.pack',
    'data.osquery.action',
    'data.osquery.subquery',
  ],
  docker: [
    'data.docker.from',
    'data.docker.Type',
    'data.docker.Action',
    'rule.description',
    'rule.level',
  ],
  pci: [
    'rule.pci_dss',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  gdpr: [
    'rule.gdpr',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  hipaa: [
    'rule.hipaa',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  nist: [
    'rule.nist_800_53',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  tsc: [
    'rule.tsc',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  
};
