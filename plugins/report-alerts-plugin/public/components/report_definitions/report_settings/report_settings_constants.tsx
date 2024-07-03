/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

export const REPORT_SOURCE_RADIOS = [
  {
    id: 'dashboardReportSource',
    label: i18n.translate(
      'opensearch.reports.settings.constants.reportSourceRadios.dashboard',
      { defaultMessage: 'Dashboard' }
    ),
  },
  {
    id: 'visualizationReportSource',
    label: i18n.translate(
      'opensearch.reports.settings.constants.reportSourceRadios.visualization',
      { defaultMessage: 'Visualization' }
    ),
  },
  {
    id: 'savedSearchReportSource',
    label: i18n.translate(
      'opensearch.reports.settings.constants.reportSourceRadios.savedSearch',
      { defaultMessage: 'Saved search' }
    ),
  },
  {
    id: 'notebooksReportSource',
    label: 'Notebook',
  },
];

export const PDF_PNG_FILE_FORMAT_OPTIONS = [
  {
    id: 'pdf',
    label: 'PDF',
  },
  {
    id: 'png',
    label: 'PNG',
  },
];

export const SAVED_SEARCH_FORMAT_OPTIONS = [
  {
    id: 'csv',
    label: 'CSV',
  },
  {
    id: 'xlsx',
    label: 'XLSX',
  },
];

export const HEADER_FOOTER_CHECKBOX = [
  {
    id: 'header',
    label: i18n.translate(
      'opensearch.reports.settings.constants.headerFooterCheckbox.addHeader',
      { defaultMessage: 'Add header' }
    ),
  },
  {
    id: 'footer',
    label: i18n.translate(
      'opensearch.reports.settings.constants.headerFooterCheckbox.addFooter',
      { defaultMessage: 'Add footer' }
    ),
  },
];
export const REPORT_SOURCE_TYPES = {
  dashboard: 'Dashboard',
  visualization: 'Visualization',
  savedSearch: 'Saved search',
  notebook: 'Notebook',
};

export const commonTimeRanges = [
  {
    start: 'now/d',
    end: 'now',
    label: i18n.translate(
      'opensearch.reports.settings.constants.commonTimeRanges.todaySoFar',
      { defaultMessage: 'Today so far' }
    ),
  },
  {
    start: 'now/w',
    end: 'now',
    label: i18n.translate(
      'opensearch.reports.settings.constants.commonTimeRanges.weekToDate',
      { defaultMessage: 'Week to date' }
    ),
  },
  {
    start: 'now/M',
    end: 'now',
    label: i18n.translate(
      'opensearch.reports.settings.constants.commonTimeRanges.monthToDate',
      { defaultMessage: 'Month to date' }
    ),
  },
  {
    start: 'now/y',
    end: 'now',
    label: i18n.translate(
      'opensearch.reports.settings.constants.commonTimeRanges.yearToDate',
      { defaultMessage: 'Year to date' }
    ),
  },
];
