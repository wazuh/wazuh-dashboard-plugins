import { AggregationFields } from '../aggregation_fields';

const generalAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ]
}

const generalGroupsSummary = {
  title: 'Groups summary',
  aggs: [
    AggregationFields['rule.groups'],
  ]
}

const awsAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ]
}

const fimAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['syscheck.path'],
    AggregationFields['rule.description'],
  ]
}
const gcpAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ]
}

const virustotalAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ]
}

const osqueryAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['data.osquery.name'],
    AggregationFields['data.osquery.action'],
    AggregationFields['agent.name'],
    AggregationFields['data.osquery.pack'],
    AggregationFields['data.osquery.calendarTime'],
  ]
}

const mitreAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ]
}

const ciscatAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['data.cis.rule_title'],
    AggregationFields['data.cis.group'],
    AggregationFields['data.cis.result'],
  ]
}

const pmAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.description'],
    AggregationFields['data.title'],
  ]
}

const tscAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['rule.tsc'],
    AggregationFields['rule.description'],
  ]
}

const githubAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['data.github.org'],
    AggregationFields['rule.description'],
  ]
}

// 'Wazuh-App-Agents-GDPR-Last-alerts'
const gdprLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['rule.gdpr'],
    AggregationFields['rule.description'],
  ]

}

// 'Wazuh-App-Agents-PCI-Last-alerts'
const pciLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['rule.pci_dss'],
    AggregationFields['rule.description'],
  ]
}

// 'Wazuh-App-Agents-NIST-Last-alerts'
const nistLastAlerts = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.nist_800_53'],
    AggregationFields['rule.level'],
    AggregationFields['rule.description'],
  ]
}

// 'Wazuh-App-Agents-HIPAA-Last-alerts'
const hipaaLastAlerts = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.hipaa'],
    AggregationFields['rule.level'],
    AggregationFields['rule.description'],
  ]
}

// 'Wazuh-App-Agents-OSCAP-Last-alerts'
const oscapLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['data.oscap.check.title'],
    AggregationFields['data.oscap.scan.profile.title'],
  ]
}

// 'Wazuh-App-Agents-Audit-Last-alerts'
const auditLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['rule.description'],
    AggregationFields['data.audit.exe'],
    AggregationFields['data.audit.type'],
  ]
}

const dockerAlertsSummary = {
  title: 'Events summary',
  aggs: [
    AggregationFields['data.docker.Actor.Attributes.name'],
    AggregationFields['data.docker.Action'],
    AggregationFields['timestamp'],
  ]
}

export default {
  general: [generalAlertsSummary, generalGroupsSummary],
  aws: [awsAlertsSummary],
  fim: [fimAlertsSummary],
  github: [githubAlertsSummary],
  hipaa: [hipaaLastAlerts],
  nist: [nistLastAlerts],
  gcp: [gcpAlertsSummary],
  tsc: [tscAlertsSummary],
  virustotal: [virustotalAlertsSummary],
  osquery: [osqueryAlertsSummary],
  mitre: [mitreAlertsSummary],
  ciscat: [ciscatAlertsSummary],
  pm: [pmAlertsSummary],
  audit: [auditLastAlerts],
  oscap: [oscapLastAlerts],
  gdpr: [gdprLastAlerts],
  pci: [pciLastAlerts],
  docker: [dockerAlertsSummary],
}
