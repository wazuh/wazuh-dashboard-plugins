/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IRouter,
  IOpenSearchDashboardsResponse,
  ResponseError,
} from '../../../../src/core/server';
import { API_PREFIX } from '../../common';
import { checkErrorType, parseOpenSearchErrorResponse } from './utils/helpers';
import { RequestParams } from '@elastic/elasticsearch';
import { schema } from '@osd/config-schema';
import { DEFAULT_MAX_SIZE } from './utils/constants';
import { addToMetric } from './utils/metricHelper';

export default function (router: IRouter) {
  router.get(
    {
      path: `${API_PREFIX}/getReportSource/{reportSourceType}`,
      validate: {
        params: schema.object({
          reportSourceType: schema.string(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      let responseParams;
      if (request.params.reportSourceType === 'dashboard') {
        const params: RequestParams.Search = {
          index: '.kibana',
          q: 'type:dashboard',
          size: DEFAULT_MAX_SIZE,
        };
        responseParams = params;
      } else if (request.params.reportSourceType === 'visualization') {
        const params: RequestParams.Search = {
          index: '.kibana',
          q: 'type:visualization',
          size: DEFAULT_MAX_SIZE,
        };
        responseParams = params;
      } else if (request.params.reportSourceType === 'search') {
        const params: RequestParams.Search = {
          index: '.kibana',
          q: 'type:search',
          size: DEFAULT_MAX_SIZE,
        };
        responseParams = params;
      } try {
        const opensearchResp = await context.core.opensearch.legacy.client.callAsCurrentUser(
          'search',
          responseParams
        );
        addToMetric('report_source', 'list', 'count');

        return response.ok({
          body: opensearchResp,
        });
      } catch (error) {
        //@ts-ignore
        context.reporting_plugin.logger.error(
          `Failed to get reports source for ${request.params.reportSourceType}: ${error}`
        );
        addToMetric('report_source', 'list', checkErrorType(error));
        return response.custom({
          statusCode: error.statusCode,
          body: parseOpenSearchErrorResponse(error),
        });
      }
    }
  );
}
