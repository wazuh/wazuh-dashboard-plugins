import { AggregationFields } from '../aggregation_fields';
const generalAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
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
    AggregationFields['agent.name'],
    AggregationFields['syscheck.path'],
    AggregationFields['syscheck.event'],
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

const officeAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ]
}

const pciAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['rule.pci_dss'],
    AggregationFields['rule.description'],
  ]
}

const gdprAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['rule.gdpr'],
    AggregationFields['rule.description'],
  ]
}

const nistAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['rule.nist_800_53'],
    AggregationFields['rule.level'],
  ]
}

const hipaaAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['rule.hipaa'],
    AggregationFields['rule.level'],
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

const dockerAlertsSummary = {
  title: 'Events summary',
  aggs: [
    AggregationFields['data.docker.Actor.Attributes.name'],
    AggregationFields['data.docker.Action'],
    AggregationFields['timestamp'],
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

// 'Wazuh-App-Overview-OSCAP-Last-alerts'
const oscapLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['data.oscap.check.title'],
    AggregationFields['data.oscap.scan.profile.title'],
  ]
}

// 'Wazuh-App-Overview-Audit-Last-alerts'
const auditLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['rule.description'],
    AggregationFields['data.audit.exe'],
  ]
}

export default {
  aws: [awsAlertsSummary],
  ciscat: [ciscatAlertsSummary],
  docker: [dockerAlertsSummary],
  fim: [fimAlertsSummary],
  gcp: [gcpAlertsSummary],
  gdpr: [gdprAlertsSummary],
  general: [generalAlertsSummary],
  github: [githubAlertsSummary],
  hipaa: [hipaaAlertsSummary],
  mitre: [mitreAlertsSummary],
  nist: [nistAlertsSummary],
  office: [officeAlertsSummary],
  oscap: [oscapLastAlerts],
  osquery: [osqueryAlertsSummary],
  pci: [pciAlertsSummary],
  pm: [pmAlertsSummary],
  tsc: [tscAlertsSummary],
  virustotal: [virustotalAlertsSummary],
  audit: [auditLastAlerts],
}
