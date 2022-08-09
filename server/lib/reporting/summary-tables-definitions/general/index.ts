import { AggregationFields } from '../aggregation_fields';
const GeneralAlertsSummary = {
    title: 'Alerts summary',
    aggs: [
      {
          field: 'rule.id',
          size: 50,
          order: 'desc',
          orderBy: '1',
          customLabel: 'Rule ID',
      },
      {
          field: 'rule.description',
          size: 1000,
          order: 'desc',
          orderBy: '1',
          customLabel: 'Description',
      },
      {
          field: 'rule.level',
          size: 1,
          order: 'desc',
          orderBy: '1',
          customLabel: 'Level',
      },
    ],
  }

const AWSAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['rule.id'],
        AggregationFields['rule.description'],
        AggregationFields['rule.level'],
    ]
}

const FIMAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['syscheck.path'],
        AggregationFields['syscheck.event'],
    ]
}

const GCPAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['rule.id'],
        AggregationFields['rule.description'],
        AggregationFields['rule.level'],
    ]
}

const OfficeAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['rule.id'],
        AggregationFields['rule.description'],
        AggregationFields['rule.level'],
    ]
}

const PCIDSSAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['rule.pci_dss'],
        AggregationFields['rule.description'],
    ]
}

const GDPRAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['rule.gdpr'],
        AggregationFields['rule.description'],
    ]
}

const NISTAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['rule.nist_800_53'],
        AggregationFields['rule.level'],
    ]
}

const HIPAAAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['rule.hipaa'],
        AggregationFields['rule.level'],
    ]
}

const TSCAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['rule.tsc'],
        AggregationFields['rule.description'],
    ]
}

const VirustotalAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['rule.id'],
        AggregationFields['rule.description'],
        AggregationFields['rule.level'],
    ]
}

const OsqueryAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['data.osquery.name'],
        AggregationFields['data.osquery.action'],
        AggregationFields['agent.name'],
        AggregationFields['data.osquery.pack'],
        AggregationFields['data.osquery.calendarTime'],
    ]
}

const MITREAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['rule.id'],
        AggregationFields['rule.description'],
        AggregationFields['rule.level'],
    ]
}
const CISCATAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['data.cis.rule_title'],
        AggregationFields['data.cis.group'],
        AggregationFields['data.cis.result'],
    ]
}
const PMAlertsSummary= {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['rule.description'],
        AggregationFields['data.title'],
    ]
}

const DockerAlertsSummary = {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['data.docker.Actor.Attributes.name'],
        AggregationFields['data.docker.Action'],
        AggregationFields['data.docker.timestamp'],
    ]
}

const GitHubAlertsSummary = {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['data.github.org'],
        AggregationFields['rule.description'],
    ]
}

const OscapAlertsSummary = {
    title: 'Alerts summary',
    aggs: [
        AggregationFields['agent.name'],
        AggregationFields['data.github.org'],
        AggregationFields['rule.description'],
    ]
}

export default {
    AWSAlertsSummary,
    CISCATAlertsSummary,
    DockerAlertsSummary,
    FIMAlertsSummary,
    GCPAlertsSummary,
    GDPRAlertsSummary,
    GeneralAlertsSummary,
    GitHubAlertsSummary,
    HIPAAAlertsSummary,
    MITREAlertsSummary,
    NISTAlertsSummary,
    OfficeAlertsSummary,
    OscapAlertsSummary,
    OsqueryAlertsSummary,
    PCIDSSAlertsSummary,
    PMAlertsSummary,
    TSCAlertsSummary,
    VirustotalAlertsSummary,
}