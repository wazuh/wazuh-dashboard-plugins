/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../src/core/server';
import { API_PREFIX } from '../../common';
import { errorResponse } from './utils/helpers';
import { getMetrics } from './utils/metricHelper';

export default function (router: IRouter) {
  router.get(
    {
      path: `${API_PREFIX}/stats`,
      validate: false,
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      //@ts-ignore
      const logger: Logger = context.reporting_plugin.logger;
      try {
        const metrics = getMetrics();
        return response.ok({
          body: metrics,
        });
      } catch (error) {
        logger.error(`failed during query reporting stats: ${error}`);
        return errorResponse(response, error);
      }
    }
  );
}
