/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReportDefinitionSchemaType } from '../../model';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  ILegacyScopedClusterClient,
} from '../../../../../src/core/server';
import { uiToBackendReportDefinition } from '../utils/converters/uiToBackend';

export const createReportDefinition = async (
  request: OpenSearchDashboardsRequest,
  context: RequestHandlerContext,
  reportDefinition: ReportDefinitionSchemaType
) => {
  // @ts-ignore
  const opensearchReportsClient: ILegacyScopedClusterClient = context.reporting_plugin.opensearchReportsClient.asScoped(
    request
  );
  // create report definition
  const reqBody = {
    reportDefinition: uiToBackendReportDefinition(reportDefinition),
  };

  const opensearchResp = await opensearchReportsClient.callAsCurrentUser(
    'opensearch_reports.createReportDefinition',
    {
      body: reqBody,
    }
  );

  return opensearchResp;
};
