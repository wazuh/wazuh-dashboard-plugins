/*
 * Wazuh app - Generic error response constructor
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { HTTP_STATUS_CODES } from '../../common/constants';

enum ERROR_TYPE {
  ENOTFOUND = 'ENOTFOUND',
  EHOSTUNREACH = 'EHOSTUNREACH',
  EINVAL = 'EINVAL',
  EAI_AGAIN = 'EAI_AGAIN',
  ECONNREFUSED = 'ECONNREFUSED',
  ENOENT = 'ENOENT',
}

export enum WAZUH_STATUS_CODES {
  UNKNOWN = 1000,
}

/**
 * Error codes:
 * wazuh-api-elastic 20XX
 * wazuh-api         30XX
 * wazuh-elastic     40XX
 * wazuh-reporting   50XX
 * unknown           1000
 */
/**
 * Returns a suitable error message
 * @param {String} message Error message
 * @param {Number} wazuhStatusCode Error code
 * @param {Number} statusCode Error status code
 * @returns {Object} Error response object
 */
export function ErrorResponse(
  message: string | null = null,
  wazuhStatusCode: number | null = null,
  statusCode: number | null = null,
  response: any,
) {
  message?.includes('password: ')
    ? (message = message.split('password: ')[0] + ' password: ***')
    : false;
  let filteredMessage = '';
  if (wazuhStatusCode && typeof message === 'string') {
    if (message === 'socket hang up' && wazuhStatusCode === 3005) {
      filteredMessage = 'Wrong protocol being used to connect to the API';
    } else if (
      (message?.includes(ERROR_TYPE.ENOTFOUND) ||
        message?.includes(ERROR_TYPE.EHOSTUNREACH) ||
        message?.includes(ERROR_TYPE.EINVAL) ||
        message?.includes(ERROR_TYPE.EAI_AGAIN)) &&
      wazuhStatusCode === 3005
    ) {
      filteredMessage = 'API is not reachable. Please check your url and port.';
    } else if (
      message?.includes(ERROR_TYPE.ECONNREFUSED) &&
      wazuhStatusCode === 3005
    ) {
      filteredMessage = 'API is not reachable. Please check your url and port.';
    } else if (
      message?.toLowerCase().includes('not found') &&
      wazuhStatusCode === 3002
    ) {
      filteredMessage = 'It seems the selected API was deleted.';
    } else if (
      message?.includes(ERROR_TYPE.ENOENT) &&
      message?.toLowerCase().includes('no such file or directory') &&
      message?.toLowerCase().includes('data') &&
      [5029, 5030, 5031, 5032].includes(wazuhStatusCode)
    ) {
      filteredMessage = 'Reporting was aborted - no such file or directory';
    } else if (wazuhStatusCode === 5029) {
      filteredMessage = `Reporting was aborted (${message})`;
    } else {
      filteredMessage = message;
    }
  } else {
    filteredMessage = 'Unexpected error';
  }

  const statusCodeResponse =
    statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  return response.custom({
    statusCode: statusCodeResponse,
    body: {
      message: `${
        wazuhStatusCode || WAZUH_STATUS_CODES.UNKNOWN
      } - ${filteredMessage}`,
      code: wazuhStatusCode || WAZUH_STATUS_CODES.UNKNOWN,
      statusCode: statusCodeResponse,
    },
  });
}
