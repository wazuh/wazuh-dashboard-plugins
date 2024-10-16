/*
 * Wazuh app - Class for Wazuh-API functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Require some libraries
import { ErrorResponse } from '../lib/error-response';
import { Parser } from 'json2csv';
import { KeyEquivalence } from '../../common/csv-key-equivalence';
import { ApiErrorEquivalence } from '../lib/api-errors-equivalence';
import apiRequestList from '../../common/api-info/endpoints.json';
import {
  ERROR_CODES,
  HTTP_STATUS_CODES,
  WAZUH_ERROR_DAEMONS_NOT_READY,
} from '../../common/constants';
import { addJobToQueue } from '../start/queue';
import jwtDecode from 'jwt-decode';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  OpenSearchDashboardsResponseFactory,
} from '../../../../src/core/server';
import { getCookieValueByName } from '../lib/cookie';
import {
  version as pluginVersion,
  revision as pluginRevision,
} from '../../package.json';
import { WzToken } from './types';

export class WazuhApiCtrl {
  private readonly SERVER_API_PENDING_INITIALIZATION =
    'Server API is online but the server is not ready yet';
  private readonly SERVER_NOT_READY_YET = 'Server not ready yet';

  private readonly MISSING_PARAM_API = 'Missing param: API';

  constructor() {}

  async getToken(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<
      unknown,
      unknown,
      { force: boolean; idHost: string }
    >,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const { force, idHost } = request.body;
      const { username } = await context.wazuh.security.getCurrentUser(
        request,
        context,
      );
      if (
        !force &&
        request.headers.cookie &&
        username ===
          decodeURIComponent(
            getCookieValueByName(request.headers.cookie as string, 'wz-user') ??
              '',
          ) &&
        idHost ===
          getCookieValueByName(request.headers.cookie as string, 'wz-api')
      ) {
        const wzToken = getCookieValueByName(
          request.headers.cookie as string,
          'wz-token',
        );
        if (wzToken) {
          try {
            // if the current token is not a valid jwt token we ask for a new one
            const decodedToken = jwtDecode<WzToken>(wzToken);
            const expirationTime = decodedToken.exp - Date.now() / 1000;
            if (wzToken && expirationTime > 0) {
              return response.ok({
                body: { token: wzToken },
              });
            }
          } catch (error) {
            context.wazuh.logger.error(
              `Error decoding the API host entry token: ${
                (error as Error).message
              }`,
            );
          }
        }
      }
      const token = await context.wazuh.api.client.asCurrentUser.authenticate(
        idHost,
      );

      let textSecure = '';
      if (context.wazuh.server.info.protocol === 'https') {
        textSecure = ';Secure';
      }
      const encodedUser = encodeURIComponent(username);
      return response.ok({
        headers: {
          'set-cookie': [
            `wz-token=${token};Path=/;HttpOnly${textSecure}`,
            `wz-user=${encodedUser};Path=/;HttpOnly${textSecure}`,
            `wz-api=${idHost};Path=/;HttpOnly`,
          ],
        },
        body: { token },
      });
    } catch (error) {
      const errorMessage = `Error getting the authorization token: ${
        error.response?.data?.detail || (error as Error).message || error
      }`;
      context.wazuh.logger.error(errorMessage);
      return ErrorResponse(
        errorMessage,
        3000,
        error?.response?.status || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        response,
      );
    }
  }

  private async requestManagerInfo(
    context: RequestHandlerContext,
    id: string,
    { forceRefresh }: { forceRefresh?: boolean } = {},
  ) {
    // Fetch needed information about the cluster and the manager itself
    return await context.wazuh.api.client.asInternalUser.request(
      'GET',
      `/manager/info`,
      {},
      { apiHostID: id, forceRefresh },
    );
  }

  /**
   * Returns if the wazuh-api configuration is working
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} status obj or ErrorResponse
   */
  async checkStoredAPI(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, any>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      // Get config from configuration
      const id = request.body.id;
      context.wazuh.logger.debug(`Getting server API host by ID: ${id}`);
      const apiHostData = await context.wazuh_core.manageHosts.get(id, {
        excludePassword: true,
      });
      const api = { ...apiHostData };
      context.wazuh.logger.debug(
        `Server API host data: ${JSON.stringify(api)}`,
      );

      context.wazuh.logger.debug(`${id} exists`);

      const promises = [
        this.requestManagerInfo(context, id, {
          forceRefresh: true,
        }),
        context.wazuh_core.manageHosts.getRegistryDataByHost(apiHostData, {
          throwError: true,
        }),
      ];

      const settledResult = await Promise.allSettled(promises);
      let responseManagerInfo;

      if (settledResult[0].status === 'fulfilled') {
        responseManagerInfo = settledResult[0].value;
        // Look for socket-related errors
        if (this.checkResponseIsDown(context, responseManagerInfo)) {
          return ErrorResponse(
            `${WAZUH_ERROR_DAEMONS_NOT_READY} - ${
              responseManagerInfo.data.detail || this.SERVER_NOT_READY_YET
            }`,
            3099,
            HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
            response,
          );
        }
      } else {
        throw new Error(settledResult[0].reason);
      }

      // If we have a valid response from the Wazuh API
      if (settledResult[1].status === 'fulfilled') {
        const { status, manager, node, cluster } = settledResult[1].value;
        api.cluster_info = { status, manager, node, cluster };

        return response.ok({
          body: {
            statusCode: HTTP_STATUS_CODES.OK,
            data: api,
            idChanged: request.body.idChanged || null,
          },
        });
      } else {
        // If we have an invalid response from the Wazuh API
        throw new Error(
          responseManagerInfo.data.detail ||
            `${api.url}:${api.port} is unreachable`,
        );
      }
    } catch (error) {
      if (error.code === ERROR_CODES.EPROTO) {
        return response.ok({
          body: {
            statusCode: HTTP_STATUS_CODES.OK,
            data: { apiIsDown: true },
          },
        });
      } else if (error.code === ERROR_CODES.ECONNREFUSED) {
        return response.ok({
          body: {
            statusCode: HTTP_STATUS_CODES.OK,
            data: { apiIsDown: true },
          },
        });
      } else {
        try {
          const apis = await context.wazuh_core.manageHosts.get();
          for (const api of apis) {
            try {
              const { id } = api;

              const responseManagerInfo = await this.requestManagerInfo(
                context,
                id,
              );

              if (this.checkResponseIsDown(context, responseManagerInfo)) {
                return ErrorResponse(
                  `${WAZUH_ERROR_DAEMONS_NOT_READY} - ${
                    response.data.detail || this.SERVER_NOT_READY_YET
                  }`,
                  3099,
                  HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
                  response,
                );
              }
              if (responseManagerInfo.status === HTTP_STATUS_CODES.OK) {
                request.body.id = id;
                request.body.idChanged = id;
                return await this.checkStoredAPI(context, request, response);
              }
            } catch (error) {} // eslint-disable-line
          }
        } catch (error) {
          context.wazuh.logger.error((error as Error).message || error);
          return ErrorResponse(
            (error as Error).message || error,
            3020,
            error?.response?.status || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            response,
          );
        }
        context.wazuh.logger.error((error as Error).message || error);
        return ErrorResponse(
          (error as Error).message || error,
          3002,
          error?.response?.status || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
          response,
        );
      }
    }
  }

  /**
   * This perfoms a validation of API params
   * @param {Object} body API params
   */
  validateCheckApiParams(body: {
    username?: string;
    password?: string;
    url?: string;
    port?: number;
    id?: string;
  }) {
    if (!('username' in body)) {
      return this.MISSING_PARAM_API + ' USERNAME';
    }

    if (!('password' in body) && !('id' in body)) {
      return this.MISSING_PARAM_API + ' PASSWORD';
    }

    if (!('url' in body)) {
      return this.MISSING_PARAM_API + ' URL';
    }

    if (!('port' in body)) {
      return this.MISSING_PARAM_API + ' PORT';
    }

    if (!body.url?.includes('https://') && !body.url?.includes('http://')) {
      return 'protocol_error';
    }

    return false;
  }

  /**
   * This check the wazuh-api configuration received in the POST body will work
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} status obj or ErrorResponse
   */
  async checkAPI(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<unknown, unknown, any>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      context.wazuh.logger.debug(`${request.body.id} is valid`);
      const options: { apiHostID: string; forceRefresh?: boolean } = {
        apiHostID: request.body.id,
      };
      if (request.body.forceRefresh) {
        options['forceRefresh'] = request.body.forceRefresh;
      }
      const promises = [
        context.wazuh_core.manageHosts.get(request.body.id, {
          excludePassword: true,
        }),
        context.wazuh.api.client.asInternalUser.request(
          'GET',
          `/manager/info`,
          {},
          options,
        ),
      ];

      let data;
      const settledResults = await Promise.allSettled(promises);

      if (settledResults[0].status === 'fulfilled') {
        // Check if a Wazuh API id is given (already stored API)
        data = settledResults[0].value;

        if (!data) {
          const errorMessage = `The server API host entry with ID ${request.body.id} was not found`;
          context.wazuh.logger.debug(errorMessage);
          return ErrorResponse(
            errorMessage,
            3029,
            HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            response,
          );
        }
      } else {
        throw new Error(settledResults[0].reason);
      }

      let responseManagerInfo;
      if (settledResults[1].status === 'fulfilled') {
        responseManagerInfo = settledResults[1].value;
      } else {
        const error = settledResults[1].reason;
        return ErrorResponse(
          `${WAZUH_ERROR_DAEMONS_NOT_READY} - ${
            error.response?.data?.detail || this.SERVER_NOT_READY_YET
          }`,
          3099,
          error?.response?.status || HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
          response,
        );
      }
      context.wazuh.logger.debug(`${request.body.id} credentials are valid`);
      if (
        responseManagerInfo.status === HTTP_STATUS_CODES.OK &&
        responseManagerInfo.data
      ) {
        const result =
          await context.wazuh_core.manageHosts.getRegistryDataByHost(data);
        return response.ok({
          body: result,
        });
      }
    } catch (error) {
      context.wazuh.logger.warn((error as Error).message || error);

      if (
        error &&
        error.response &&
        error.response.status === HTTP_STATUS_CODES.UNAUTHORIZED
      ) {
        return ErrorResponse(
          `Unathorized. Please check API credentials. ${error.response.data.message}`,
          HTTP_STATUS_CODES.UNAUTHORIZED,
          HTTP_STATUS_CODES.UNAUTHORIZED,
          response,
        );
      }
      if (
        error &&
        error.response &&
        error.response.data &&
        error.response.data.detail
      ) {
        return ErrorResponse(
          error.response.data.detail,
          error.response.status || HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
          error.response.status || HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
          response,
        );
      }
      if (error.code === ERROR_CODES.EPROTO) {
        return ErrorResponse(
          'Wrong protocol being used to connect to the API',
          3005,
          HTTP_STATUS_CODES.BAD_REQUEST,
          response,
        );
      }
      return ErrorResponse(
        ((error as Error).message || error) as string,
        3005,
        error?.response?.status || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        response,
      );
    }
  }

  checkResponseIsDown(
    context: RequestHandlerContext,
    response: { status: number; data?: { status: number } },
  ) {
    if (response.status !== HTTP_STATUS_CODES.OK) {
      // Avoid "Error communicating with socket" like errors
      const socketErrorCodes = [1013, 1014, 1017, 1018, 1019];
      const status = response.data?.status || 1;
      const isDown = socketErrorCodes.includes(status);

      isDown &&
        context.wazuh.logger.error(this.SERVER_API_PENDING_INITIALIZATION);

      return isDown;
    }
    return false;
  }

  /**
   * Check main Wazuh daemons status
   * @param {RequestHandlerContext} context Endpoint context
   * @param {*} api API entry stored in .wazuh
   * @param {string} path Optional. Wazuh API target path.
   */
  async checkDaemons(context: RequestHandlerContext, api, path: string) {
    try {
      const response = await context.wazuh.api.client.asInternalUser.request(
        'GET',
        '/manager/status',
        {},
        { apiHostID: api.id },
      );

      const daemons = response?.data?.data?.affected_items?.[0] || {};

      const isCluster =
        api?.cluster_info?.status === 'enabled' &&
        typeof daemons['wazuh-clusterd'] !== 'undefined';
      const wazuhdbExists = typeof daemons['wazuh-db'] !== 'undefined';

      const execd = daemons['wazuh-execd'] === 'running';
      const modulesd = daemons['wazuh-modulesd'] === 'running';
      const wazuhdb = wazuhdbExists ? daemons['wazuh-db'] === 'running' : true;
      const clusterd = isCluster
        ? daemons['wazuh-clusterd'] === 'running'
        : true;

      const isValid = execd && modulesd && wazuhdb && clusterd;

      isValid && context.wazuh.logger.debug('Wazuh is ready');

      if (path === '/ping') {
        return { isValid };
      }

      if (!isValid) {
        throw new Error(this.SERVER_NOT_READY_YET);
      }
    } catch (error) {
      context.wazuh.logger.error((error as Error).message || error);
      return Promise.reject(error);
    }
  }

  sleep(timeMs: number) {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => {
      setTimeout(resolve, timeMs);
    });
  }

  /**
   * This performs a request over Wazuh API and returns its response
   * @param {String} method Method: GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} data data and params to perform the request
   * @param {String} id API id
   * @param {Object} response
   * @returns {Object} API response or ErrorResponse
   */
  async makeRequest(
    context: RequestHandlerContext,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data: {
      devTools?: boolean;
      delay?: number;
      headers?: Record<string, string>;
      origin?: string;
      body?: any;
    },
    id: string,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    const devTools = !!data?.devTools;
    try {
      let api;
      try {
        api = await context.wazuh_core.manageHosts.get(id, {
          excludePassword: true,
        });
      } catch (error) {
        context.wazuh.logger.error('Could not get host credentials');
        //Can not get credentials from wazuh-hosts
        return ErrorResponse(
          'Could not get host credentials',
          3011,
          HTTP_STATUS_CODES.NOT_FOUND,
          response,
        );
      }

      if (devTools) {
        delete data.devTools;
      }

      if (!data) {
        data = {};
      }

      if (!data.headers) {
        data.headers = {};
      }

      const options = {
        apiHostID: id,
      };

      // Set content type application/xml if needed
      if (typeof data?.body === 'string' && data?.origin === 'xmleditor') {
        data.headers['content-type'] = 'application/xml';
        delete data.origin;
      }

      if (typeof data?.body === 'string' && data?.origin === 'json') {
        data.headers['content-type'] = 'application/json';
        delete data.origin;
      }

      if (typeof data?.body === 'string' && data?.origin === 'raw') {
        data.headers['content-type'] = 'application/octet-stream';
        delete data.origin;
      }
      const delay = data?.delay || 0;
      if (delay) {
        // Remove the delay parameter that is used to add the sever API request to the queue job.
        // This assumes the delay parameter is not used as part of the server API request. If it
        // was expected to do a request with a 'delay' parameter then we would have to search a
        // way to differenciate if the parameter is related to job queue or API request.
        delete data.delay;
        addJobToQueue({
          startAt: new Date(Date.now() + delay),
          run: async contextJob => {
            try {
              await context.wazuh.api.client.asCurrentUser.request(
                method,
                path,
                data,
                options,
              );
            } catch (error) {
              contextJob.wazuh.logger.error(
                `An error ocurred in the delayed request: "${method} ${path}": ${
                  ((error as Error).message || error) as string
                }`,
              );
            }
          },
        });
        return response.ok({
          body: { error: 0, message: 'Success' },
        });
      }

      if (path === '/ping') {
        try {
          const check = await this.checkDaemons(context, api, path);
          return check;
        } catch (error) {
          const isDown = error?.code === ERROR_CODES.ECONNREFUSED;
          if (!isDown) {
            context.wazuh.logger.error(this.SERVER_API_PENDING_INITIALIZATION);
            return ErrorResponse(
              `${WAZUH_ERROR_DAEMONS_NOT_READY} - ${
                (error as Error).message || this.SERVER_NOT_READY_YET
              }`,
              3099,
              HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
              response,
            );
          }
        }
      }

      context.wazuh.logger.debug(`${method} ${path}`);

      const responseToken =
        await context.wazuh.api.client.asCurrentUser.request(
          method,
          path,
          data,
          options,
        );
      const responseIsDown = this.checkResponseIsDown(context, responseToken);
      if (responseIsDown) {
        return ErrorResponse(
          `${WAZUH_ERROR_DAEMONS_NOT_READY} - ${
            response.body.message || this.SERVER_NOT_READY_YET
          }`,
          3099,
          HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
          response,
        );
      }
      let responseBody = responseToken?.data || {};
      if (!responseBody) {
        responseBody =
          typeof responseBody === 'string' &&
          path.includes('/files') &&
          method === 'GET'
            ? ' '
            : false;
        response.data = responseBody;
      }
      const responseError =
        response.status !== HTTP_STATUS_CODES.OK ? response.status : false;

      if (!responseError && responseBody) {
        return response.ok({
          body: responseToken.data,
        });
      }

      if (responseError && devTools) {
        return response.ok({
          body: response.data,
        });
      }
      throw responseError && responseBody.detail
        ? { message: responseBody.detail, code: responseError }
        : new Error('Unexpected error fetching data from the API');
    } catch (error) {
      if (
        error &&
        error.response &&
        error.response.status === HTTP_STATUS_CODES.UNAUTHORIZED
      ) {
        return ErrorResponse(
          (error as Error).message || error,
          error.code ? `API error: ${error.code}` : 3013,
          HTTP_STATUS_CODES.UNAUTHORIZED,
          response,
        );
      }
      const errorMsg = error.response?.data || (error as Error).message;
      context.wazuh.logger.error(errorMsg || error);
      if (devTools) {
        return response.ok({
          body: { error: '3013', message: errorMsg || error },
        });
      } else {
        if (error?.code && ApiErrorEquivalence[error.code]) {
          (error as Error).message = ApiErrorEquivalence[error.code];
        }
        return ErrorResponse(
          errorMsg.detail || error,
          error.code ? `API error: ${error.code}` : 3013,
          HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
          response,
        );
      }
    }
  }

  /**
   * This make a request to API
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} api response or ErrorResponse
   */
  requestApi(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    const idApi = getCookieValueByName(request.headers.cookie, 'wz-api');
    if (idApi !== request.body.id) {
      // if the current token belongs to a different API id, we relogin to obtain a new token
      return ErrorResponse(
        'status code 401',
        HTTP_STATUS_CODES.UNAUTHORIZED,
        HTTP_STATUS_CODES.UNAUTHORIZED,
        response,
      );
    }
    if (!request.body.method) {
      return ErrorResponse(
        'Missing param: method',
        3015,
        HTTP_STATUS_CODES.BAD_REQUEST,
        response,
      );
    } else if (!request.body.method.match(/^(?:GET|PUT|POST|DELETE)$/)) {
      context.wazuh.logger.error('Request method is not valid.');
      //Method is not a valid HTTP request method
      return ErrorResponse(
        'Request method is not valid.',
        3015,
        HTTP_STATUS_CODES.BAD_REQUEST,
        response,
      );
    } else if (!request.body.path) {
      return ErrorResponse(
        'Missing param: path',
        3016,
        HTTP_STATUS_CODES.BAD_REQUEST,
        response,
      );
    } else if (!request.body.path.startsWith('/')) {
      context.wazuh.logger.error('Request path is not valid.');
      //Path doesn't start with '/'
      return ErrorResponse(
        'Request path is not valid.',
        3015,
        HTTP_STATUS_CODES.BAD_REQUEST,
        response,
      );
    } else {
      return this.makeRequest(
        context,
        request.body.method,
        request.body.path,
        request.body.body,
        request.body.id,
        response,
      );
    }
  }

  /**
   * Get full data on CSV format from a list Wazuh API endpoint
   * @param {Object} ctx
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} csv or ErrorResponse
   */
  async csv(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      if (!request.body || !request.body.path)
        throw new Error('Field path is required');
      if (!request.body.id) throw new Error('Field id is required');

      const filters = Array.isArray(request?.body?.filters)
        ? request.body.filters
        : [];

      let tmpPath = request.body.path;

      if (tmpPath && typeof tmpPath === 'string') {
        tmpPath = tmpPath[0] === '/' ? tmpPath.substr(1) : tmpPath;
      }

      if (!tmpPath) throw new Error('An error occurred parsing path field');

      context.wazuh.logger.debug(`Report ${tmpPath}`);
      // Real limit, regardless the user query
      const params: Record<string, number> = { limit: 500 };

      if (filters.length) {
        for (const filter of filters) {
          if (!filter.name || !filter.value) continue;
          params[filter.name] = filter.value;
        }
      }

      let itemsArray = [];

      const output = await context.wazuh.api.client.asCurrentUser.request(
        'GET',
        `/${tmpPath}`,
        { params: params },
        { apiHostID: request.body.id },
      );

      const isList =
        request.body.path.includes('/lists') &&
        request.body.filters &&
        request.body.filters.length &&
        request.body.filters.find(filter => filter._isCDBList);

      const totalItems = output?.data?.data?.total_affected_items;

      if (totalItems && !isList) {
        params.offset = 0;
        itemsArray.push(...output.data.data.affected_items);
        while (itemsArray.length < totalItems && params.offset < totalItems) {
          params.offset += params.limit;
          const tmpData = await context.wazuh.api.client.asCurrentUser.request(
            'GET',
            `/${tmpPath}`,
            { params: params },
            { apiHostID: request.body.id },
          );
          itemsArray.push(...tmpData.data.data.affected_items);
        }
      }

      if (totalItems) {
        const { path, filters } = request.body;
        const isArrayOfLists = path.includes('/lists') && !isList;
        const isAgents = path.includes('/agents') && !path.includes('groups');
        const isAgentsOfGroup = path.startsWith('/agents/groups/');
        const isFiles = path.endsWith('/files');
        let fields = Object.keys(output.data.data.affected_items[0]);

        if (isAgents || isAgentsOfGroup) {
          if (isFiles) {
            fields = ['filename', 'hash'];
          } else {
            fields = [
              'id',
              'status',
              'name',
              'ip',
              'group',
              'manager',
              'node_name',
              'dateAdd',
              'version',
              'lastKeepAlive',
              'os.arch',
              'os.build',
              'os.codename',
              'os.major',
              'os.minor',
              'os.name',
              'os.platform',
              'os.uname',
              'os.version',
            ];
          }
        }

        if (isArrayOfLists) {
          const flatLists = [];
          for (const list of itemsArray) {
            const { relative_dirname, items } = list;
            flatLists.push(
              ...items.map(item => ({
                relative_dirname,
                key: item.key,
                value: item.value,
              })),
            );
          }
          fields = ['relative_dirname', 'key', 'value'];
          itemsArray = [...flatLists];
        }

        if (isList) {
          fields = ['key', 'value'];
          itemsArray = output.data.data.affected_items[0].items;
        }
        const fieldsMapped = fields.map(item => ({
          value: item,
          default: '-',
        }));

        const json2csvParser = new Parser({ fields: fieldsMapped });

        let csv = json2csvParser.parse(itemsArray);
        for (const field of fieldsMapped) {
          const { value } = field;
          if (csv.includes(value)) {
            csv = csv.replace(value, KeyEquivalence[value] || value);
          }
        }

        return response.ok({
          headers: { 'Content-Type': 'text/csv' },
          body: csv,
        });
      } else if (
        output &&
        output.data &&
        output.data.data &&
        !output.data.data.total_affected_items
      ) {
        throw new Error('No results');
      } else {
        throw new Error(
          `An error occurred fetching data from the Wazuh API${
            output && output.data && output.data.detail
              ? `: ${output.body.detail}`
              : ''
          }`,
        );
      }
    } catch (error) {
      context.wazuh.logger.error(((error as Error).message || error) as string);
      return ErrorResponse(
        ((error as Error).message || error) as string,
        3034,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        response,
      );
    }
  }

  // Get de list of available requests in the API
  getRequestList(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    //Read a static JSON until the api call has implemented
    return response.ok({
      body: apiRequestList,
    });
  }

  /**
   * This get the wazuh setup settings
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} setup info or ErrorResponse
   */
  async getSetupInfo(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      return response.ok({
        body: {
          statusCode: HTTP_STATUS_CODES.OK,
          data: {
            'app-version': pluginVersion,
            revision: pluginRevision,
            configuration_file: context.wazuh_core.configuration.store.file,
          },
        },
      });
    } catch (error) {
      context.wazuh.logger.error(((error as Error).message || error) as string);
      return ErrorResponse(
        `Could not get data from wazuh-version registry due to ${
          ((error as Error).message || error) as string
        }`,
        4005,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        response,
      );
    }
  }

  /**
   * Get basic syscollector information for given agent.
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} Basic syscollector information
   */
  async getSyscollector(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const apiHostID = getCookieValueByName(request.headers.cookie, 'wz-api');
      if (!request.params || !apiHostID || !request.params.agent) {
        throw new Error('Agent ID and API ID are required');
      }

      const { agent } = request.params;

      const data = await Promise.all([
        context.wazuh.api.client.asInternalUser.request(
          'GET',
          `/syscollector/${agent}/hardware`,
          {},
          { apiHostID },
        ),
        context.wazuh.api.client.asInternalUser.request(
          'GET',
          `/syscollector/${agent}/os`,
          {},
          { apiHostID },
        ),
      ]);

      const result = data.map(item => item.data?.data || []);
      const [hardwareResponse, osResponse] = result;

      // Fill syscollector object
      const syscollector = {
        hardware:
          typeof hardwareResponse === 'object' &&
          Object.keys(hardwareResponse).length
            ? { ...hardwareResponse.affected_items[0] }
            : false,
        os:
          typeof osResponse === 'object' && Object.keys(osResponse).length
            ? { ...osResponse.affected_items[0] }
            : false,
      };

      return response.ok({
        body: syscollector,
      });
    } catch (error) {
      context.wazuh.logger.error(((error as Error).message || error) as string);
      return ErrorResponse(
        ((error as Error).message || error) as string,
        3035,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        response,
      );
    }
  }

  /**
   * Gets custom logos configuration (path)
   * @param context
   * @param request
   * @param response
   */
  async getAppLogos(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const APP_LOGO = 'customization.logo.app';
      const HEALTHCHECK_LOGO = 'customization.logo.healthcheck';

      const logos = {
        [APP_LOGO]:
          await context.wazuh_core.configuration.getCustomizationSetting(
            APP_LOGO,
          ),
        [HEALTHCHECK_LOGO]:
          await context.wazuh_core.configuration.getCustomizationSetting(
            HEALTHCHECK_LOGO,
          ),
      };

      return response.ok({
        body: { logos },
      });
    } catch (error) {
      context.wazuh.logger.error(((error as Error).message || error) as string);
      return ErrorResponse(
        ((error as Error).message || error) as string,
        3035,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        response,
      );
    }
  }
}
