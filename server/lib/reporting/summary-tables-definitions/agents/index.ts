
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
        size: 1,
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

const GeneralGroupsSummary = {

}

const AWSAlertsSummary = {}
const FIMAlertsSummary = {}
const GCPAlertsSummary = {}
const TSCAlertsSummary = {}
const VirustotalAlertsSummary = {}
const OsqueryAlertsSummary = {}
const MITREAlertsSummary = {}
const CISCATAlertsSummary = {}
const PMAlertsSummary = {}


export default {
  GeneralAlertsSummary,
  GeneralGroupsSummary,
  AWSAlertsSummary,
  FIMAlertsSummary,
  GCPAlertsSummary,
  TSCAlertsSummary,
  VirustotalAlertsSummary,
  OsqueryAlertsSummary,
  MITREAlertsSummary,
  CISCATAlertsSummary,
  PMAlertsSummary,
}