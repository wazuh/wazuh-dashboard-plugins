import { AggregationFields } from '../aggregation_fields';

const generalAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ],
};

const generalGroupsSummary = {
  title: 'Groups summary',
  aggs: [AggregationFields['rule.groups']],
};

const awsAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ],
};

const azureAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ],
};

const fimAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['syscheck.path'],
    AggregationFields['rule.description'],
  ],
};
const gcpAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ],
};

const mitreAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.id'],
    AggregationFields['rule.description'],
    AggregationFields['rule.level'],
  ],
};

const pmAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.description'],
    AggregationFields['data.title'],
  ],
};

const tscAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['rule.tsc'],
    AggregationFields['rule.description'],
  ],
};

const githubAlertsSummary = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['agent.name'],
    AggregationFields['data.github.org'],
    AggregationFields['rule.description'],
  ],
};

// 'Wazuh-App-Agents-GDPR-Last-alerts'
const gdprLastAlerts = {
  title: 'Last alerts',
  aggs: [AggregationFields['rule.gdpr'], AggregationFields['rule.description']],
};

// 'Wazuh-App-Agents-PCI-Last-alerts'
const pciLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['rule.pci_dss'],
    AggregationFields['rule.description'],
  ],
};

// 'Wazuh-App-Agents-NIST-Last-alerts'
const nistLastAlerts = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.nist_800_53'],
    AggregationFields['rule.level'],
    AggregationFields['rule.description'],
  ],
};

// 'Wazuh-App-Agents-HIPAA-Last-alerts'
const hipaaLastAlerts = {
  title: 'Alerts summary',
  aggs: [
    AggregationFields['rule.hipaa'],
    AggregationFields['rule.level'],
    AggregationFields['rule.description'],
  ],
};

// 'Wazuh-App-Agents-Audit-Last-alerts'
const auditLastAlerts = {
  title: 'Last alerts',
  aggs: [
    AggregationFields['rule.description'],
    AggregationFields['data.audit.exe'],
    AggregationFields['data.audit.type'],
  ],
};

const dockerAlertsSummary = {
  title: 'Events summary',
  aggs: [
    AggregationFields['data.docker.Actor.Attributes.name'],
    AggregationFields['data.docker.Action'],
    AggregationFields['timestamp'],
  ],
};

export default {
  general: [generalAlertsSummary, generalGroupsSummary],
  aws: [awsAlertsSummary],
  azure: [azureAlertsSummary],
  fim: [fimAlertsSummary],
  github: [githubAlertsSummary],
  hipaa: [hipaaLastAlerts],
  nist: [nistLastAlerts],
  gcp: [gcpAlertsSummary],
  tsc: [tscAlertsSummary],
  mitre: [mitreAlertsSummary],
  pm: [pmAlertsSummary],
  audit: [auditLastAlerts],
  gdpr: [gdprLastAlerts],
  pci: [pciLastAlerts],
  docker: [dockerAlertsSummary],
};
