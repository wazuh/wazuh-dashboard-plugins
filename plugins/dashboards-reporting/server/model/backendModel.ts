/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FORMAT,
  REPORT_STATE,
  REPORT_TYPE,
  TRIGGER_TYPE,
} from '../routes/utils/constants';

export type BackendReportInstanceType = {
  id: string;
  lastUpdatedTimeMs?: number;
  createdTimeMs?: number;
  beginTimeMs: number;
  endTimeMs: number;
  access?: string[];
  tenant?: string;
  status: BACKEND_REPORT_STATE;
  statusText?: string;
  inContextDownloadUrlPath?: string;
  reportDefinitionDetails: BackendReportDefinitionDetailsType;
};

export type BackendReportDefinitionType = {
  name: string;
  isEnabled: boolean;
  source: {
    description: string;
    type: BACKEND_REPORT_SOURCE;
    id: string;
    origin: string;
  };
  format: {
    duration: string;
    fileFormat: BACKEND_REPORT_FORMAT;
    limit?: number;
    header?: string;
    footer?: string;
  };
  trigger: {
    triggerType: BACKEND_TRIGGER_TYPE;
    schedule?: CronType | IntervalType;
  };
  delivery?: DeliveryType;
};

export type BackendReportDefinitionDetailsType = {
  id?: string;
  lastUpdatedTimeMs: number;
  createdTimeMs: number;
  access?: string[];
  reportDefinition: BackendReportDefinitionType;
};

export type CronType = {
  cron: {
    expression: string;
    timezone: string;
  };
};

export type IntervalType = {
  interval: {
    start_time: number;
    period: number;
    unit: string;
  };
};

export type DeliveryType = {
  configIds: string[];
  title: string;
  textDescription: string;
  htmlDescription?: string;
};

export enum BACKEND_DELIVERY_FORMAT {
  linkOnly = 'LinkOnly',
  attachment = 'Attachment',
  embedded = 'Embedded',
}

export enum BACKEND_REPORT_SOURCE {
  dashboard = 'Dashboard',
  visualization = 'Visualization',
  savedSearch = 'SavedSearch',
  notebook = 'Notebook'
}

export enum BACKEND_REPORT_STATE {
  scheduled = 'Scheduled',
  executing = 'Executing',
  success = 'Success',
  failed = 'Failed',
}

export enum BACKEND_REPORT_FORMAT {
  pdf = 'Pdf',
  png = 'Png',
  csv = 'Csv',
  xlsx = 'Xlsx',
}

export enum BACKEND_TRIGGER_TYPE {
  download = 'Download',
  onDemand = 'OnDemand',
  cronSchedule = 'CronSchedule',
  intervalSchedule = 'IntervalSchedule',
}

export const REPORT_STATE_DICT = {
  [REPORT_STATE.pending]: BACKEND_REPORT_STATE.executing,
  [REPORT_STATE.error]: BACKEND_REPORT_STATE.failed,
  [REPORT_STATE.shared]: BACKEND_REPORT_STATE.success,
  [REPORT_STATE.created]: BACKEND_REPORT_STATE.success,
};

export const REPORT_SOURCE_DICT = {
  [REPORT_TYPE.dashboard]: BACKEND_REPORT_SOURCE.dashboard,
  [REPORT_TYPE.visualization]: BACKEND_REPORT_SOURCE.visualization,
  [REPORT_TYPE.savedSearch]: BACKEND_REPORT_SOURCE.savedSearch,
  [REPORT_TYPE.notebook]: BACKEND_REPORT_SOURCE.notebook
};

export const REPORT_FORMAT_DICT = {
  [FORMAT.csv]: BACKEND_REPORT_FORMAT.csv,
  [FORMAT.xlsx]: BACKEND_REPORT_FORMAT.xlsx,
  [FORMAT.pdf]: BACKEND_REPORT_FORMAT.pdf,
  [FORMAT.png]: BACKEND_REPORT_FORMAT.png,
};

export const TRIGGER_TYPE_DICT = {
  [TRIGGER_TYPE.schedule]: [
    BACKEND_TRIGGER_TYPE.cronSchedule,
    BACKEND_TRIGGER_TYPE.intervalSchedule,
  ],
  [TRIGGER_TYPE.onDemand]: [
    BACKEND_TRIGGER_TYPE.onDemand,
    BACKEND_TRIGGER_TYPE.download,
  ],
};

export const URL_PREFIX_DICT = {
  [BACKEND_REPORT_SOURCE.dashboard]: '/app/dashboards#/view/',
  [BACKEND_REPORT_SOURCE.savedSearch]: '/app/discover#/view/',
  [BACKEND_REPORT_SOURCE.visualization]: '/app/visualize#/edit/',
  [BACKEND_REPORT_SOURCE.notebook]: '/app/notebooks-dashboards?view=output_only#/'
};
