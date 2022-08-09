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
const AWSAlertsSummary= {}
const FIMAlertsSummary= {}
const GCPAlertsSummary= {}
const OfficeAlertsSummary= {}
const PCIDSSAlertsSummary= {}
const GDPRAlertsSummary= {}
const NISTAlertsSummary= {}
const HIPAAAlertsSummary= {}
const TSCAlertsSummary= {}
const VirustotalAlertsSummary= {}
const OsqueryAlertsSummary= {}
const MITREAlertsSummary= {}
const CISCATAlertsSummary= {}
const PMAlertsSummary= {}

export default {
    GeneralAlertsSummary,
    AWSAlertsSummary,
    FIMAlertsSummary,
    GCPAlertsSummary,
    OfficeAlertsSummary,
    PCIDSSAlertsSummary,
    GDPRAlertsSummary,
    NISTAlertsSummary,
    HIPAAAlertsSummary,
    TSCAlertsSummary,
    VirustotalAlertsSummary,
    OsqueryAlertsSummary,
    MITREAlertsSummary,
    CISCATAlertsSummary,
    PMAlertsSummary,
}