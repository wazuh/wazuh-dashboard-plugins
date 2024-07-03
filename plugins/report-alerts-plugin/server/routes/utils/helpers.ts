/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsResponseFactory } from '../../../../../src/core/server';
import { v1 as uuidv1 } from 'uuid';
import {
  ILegacyClusterClient,
  ILegacyScopedClusterClient,
} from '../../../../../src/core/server';

/**
 * OpenSearch error response body:
 *  {
 *   error: {
 *     root_cause: [{ type: 'status_exception', reason: 'test exception' }],
 *     type: 'status_exception',
 *     reason: 'test exception',
 *   },
 *   status: 404,
 * };
 *
 */
export function parseOpenSearchErrorResponse(error: any) {
  if (error.response) {
    try {
      const opensearchErrorResponse = JSON.parse(error.response);
      return opensearchErrorResponse.error.reason || error.response;
    } catch (parsingError) {
      return error.response;
    }
  }
  return error.message;
}

export function errorResponse(response: OpenSearchDashboardsResponseFactory, error: any) {
  return response.custom({
    statusCode: error.statusCode || 500,
    body: parseOpenSearchErrorResponse(error),
  });
}

/**
 * Generate report file name based on name and timestamp.
 * @param itemName      report item name
 * @param timeCreated   timestamp when this is being created
 */
export function getFileName(itemName: string, timeCreated: Date): string {
  return `${itemName}_${timeCreated.toISOString()}_${uuidv1()}`;
}

/**
 * Call OpenSearch cluster function.
 * @param client    OpenSearch client
 * @param endpoint  OpenSearch API method
 * @param params    OpenSearch API parameters
 */
export const callCluster = async (
  client: ILegacyClusterClient | ILegacyScopedClusterClient,
  endpoint: string,
  params: any,
  isScheduledTask: boolean
) => {
  let opensearchResp;
  if (isScheduledTask) {
    opensearchResp = await (client as ILegacyClusterClient).callAsInternalUser(
      endpoint,
      params
    );
  } else {
    opensearchResp = await (client as ILegacyScopedClusterClient).callAsCurrentUser(
      endpoint,
      params
    );
  }
  return opensearchResp;
};

export const checkErrorType = (error: any) => {
  if (error.statusCode && Math.floor(error.statusCode / 100) === 4) {
    return 'user_error';
  } else {
    return 'system_error';
  }
};

export const joinRequestParams = (
  queryParams: string | string[] | undefined
) => {
  if (Array.isArray(queryParams)) return queryParams.join(',');
  if (typeof queryParams === 'string') return queryParams;
  return '';
};