/*
 * Wazuh app - Interceptor API entries
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import https from 'https';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Logger } from 'opensearch-dashboards/server';
import { getCookieValueByName } from './cookie';
import { ManageHosts } from './manage-hosts';
import { ISecurityFactory } from './security-factory';

interface APIHost {
  url: string;
  port: string;
  username: string;
  password: string;
}

type RequestHTTPMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
type RequestPath = string;

export interface APIInterceptorRequestOptions {
  apiHostID: string;
  token: string;
  forceRefresh?: boolean;
}

export interface APIInterceptorRequestOptionsInternalUser {
  apiHostID: string;
  forceRefresh?: boolean;
}

export interface APIInterceptorRequestOptionsScopedUser {
  apiHostID: string;
  forceRefresh?: boolean;
  token: string;
}

export interface ServerAPIInternalUserClient {
  authenticate: (apiHostID: string) => Promise<any>;
  request: (
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    options: APIInterceptorRequestOptionsInternalUser,
  ) => Promise<AxiosResponse<any, any>>;
}

export interface ServerAPIScopedUserClient {
  authenticate: (apiHostID: string) => Promise<any>;
  request: (
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    options: APIInterceptorRequestOptionsScopedUser,
  ) => Promise<AxiosResponse<any, any>>;
}

export interface ServerAPIAuthenticateOptions {
  useRunAs: boolean;
  authContext?: any;
}

/**
 * This service communicates with the Wazuh server APIs
 */
export class ServerAPIClient {
  private readonly cacheInternalUserAPIHostToken: Map<string, string>;
  private readonly client: AxiosInstance;
  private readonly asInternalUser: ServerAPIInternalUserClient;

  constructor(
    private readonly logger: Logger, // TODO: add logger as needed
    private readonly manageHosts: ManageHosts,
    private readonly dashboardSecurity: ISecurityFactory,
  ) {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    this.client = axios.create({ httpsAgent });
    // Cache to save the token for the internal user by API host ID
    this.cacheInternalUserAPIHostToken = new Map<string, string>();

    // Create internal user client
    this.asInternalUser = {
      authenticate: async apiHostID =>
        await this.authenticateInternalUser(apiHostID),
      request: async (
        method: RequestHTTPMethod,
        path: RequestPath,
        data: any,
        options,
      ) => await this.requestAsInternalUser(method, path, data, options),
    };
  }

  /**
   * Internal method to execute the request
   * @param method HTTP verb
   * @param path Server API endpoint
   * @param data Request data
   * @param options Options. Data about the Server API ID and the token
   * @returns
   */
  private async request(
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    options:
      | APIInterceptorRequestOptionsInternalUser
      | APIInterceptorRequestOptionsScopedUser,
  ): Promise<AxiosResponse> {
    const optionsRequest = await this.buildRequestOptions(
      method,
      path,
      data,
      options,
    );

    return await this.client(optionsRequest);
  }

  /**
   * Build the options for the request
   * @param method HTTP verb
   * @param path Server API endpoint
   * @param data Request data
   * @param options Options. Data about the Server API ID and the token
   * @returns
   */
  private async buildRequestOptions(
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    { apiHostID, token }: APIInterceptorRequestOptions,
  ) {
    const api = await this.manageHosts.get(apiHostID);
    const { body, params, headers = {}, ...rest } = data;

    return {
      method: method,
      headers: {
        'content-type': 'application/json',
        Authorization: 'Bearer ' + token,
        ...headers,
      },
      data: body || rest || {},
      params: params || {},
      url: `${api.url}:${api.port}${path}`,
    };
  }

  /**
   * Get the authentication token
   * @param apiHostID Server API ID
   * @param authContext Authentication context to get the token
   * @returns
   */
  private async authenticate(
    apiHostID: string,
    options: ServerAPIAuthenticateOptions,
  ): Promise<string> {
    const api: APIHost = await this.manageHosts.get(apiHostID);
    const optionsRequest = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      auth: {
        username: api.username,
        password: api.password,
      },
      url: `${api.url}:${api.port}/security/user/authenticate${
        options.useRunAs ? '/run_as' : ''
      }`,
      ...(options?.authContext ? { data: options?.authContext } : {}),
    };
    const response: AxiosResponse = await this.client(optionsRequest);
    const token: string = response?.data?.data?.token;

    return token;
  }

  /**
   * Get the authentication token for the internal user and cache it
   * @param apiHostID Server API ID
   * @returns
   */
  private async authenticateInternalUser(apiHostID: string): Promise<string> {
    const token = await this.authenticate(apiHostID, { useRunAs: false });

    this.cacheInternalUserAPIHostToken.set(apiHostID, token);

    return token;
  }

  /**
   * Create a client from the context and request
   * @param context
   * @param request
   * @returns
   */
  asScoped(context: any, request: any): ServerAPIScopedUserClient {
    return {
      authenticate: async (apiHostID: string) => {
        const useRunAs = this.manageHosts.isEnabledAuthWithRunAs(apiHostID);
        let token: string;

        if (useRunAs) {
          const { authContext } = await this.dashboardSecurity.getCurrentUser(
            request,
            context,
          );

          token = await this.authenticate(apiHostID, {
            useRunAs: true,
            authContext,
          });
        } else {
          token = await this.authenticate(apiHostID, {
            useRunAs: false,
          });
        }

        return token;
      },
      request: async (
        method: RequestHTTPMethod,
        path: string,
        data: any,
        options: APIInterceptorRequestOptionsScopedUser,
      ) =>
        await this.request(method, path, data, {
          ...options,
          token: getCookieValueByName(request.headers.cookie, 'wz-token'),
        }),
    };
  }

  /**
   * Request as internal user
   * @param method HTTP verb
   * @param path Server API endpoint
   * @param data Request data
   * @param options Options. Data about the Server API ID and the token
   * @returns
   */
  private async requestAsInternalUser(
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    options: APIInterceptorRequestOptionsInternalUser,
  ) {
    try {
      const token =
        this.cacheInternalUserAPIHostToken.has(options.apiHostID) &&
        !options.forceRefresh
          ? this.cacheInternalUserAPIHostToken.get(options.apiHostID)
          : await this.authenticateInternalUser(options.apiHostID);

      return await this.request(method, path, data, { ...options, token });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        const token: string = await this.authenticateInternalUser(
          options.apiHostID,
        );

        return await this.request(method, path, data, { ...options, token });
      }

      throw error;
    }
  }
}
