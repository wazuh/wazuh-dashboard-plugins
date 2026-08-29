import { i18n } from '@osd/i18n';

const t = (id: string, defaultMessage: string) =>
  i18n.translate(`wz.discover.${id}`, { defaultMessage });

export const wzDiscoverI18n = {
  inspectDocumentDetails: t(
    'inspectDocumentDetails',
    'Inspect document details',
  ),
  discoverEventsTable: t('discoverEventsTable', 'Discover events table'),
  errorFetchingData: t('errorFetchingData', 'Error fetching data'),
  errorDownloadingCsv: t('errorDownloadingCsv', 'Error downloading csv report'),
  inspectDetails: t('inspectDetails', 'Inspect details'),
  tableAriaLabel: t('tableAriaLabel', 'Table'),
  details: t('details', 'Details'),
  documentDetails: t('documentDetails', 'Document Details'),
  viewSurroundingDocuments: t(
    'viewSurroundingDocuments',
    'View surrounding documents',
  ),
  viewSingleDocument: t('viewSingleDocument', 'View single document'),
  navigateVulnerabilityReference: t(
    'navigateVulnerabilityReference',
    'Navigate to the vulnerability reference',
  ),
  eventsHistogram: t('eventsHistogram', 'Events histogram'),
  count: t('count', 'Count'),
  discoverEventsHistogram: t(
    'discoverEventsHistogram',
    'Discover Events Histogram',
  ),
  histogramDescription: t(
    'histogramDescription',
    'Histogram of events by date',
  ),
  searchPlaceholder: t('searchPlaceholder', 'Search'),
  searchColumns: t('searchColumns', 'Search columns'),
  info: t('info', 'Info'),
  documentDetailsAria: t('documentDetailsAria', 'Document details'),
  tableTab: t('tableTab', 'Table'),
  generateReport: t('generateReport', 'Generate report'),
  noResultsForCriteria: t(
    'noResultsForCriteria',
    'No results match for this search criteria.',
  ),
  jsonTab: t('jsonTab', 'JSON'),
  exportFormatted: t('exportFormatted', 'Export Formatted'),
};

export const getQueryResultsExceededTooltip = (limit: string) =>
  i18n.translate('wz.discover.queryResultsExceeded', {
    defaultMessage:
      'The query results exceeded the limit of {limit} hits. Please refine your search.',
    values: { limit },
  });

export const getQueryResultsExceededTableTooltip = (limit: string) =>
  i18n.translate('wz.discover.queryResultsExceededTable', {
    defaultMessage:
      'The query results has exceeded the limit of {limit} hits. To provide a better experience the table only shows the first {limit} hits.',
    values: { limit },
  });
