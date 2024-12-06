/*
 * Wazuh app - API request service
 * Copyright (C) 2015-2024 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import jwtDecode from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';
import { Logger } from '../../../common/services/configuration';
import {
  HTTPClientServer,
  HTTPVerb,
  HTTPClientServerUserData,
  WzRequestServices,
  ServerAPIResponseItemsDataHTTPClient,
} from './types';
import { pluginPlatformRequestHeaders } from './constants';

interface RequestInternalOptions {
  shouldRetry?: boolean;
  checkCurrentApiIsUp?: boolean;
  overwriteHeaders?: any;
}

type RequestOptions = RequestInternalOptions & {
  returnOriginalResponse?: boolean;
};

export class WzRequest implements HTTPClientServer {
  onErrorInterceptor?: (
    error: any,
    options: {
      checkCurrentApiIsUp: boolean;
      shouldRetry: boolean;
      overwriteHeaders?: any;
    },
  ) => Promise<void>;
  private userData: HTTPClientServerUserData;
  userData$: BehaviorSubject<HTTPClientServerUserData>;

  constructor(
    private readonly logger: Logger,
    private readonly services: WzRequestServices,
  ) {
    this.userData = {
      logged: false,
      token: null,
      account: null,
      policies: null,
    };
    this.userData$ = new BehaviorSubject(this.userData);
  }

  /**
   * Perform a generic request
   * @param {String} method
   * @param {String} path
   * @param {Object} payload
   */
  private async requestInternal(
    method: HTTPVerb,
    path: string,
    payload: any = null,
    options: RequestInternalOptions,
  ): Promise<any> {
    const { shouldRetry, checkCurrentApiIsUp, overwriteHeaders } = {
      shouldRetry: true,
      checkCurrentApiIsUp: true,
      overwriteHeaders: {},
      ...options,
    };

    try {
      if (!method || !path) {
        throw new Error('Missing parameters');
      }

      const timeout = await this.services.getTimeout();
      const url = this.services.getURL(path);
      const options = {
        method: method,
        headers: {
          ...pluginPlatformRequestHeaders,
          'content-type': 'application/json',
          ...overwriteHeaders,
        },
        url: url,
        data: payload,
        timeout: timeout,
      };
      const data = await this.services.request(options);

      if (data['error']) {
        throw new Error(data['error']);
      }

      return data;
    } catch (error) {
      // if the requests fails, we need to check if the API is down
      if (checkCurrentApiIsUp) {
        const currentApi = this.services.getServerAPI();

        if (currentApi) {
          // eslint-disable-next-line no-useless-catch
          try {
            await this.checkAPIById(currentApi);
          } catch (error) {
            // TODO :implement
            // const wzMisc = new WzMisc();
            // wzMisc.setApiIsDown(true);
            // if (
            //   !NavigationService.getInstance()
            //     .getPathname()
            //     .startsWith('/settings')
            // ) {
            //   NavigationService.getInstance().navigate('/health-check');
            // }
            throw error;
          }
        }
      }

      // if(this.onErrorInterceptor){
      //   await this.onErrorInterceptor(error, {checkCurrentApiIsUp, shouldRetry, overwriteHeaders})
      // }
      const errorMessage = error?.response?.data?.message || error?.message;

      if (
        typeof errorMessage === 'string' &&
        errorMessage.includes('status code 401') &&
        shouldRetry
      ) {
        try {
          await this.auth(true); // await WzAuthentication.refresh(true);

          return this.requestInternal(method, path, payload, {
            shouldRetry: false,
          });
        } catch (error) {
          throw this.returnErrorInstance(
            error,
            error?.data?.message || error.message,
          );
        }
      }

      throw this.returnErrorInstance(
        error,
        errorMessage || 'Server did not respond',
      );
    }
  }

  /**
   * Perform a request to the Wazuh API
   * @param {String} method Eg. GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} body Request body
   */
  async request(
    method: HTTPVerb,
    path: string,
    body: any,
    options: RequestOptions,
  ): Promise<ServerAPIResponseItemsDataHTTPClient<any>> {
    const {
      checkCurrentApiIsUp,
      returnOriginalResponse,
      ...restRequestInternalOptions
    } = {
      checkCurrentApiIsUp: true,
      returnOriginalResponse: false,
      ...options,
    };

    try {
      if (!method || !path || !body) {
        throw new Error('Missing parameters');
      }

      const id = this.services.getServerAPI();
      const requestData = { method, path, body, id };
      const response = await this.requestInternal(
        'POST',
        '/api/request',
        requestData,
        { ...restRequestInternalOptions, checkCurrentApiIsUp },
      );

      if (returnOriginalResponse) {
        return response;
      }

      const hasFailed = response?.data?.data?.total_failed_items || 0;

      if (hasFailed) {
        const error = response?.data?.data?.failed_items?.[0]?.error || {};
        const failedIds = response?.data?.data?.failed_items?.[0]?.id || {};
        const message = response.data?.message || 'Unexpected error';
        const errorMessage = `${message} (${error.code}) - ${error.message} ${
          failedIds && failedIds.length > 1
            ? ` Affected ids: ${failedIds} `
            : ''
        }`;

        throw this.returnErrorInstance(null, errorMessage);
      }

      return response;
    } catch (error) {
      throw this.returnErrorInstance(
        error,
        error?.data?.message || error.message,
      );
    }
  }

  /**
   * Perform a request to generate a CSV
   * @param {String} path
   * @param {Object} filters
   */
  async csv(path: string, filters: any) {
    try {
      if (!path || !filters) {
        throw new Error('Missing parameters');
      }

      const id = this.services.getServerAPI();
      const requestData = { path, id, filters };
      const data = await this.requestInternal('POST', '/api/csv', requestData);

      return data;
    } catch (error) {
      throw this.returnErrorInstance(
        error,
        error?.data?.message || error?.message,
      );
    }
  }

  /**
   * Customize message and return an error object
   * @param error
   * @param message
   * @returns error
   */
  private returnErrorInstance(error: any, message: string | undefined) {
    if (!error || typeof error === 'string') {
      return new Error(message || error);
    }

    error.message = message;

    return error;
  }

  setOnErrorInterceptor(onErrorInterceptor: (error: any) => Promise<void>) {
    this.onErrorInterceptor = onErrorInterceptor;
  }

  /**
   * Requests and returns an user token to the API.
   *
   * @param {boolean} force
   * @returns {string} token as string or Promise.reject error
   */
  private async login(force = false) {
    try {
      let idHost = this.services.getServerAPI();

      while (!idHost) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 500));
        idHost = this.services.getServerAPI();
      }

      const response = await this.requestInternal('POST', '/api/login', {
        idHost,
        force,
      });
      const token = response?.data?.token;

      return token as string;
    } catch (error) {
      this.logger.error(`Error in the login: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh the user's token
   *
   * @param {boolean} force
   * @returns {void} nothing or Promise.reject error
   */
  async auth(force = false) {
    try {
      // Get user token
      const token: string = await this.login(force);

      if (!token) {
        // Remove old existent token
        // await this.unauth();
        return;
      }

      // Decode token and get expiration time
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const jwtPayload = jwtDecode(token);
      // Get user Policies
      const userPolicies = await this.getUserPolicies();
      // Dispatch actions to set permissions and administrator consideration
      // TODO: implement
      // store.dispatch(updateUserPermissions(userPolicies));
      // store.dispatch(
      //   updateUserAccount(
      //     getWazuhCorePlugin().dashboardSecurity.getAccountFromJWTAPIDecodedToken(
      //       jwtPayload,
      //     ),
      //   ),
      // );
      // store.dispatch(updateWithUserLogged(true));
      const data = {
        token,
        policies: userPolicies,
        account: null, // TODO: implement
        logged: true,
      };

      this.updateUserData(data);

      return data;
    } catch (error) {
      // TODO: implement
      // const options: UIErrorLog = {
      //   context: `${WzAuthentication.name}.refresh`,
      //   level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      //   severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
      //   error: {
      //     error: error,
      //     message: error.message || error,
      //     title: `${error.name}: Error getting the authorization token`,
      //   },
      // };
      // getErrorOrchestrator().handleError(options);
      // store.dispatch(
      //   updateUserAccount(
      //     getWazuhCorePlugin().dashboardSecurity.getAccountFromJWTAPIDecodedToken(
      //       {}, // This value should cause the user is not considered as an administrator
      //     ),
      //   ),
      // );
      // store.dispatch(updateWithUserLogged(true));
      this.updateUserData({
        token: null,
        policies: null,
        account: null, // TODO: implement
        logged: true,
      });
      throw error;
    }
  }

  /**
   * Get current user's policies
   *
   * @returns {Object} user's policies or Promise.reject error
   */
  private async getUserPolicies() {
    try {
      let idHost = this.services.getServerAPI();

      while (!idHost) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 500));
        idHost = this.services.getServerAPI();
      }

      const response = await this.request(
        'GET',
        '/security/users/me/policies',
        { idHost },
      );

      return response?.data?.data || {};
    } catch (error) {
      this.logger.error(`Error getting the user policies: ${error.message}`);
      throw error;
    }
  }

  getUserData() {
    return this.userData;
  }

  /**
   * Sends a request to the Wazuh's API to delete the user's token.
   *
   * @returns {Object}
   */
  async unauth() {
    try {
      const response = await this.request(
        'DELETE',
        '/security/user/authenticate',
        { delay: 5000 },
      );

      return response?.data?.data || {};
    } catch (error) {
      this.logger.error(`Error in the unauthentication: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update the internal user data and emit the value to the subscribers of userData$
   * @param data
   */
  private updateUserData(data: HTTPClientServerUserData) {
    this.userData = data;
    this.userData$.next(this.getUserData());
  }

  async checkAPIById(serverHostId: string, idChanged = false) {
    try {
      const timeout = await this.services.getTimeout();
      const payload = { id: serverHostId };

      if (idChanged) {
        payload.idChanged = serverHostId;
      }

      const url = this.services.getURL('/api/check-stored-api');
      const options = {
        method: 'POST',
        headers: {
          ...pluginPlatformRequestHeaders,
          'content-type': 'application/json',
        },
        url: url,
        data: payload,
        timeout: timeout,
      };
      const response = await this.services.request(options);

      if (response.error) {
        throw this.returnErrorInstance(response); // FIXME: this could cause an expected error due to missing message argument or wrong response argument when this should be a string according to the implementation of returnErrorInstance
      }

      return response;
    } catch (error) {
      if (error.response) {
        // TODO: implement
        // const wzMisc = new WzMisc();
        // wzMisc.setApiIsDown(true);
        const response: string = error.response.data?.message || error.message;

        throw this.returnErrorInstance(response);
      } else {
        throw this.returnErrorInstance(
          error,
          error?.message || error || 'Server did not respond',
        );
      }
    }
  }

  /**
   * Check the status of an API entry
   * @param {String} apiObject
   */
  async checkAPI(apiEntry: any, forceRefresh = false) {
    try {
      const timeout = await this.services.getTimeout();
      const url = this.services.getURL('/api/check-api');
      const options = {
        method: 'POST',
        headers: {
          ...pluginPlatformRequestHeaders,
          'content-type': 'application/json',
        },
        url: url,
        data: { ...apiEntry, forceRefresh },
        timeout: timeout,
      };
      const response = await this.services.request(options);

      if (response.error) {
        throw this.returnErrorInstance(response); // FIXME: this could cause an expected error due to missing message argument or wrong response argument when this should be a string according to the implementation of returnErrorInstance
      }

      return response;
    } catch (error) {
      if (error.response) {
        const response = error.response.data?.message || error.message;

        throw this.returnErrorInstance(response);
      } else {
        throw this.returnErrorInstance(
          error,
          error?.message || error || 'Server did not respond',
        );
      }
    }
  }
}
