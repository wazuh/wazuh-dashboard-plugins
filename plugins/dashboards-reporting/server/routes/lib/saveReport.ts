/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { v1 as uuidv1 } from 'uuid';
import { ReportSchemaType } from '../../model';
import { BACKEND_REPORT_STATE } from '../../model/backendModel';
import { ILegacyScopedClusterClient } from '../../../../../src/core/server';
import { uiToBackendReportDefinition } from '../utils/converters/uiToBackend';

export const saveReport = async (
  report: ReportSchemaType,
  opensearchReportsClient: ILegacyScopedClusterClient
) => {
  const timePending = Date.now();
  const {
    time_from: timeFrom,
    time_to: timeTo,
    query_url: queryUrl,
    report_definition: reportDefinition,
  } = report;

  const reqBody = {
    beginTimeMs: timeFrom,
    endTimeMs: timeTo,
    reportDefinitionDetails: {
      id: uuidv1(),
      lastUpdatedTimeMs: timePending,
      createdTimeMs: timePending,
      reportDefinition: {
        ...uiToBackendReportDefinition(reportDefinition),
        trigger: {
          triggerType: 'Download', // TODO: this is a corner case for in-context menu button download only
        },
      },
    },
    // download from in-context menu should always pass executing state to backend
    // TODO: set to success, since update report status API in temporarily unavailable, need change back to pending later
    status: BACKEND_REPORT_STATE.success,
    inContextDownloadUrlPath: queryUrl,
  };

  const opensearchResp = await opensearchReportsClient.callAsCurrentUser(
    'opensearch_reports.createReport',
    {
      body: reqBody,
    }
  );

  return opensearchResp;
};
