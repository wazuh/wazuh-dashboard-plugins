/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CreateReportResultType {
  timeCreated: number;
  dataUrl: string;
  fileName: string;
  reportId: string;
  queryUrl: string;
}

type ReportSourceType = 'dashboard' | 'visualization' | 'saved_search' | 'notebook';
type ReportFormatType = 'pdf' | 'png' | 'csv' | 'xlsx';
type UsageActionType = 'download';
export type EntityType = 'report' | 'report_definition' | 'report_source';

export type CountersNameType =
  | 'count'
  | 'system_error'
  | 'user_error'
  | 'total';
export type ActionType =
  | 'info'
  | 'list'
  | 'delete'
  | 'create'
  | 'download'
  | 'update'
  | 'create_from_definition';

export type CountersType = ActionCountersType & UsageCountersType;

type ActionCountersType = {
  [entity in EntityType]: {
    [action in ActionType]?: {
      [counter in CountersNameType]?: number;
    };
  };
};

type UsageCountersType = {
  [source in ReportSourceType]: {
    [format in ReportFormatType]?: {
      [action in UsageActionType]: {
        [counter in CountersNameType]?: number;
      };
    };
  };
};
