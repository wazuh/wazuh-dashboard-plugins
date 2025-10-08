import {
  UIErrorLog,
  UILogLevel,
} from './../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { WzRequest } from '../../../react-services';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';

/**
 * Retrieves the Wazuh API version by making a GET request to the root endpoint.
 *
 * @param context - A string representing the context in which the API version is being requested. Used for error logging.
 * @returns A promise that resolves to the Wazuh API version as a string (e.g., "4.14.0"), or `undefined` if the request fails.
 *
 * @example
 * // Example response:
 * {
 *   "data": {
 *     "title": "Wazuh API REST",
 *     "api_version": "4.14.0",
 *     "revision": 1,
 *     "license_name": "GPL 2.0",
 *     "license_url": "https://github.com/wazuh/wazuh/blob/4.5/LICENSE",
 *     "hostname": "imposter",
 *     "timestamp": "2022-06-13T17:20:03Z"
 *   },
 *   "error": 0
 * }
 *
 * @remarks
 * If the request fails, the error is handled by the error orchestrator and logged with the provided context.
 */
export const getWazuhAPIVersion = async (context: string) => {
  try {
    const result = await WzRequest.apiReq('GET', '/', {});
    return result?.data?.data?.api_version;
  } catch (error) {
    const options: UIErrorLog = {
      context,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      error: {
        error: error,
        //@ts-expect-error
        message: error.message || error,
        //@ts-expect-error
        title: `Could not get the Wazuh version: ${error.message || error}`,
      },
    };
    getErrorOrchestrator().handleError(options);
    return;
  }
};
