/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
    'agent.name',
    'syscheck.path',
    'syscheck.event',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  mitre: [
    'agent.name',
    'rule.mitre.id',
    'rule.mitre.tactic',
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
    'agent.name',
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
    'agent.name',
    'data.gcp.jsonPayload.vmInstanceName',
    'data.gcp.resource.labels.location',
    'data.gcp.resource.labels.project_id',
    'data.gcp.resource.type',
    'data.gcp.severity',
  ],
  pm: [
    'agent.name',
    'data.title',
    'rule.description',
    'rule.level',
    'rule.id',
  ],
  audit: [
    'agent.name',
    'data.audit.command',
    'data.audit.pid',
    'rule.description',
    'rule.level',
    'rule.id',
  ],
  oscap: [
    'agent.name',
    'data.oscap.check.title',
    'data.oscap.check.description',
    'data.oscap.check.result',
    'data.oscap.check.severity',
  ],
  ciscat: [
    'agent.name',
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
    'data.vulnerability.severity',
    'data.vulnerability.status'
  ],
  virustotal: [
    'agent.name',
    'data.virustotal.source.file',
    'data.virustotal.permalink',
    'data.virustotal.malicious',
    'data.virustotal.positives',
    'data.virustotal.total',
  ],
  osquery: [
    'agent.name',
    'data.osquery.name',
    'data.osquery.pack',
    'data.osquery.action',
    'data.osquery.subquery',
  ],
  docker: [
    'agent.name',
    'data.docker.from',
    'data.docker.Type',
    'data.docker.Action',
    'rule.description',
    'rule.level',
  ],
  pci: [
    'agent.name',
    'rule.pci_dss',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  gdpr: [
    'agent.name',
    'rule.gdpr',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  hipaa: [
    'agent.name',
    'rule.hipaa',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  nist: [
    'agent.name',
    'rule.nist_800_53',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  tsc: [
    'agent.name',
    'rule.tsc',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  office: [
    'data.office365.Subscription',
    'data.office365.Operation',
    'data.office365.UserId',
    'data.office365.ClientIP',
    'rule.level',
    'rule.id'
  ],
  github: [
    'agent.id',
    'data.github.repo',
    'data.github.actor',
    'data.github.org',
    'rule.description',
    'rule.level',
    'rule.id'
  ],
  
};
