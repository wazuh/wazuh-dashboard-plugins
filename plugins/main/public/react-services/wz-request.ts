/*
 * Wazuh app - API request service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from './app-state';
import { ApiCheck } from './wz-api-check';
import { WzAuthentication } from './wz-authentication';
import { WzMisc } from '../factories/misc';
import { WazuhConfig } from './wazuh-config';
import IApiResponse from './interfaces/api-response.interface';
import { getCore, getHttp, getToasts } from '../kibana-services';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../common/constants';
import { request } from '../services/request-handler';
import { BehaviorSubject } from 'rxjs';
import { first, distinctUntilChanged } from 'rxjs/operators';
import { throttle } from 'lodash';

// throttle to avoid multiple toasts
const displayAPINotAvailableToast = throttle(({ title, text }) => {
  getToasts().add({
    color: 'warning',
    title,
    text,
  });
}, 500);
export class WzRequest {
  static wazuhConfig: any;
  static serverAPIAvailable$ = new BehaviorSubject(true);
  static serverAPIAvailableChanged$ = this.serverAPIAvailable$.pipe(
    distinctUntilChanged(),
  );

  static async setupAPIInCookie() {
    const currentApiDataCookie = AppState.getCurrentAPI();
    // TODO: review clustInfo cookie
    let currentApiID;

    if (currentApiDataCookie) {
      try {
        currentApiID = JSON.parse(currentApiDataCookie).id;
        if (currentApiID) {
          return true;
        }
      } catch {}
    }
  }

  static async setupAPIHealthCheck() {
    const { checks } = await getCore()
      .healthCheck.status$.pipe(first())
      .toPromise();
    const check = checks.find(
      ({ name, status }) =>
        name === 'server-api:connection-compatibility' && status === 'finished',
    );
    if (check) {
      const availableApiID = check?.data?.find(
        ({ connection, compatibility }) => connection && compatibility,
      )?.id;

      if (availableApiID) {
        // WARNING: the checkStored API can return information about another API host that is available
        const response = await ApiCheck.checkStored(availableApiID);
        if (response?.data?.data?.cluster_info) {
          // WORKAROUND: this sets the API according to the return taking into account the warning
          const apiID = response?.data?.idChanged || availableApiID;
          AppState.setClusterInfo(response?.data?.data?.cluster_info);
          AppState.setCurrentAPI(
            JSON.stringify({
              name: response?.data?.data?.cluster_info?.manager,
              id: apiID,
            }),
          );
          return true;
        }
      }
    }
  }

  static async setupAPITryHosts() {
    try {
      const hosts = await getCore().http.get('/hosts/apis');

      for (var i = 0; i < hosts.length; i++) {
        try {
          // WARNING: the checkStored API can return information about another API host that is available
          const response = await ApiCheck.checkStored(hosts[i].id);
          if (response?.data?.data?.cluster_info) {
            // WORKAROUND: this sets the API according to the return taking into account the warning
            const apiID = response?.data?.idChanged || hosts[i].id;
            AppState.setClusterInfo(response?.data?.data?.cluster_info);
            AppState.setCurrentAPI(
              JSON.stringify({
                name: response?.data?.data?.cluster_info?.manager,
                id: apiID,
              }),
            );
            return true;
          }
        } catch {}
      }
    } catch {}
  }

  static async setupAPI() {
    const methods = [
      this.setupAPIInCookie,
      this.setupAPIHealthCheck,
      this.setupAPITryHosts,
    ];

    for (const fn of methods) {
      const isSet = await fn.call(this);

      if (isSet) {
        this.serverAPIAvailable$.next(true);
        return;
      }
    }

    this.serverAPIAvailable$.next(false);
    getToasts.add({
      color: 'danger',
      text: 'No API host available to connect, this requires the connection and compatibility are ok. Ensure at least one of them fullfil these conditions. Run the health check to update the check status and refresh the page.',
      toastLifeTimeMs: 120000,
    });
  }

  /**
   * Permorn a generic request
   * @param {String} method
   * @param {String} path
   * @param {Object} payload
   */
  static async genericReq(
    method,
    path,
    payload: any = null,
    extraOptions: {
      shouldRetry?: boolean;
      checkCurrentApiIsUp?: boolean;
      overwriteHeaders?: any;
    } = {
      shouldRetry: true,
      checkCurrentApiIsUp: true,
      overwriteHeaders: {},
    },
  ) {
    const shouldRetry =
      typeof extraOptions.shouldRetry === 'boolean'
        ? extraOptions.shouldRetry
        : true;
    const checkCurrentApiIsUp =
      typeof extraOptions.checkCurrentApiIsUp === 'boolean'
        ? extraOptions.checkCurrentApiIsUp
        : true;
    const overwriteHeaders =
      typeof extraOptions.overwriteHeaders === 'object'
        ? extraOptions.overwriteHeaders
        : {};
    try {
      if (!method || !path) {
        throw new Error('Missing parameters');
      }
      this.wazuhConfig = new WazuhConfig();
      const configuration = this.wazuhConfig.getConfig();
      const timeout = configuration ? configuration.timeout : 20000;

      const url = getHttp().basePath.prepend(path);
      const options = {
        method: method,
        headers: {
          ...PLUGIN_PLATFORM_REQUEST_HEADERS,
          'content-type': 'application/json',
          ...overwriteHeaders,
        },
        url: url,
        data: payload,
        timeout: timeout,
      };

      const data = await request(options);
      this.serverAPIAvailable$.next(true);

      if (data['error']) {
        throw new Error(data['error']);
      }

      return Promise.resolve(data);
    } catch (error) {
      //if the requests fails, we need to check if the API is down
      if (checkCurrentApiIsUp) {
        const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
        if (currentApi && currentApi.id) {
          try {
            await ApiCheck.checkStored(currentApi.id);
          } catch (error) {
            const wzMisc = new WzMisc();
            wzMisc.setApiIsDown(true);
            this.serverAPIAvailable$.next(false);
            const title = `API with ID [${currentApi.id}] is not available.`;
            const text = `This could indicate a problem in the network of the server API, review or change the API host in the API host selector if configurated other hosts. Cause: ${error.message}`;

            displayAPINotAvailableToast({ title, text });

            throw new Error(`${title} ${text}`);
          }
        }
      }
      const errorMessage =
        (error &&
          error.response &&
          error.response.data &&
          error.response.data.message) ||
        (error || {}).message;
      if (
        typeof errorMessage === 'string' &&
        errorMessage.includes('status code 401') &&
        shouldRetry
      ) {
        try {
          await WzAuthentication.refresh(true);
          return this.genericReq(method, path, payload, { shouldRetry: false });
        } catch (error) {
          return ((error || {}).data || {}).message || false
            ? Promise.reject(
                this.returnErrorInstance(error, error.data.message),
              )
            : Promise.reject(this.returnErrorInstance(error, error.message));
        }
      }
      return errorMessage
        ? Promise.reject(this.returnErrorInstance(error, errorMessage))
        : Promise.reject(
            this.returnErrorInstance(error, 'Server did not respond'),
          );
    }
  }

  /**
   * Perform a request to the Wazuh API
   * @param {String} method Eg. GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} body Request body
   */
  static async apiReq(
    method,
    path,
    body,
    options: {
      checkCurrentApiIsUp?: boolean;
      returnOriginalResponse?: boolean;
    } = { checkCurrentApiIsUp: true, returnOriginalResponse: false },
  ): Promise<IApiResponse<any>> {
    try {
      if (!method || !path || !body) {
        throw new Error('Missing parameters');
      }

      const getGenericReqOptions = (options: {
        checkCurrentApiIsUp?: boolean;
        returnOriginalResponse?: boolean;
      }) => {
        const { returnOriginalResponse, ...restOptions } = options;
        return restOptions;
      };

      const returnOriginalResponse = options?.returnOriginalResponse;
      const optionsToGenericReq = returnOriginalResponse
        ? getGenericReqOptions(options)
        : options;

      const id = JSON.parse(AppState.getCurrentAPI() as string).id;

      if (!id) {
        return Promise.reject(
          new Error(
            'There is no selected server API. Ensure the server API is selected and this is online.',
          ),
        );
      }
      const requestData = { method, path, body, id };
      const response = await this.genericReq(
        'POST',
        '/api/request',
        requestData,
        optionsToGenericReq,
      );

      if (returnOriginalResponse) {
        return response;
      }

      const hasFailed =
        (((response || {}).data || {}).data || {}).total_failed_items || 0;

      if (hasFailed) {
        const error =
          ((((response.data || {}).data || {}).failed_items || [])[0] || {})
            .error || {};
        const failed_ids =
          ((((response.data || {}).data || {}).failed_items || [])[0] || {})
            .id || {};
        const message = (response.data || {}).message || 'Unexpected error';
        const errorMessage = `${message} (${error.code}) - ${error.message} ${
          failed_ids && failed_ids.length > 1
            ? ` Affected ids: ${failed_ids} `
            : ''
        }`;
        return Promise.reject(this.returnErrorInstance(null, errorMessage));
      }
      return Promise.resolve(response);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? Promise.reject(this.returnErrorInstance(error, error.data.message))
        : Promise.reject(this.returnErrorInstance(error, error.message));
    }
  }

  /**
   * Perform a request to generate a CSV
   * @param {String} path
   * @param {Object} filters
   */
  static async csvReq(path, filters) {
    try {
      if (!path || !filters) {
        throw new Error('Missing parameters');
      }
      const id = JSON.parse(AppState.getCurrentAPI()).id;
      const requestData = { path, id, filters };
      const data = await this.genericReq('POST', '/api/csv', requestData);
      return Promise.resolve(data);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? Promise.reject(this.returnErrorInstance(error, error.data.message))
        : Promise.reject(this.returnErrorInstance(error, error.message));
    }
  }

  /**
   * Customize message and return an error object
   * @param error
   * @param message
   * @returns error
   */
  static returnErrorInstance(error: any, message: string | undefined) {
    if (!error || typeof error === 'string') {
      return new Error(message || error);
    }
    error.message = message;
    return error;
  }
}
