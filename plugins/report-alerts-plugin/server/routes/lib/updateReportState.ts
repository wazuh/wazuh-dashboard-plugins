/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ILegacyClusterClient,
  ILegacyScopedClusterClient,
} from '../../../../../src/core/server';
import { REPORT_STATE } from '../utils/constants';
import { getBackendReportState } from '../utils/converters/uiToBackend';

// The only thing can be updated of a report instance is its "state"
export const updateReportState = async (
  reportId: string,
  opensearchReportsClient: ILegacyClusterClient | ILegacyScopedClusterClient,
  state: REPORT_STATE
) => {
  //Build request body
  const reqBody = {
    reportInstanceId: reportId,
    status: getBackendReportState(state),
  };

  const opensearchResp = await opensearchReportsClient.callAsInternalUser(
    // @ts-ignore
    'opensearch_reports.updateReportInstanceStatus',
    {
      reportInstanceId: reportId,
      body: reqBody,
    }
  );

  return opensearchResp;
};
