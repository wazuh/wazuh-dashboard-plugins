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
  title: 'Alerts summary',
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
  itle: 'Alerts summary',
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

const hipaaAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.hipaa'],
    AggregationFields['rule.level'],
    AggregationFields['rule.description'],
  ]
}

const nistAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.nist_800_53'],
    AggregationFields['rule.level'],
    AggregationFields['rule.description'],
  ]
}

export default {
  generalAlertsSummary,
  generalGroupsSummary,
  awsAlertsSummary,
  fimAlertsSummary,
  githubAlertsSummary,
  hipaaAlertsSummary,
  nistAlertsSummary,
  gcpAlertsSummary,
  tscAlertsSummary,
  virustotalAlertsSummary,
  osqueryAlertsSummary,
  mitreAlertsSummary,
  ciscatAlertsSummary,
  pmAlertsSummary,
}