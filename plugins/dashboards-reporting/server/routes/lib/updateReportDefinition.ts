/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportDefinitionSchemaType } from '../../model';
import {
  ILegacyScopedClusterClient,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../../src/core/server';
import { uiToBackendReportDefinition } from '../utils/converters/uiToBackend';

export const updateReportDefinition = async (
  request: OpenSearchDashboardsRequest,
  context: RequestHandlerContext,
  reportDefinition: ReportDefinitionSchemaType
) => {
  // @ts-ignore
  const opensearchReportsClient: ILegacyScopedClusterClient = context.reporting_plugin.opensearchReportsClient.asScoped(
    request
  );
  // @ts-ignore
  const reportDefinitionId = request.params.reportDefinitionId;
  // create report definition
  const reqBody = {
    reportDefinitionId: reportDefinitionId,
    reportDefinition: uiToBackendReportDefinition(reportDefinition),
  };

  const opensearchResp = await opensearchReportsClient.callAsCurrentUser(
    'opensearch_reports.updateReportDefinitionById',
    {
      reportDefinitionId: reportDefinitionId,
      body: reqBody,
    }
  );

  return opensearchResp;
};
