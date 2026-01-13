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

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from 'opensearch-dashboards/server';
import { getCookieValueByName } from './cookie';
import { ManageHosts, IAPIHost } from './manage-hosts';
import { ISecurityFactory } from './security-factory';

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
  private _CacheInternalUserAPIHostToken: Map<string, string>;
  private asInternalUser: ServerAPIInternalUserClient;
  private _axios: AxiosInstance;
  private defaultHttpsAgent: https.Agent;
  private configDir: string;
  constructor(
    private logger: Logger, // TODO: add logger as needed
    private manageHosts: ManageHosts,
    private dashboardSecurity: ISecurityFactory,
    configDir?: string,
  ) {
    this.configDir = configDir || '';
    // Default HTTPS agent without certificate verification
    this.defaultHttpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });
    this._axios = axios.create({ httpsAgent: this.defaultHttpsAgent });
    // Cache to save the token for the internal user by API host ID
    this._CacheInternalUserAPIHostToken = new Map<string, string>();

    // Create internal user client
    this.asInternalUser = {
      authenticate: async apiHostID =>
        await this._authenticateInternalUser(apiHostID),
      request: async (
        method: RequestHTTPMethod,
        path: RequestPath,
        data: any,
        options,
      ) => await this._requestAsInternalUser(method, path, data, options),
    };
  }

  /**
   * Create an HTTPS agent based on the host configuration
   * @param apiHost Host configuration with certificate paths
   * @returns HTTPS agent configured with certificates if available
   */
  private _createHttpsAgent(apiHost: any): https.Agent {
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: false, // Default to false for backward compatibility
    };

    let certificatesConfigured = false;
    let caConfigured = false;

    // Read certificate files if configured
    try {
      if (apiHost.key && apiHost.cert) {
        // Resolve paths: if absolute, use directly; if relative, resolve from config directory
        const keyPath = path.isAbsolute(apiHost.key)
          ? apiHost.key
          : this.configDir
          ? path.resolve(this.configDir, apiHost.key)
          : apiHost.key;
        const certPath = path.isAbsolute(apiHost.cert)
          ? apiHost.cert
          : this.configDir
          ? path.resolve(this.configDir, apiHost.cert)
          : apiHost.cert;

        // Check if files exist before reading
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          agentOptions.key = fs.readFileSync(keyPath);
          agentOptions.cert = fs.readFileSync(certPath);
          certificatesConfigured = true;
        } else {
          this.logger.warn(
            `Certificate files not found for host ${apiHost.id}. Key: ${keyPath}, Cert: ${certPath}`,
          );
        }
      }

      // Read CA certificate if use_ca is enabled
      if (apiHost.use_ca === true && apiHost.ca) {
        // Resolve path: if absolute, use directly; if relative, resolve from config directory
        const caPath = path.isAbsolute(apiHost.ca)
          ? apiHost.ca
          : this.configDir
          ? path.resolve(this.configDir, apiHost.ca)
          : apiHost.ca;

        if (fs.existsSync(caPath)) {
          agentOptions.ca = fs.readFileSync(caPath);
          agentOptions.rejectUnauthorized = true; // Enable certificate verification when CA is provided
          caConfigured = true;
        } else {
          this.logger.warn(
            `CA certificate file not found for host ${apiHost.id}. CA: ${caPath}`,
          );
        }
      }

      // Log SSL configuration status (only when certificates are configured)
      if (certificatesConfigured || caConfigured) {
        this.logger.info(
          `SSL certificates configured for host ${apiHost.id}: ` +
            `client certificates=${
              certificatesConfigured ? 'enabled' : 'not configured'
            }, ` +
            `CA verification=${caConfigured ? 'enabled' : 'disabled'}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Error reading certificate files for host ${apiHost.id}: ${
          error?.message || String(error)
        }. Stack: ${error?.stack || 'N/A'}`,
      );
      // Fall back to default agent on error
      return this.defaultHttpsAgent;
    }

    return new https.Agent(agentOptions);
  }

  /**
   * Internal method to execute the request
   * @param method HTTP verb
   * @param path Server API endpoint
   * @param data Request data
   * @param options Options. Data about the Server API ID and the token
   * @returns
   */
  private async _request(
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    options:
      | APIInterceptorRequestOptionsInternalUser
      | APIInterceptorRequestOptionsScopedUser,
  ): Promise<AxiosResponse> {
    const optionsRequest = await this._buildRequestOptions(
      method,
      path,
      data,
      options,
    );
    return await this._axios(optionsRequest);
  }

  /**
   * Build the options for the request
   * @param method HTTP verb
   * @param path Server API endpoint
   * @param data Request data
   * @param options Options. Data about the Server API ID and the token
   * @returns
   */
  private async _buildRequestOptions(
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    options:
      | APIInterceptorRequestOptions
      | APIInterceptorRequestOptionsInternalUser
      | APIInterceptorRequestOptionsScopedUser,
  ) {
    const apiHostID = options.apiHostID;
    const token = 'token' in options ? options.token : undefined;
    const api = (await this.manageHosts.get(apiHostID)) as IAPIHost;
    const { body, params, headers, ...rest } = data;

    // Create HTTPS agent with certificates if configured
    const httpsAgent = this._createHttpsAgent(api);

    const requestUrl = `${api.url}:${api.port}${path}`;

    return {
      method: method,
      headers: {
        'content-type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(headers ? headers : {}),
      },
      data: body || rest || {},
      params: params || {},
      url: requestUrl,
      httpsAgent: httpsAgent,
    };
  }

  /**
   * Get the authentication token
   * @param apiHostID Server API ID
   * @param authContext Authentication context to get the token
   * @returns
   */
  private async _authenticate(
    apiHostID: string,
    options: ServerAPIAuthenticateOptions,
  ): Promise<string> {
    const api = (await this.manageHosts.get(apiHostID)) as IAPIHost;

    // Create HTTPS agent with certificates if configured
    const httpsAgent = this._createHttpsAgent(api);

    const authUrl = `${api.url}:${api.port}/security/user/authenticate${
      options.useRunAs ? '/run_as' : ''
    }`;

    const optionsRequest = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      auth: {
        username: api.username,
        password: api.password,
      },
      url: authUrl,
      ...(!!options?.authContext ? { data: options?.authContext } : {}),
      httpsAgent: httpsAgent,
    };

    const response: AxiosResponse = await this._axios(optionsRequest);
    const token: string = (((response || {}).data || {}).data || {}).token;
    return token;
  }

  /**
   * Get the authentication token for the internal user and cache it
   * @param apiHostID Server API ID
   * @returns
   */
  private async _authenticateInternalUser(apiHostID: string): Promise<string> {
    const token = await this._authenticate(apiHostID, { useRunAs: false });
    this._CacheInternalUserAPIHostToken.set(apiHostID, token);
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

        const token = useRunAs
          ? await this._authenticate(apiHostID, {
              useRunAs: true,
              authContext: (
                await this.dashboardSecurity.getCurrentUser(request, context)
              ).authContext,
            })
          : await this._authenticate(apiHostID, {
              useRunAs: false,
            });
        return token;
      },
      request: async (
        method: RequestHTTPMethod,
        path: string,
        data: any,
        options: APIInterceptorRequestOptionsScopedUser,
      ) => {
        return await this._request(method, path, data, {
          ...options,
          token: getCookieValueByName(request.headers.cookie, 'wz-token'),
        });
      },
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
  private async _requestAsInternalUser(
    method: RequestHTTPMethod,
    path: RequestPath,
    data: any,
    options: APIInterceptorRequestOptionsInternalUser,
  ) {
    try {
      const token =
        this._CacheInternalUserAPIHostToken.has(options.apiHostID) &&
        !options.forceRefresh
          ? this._CacheInternalUserAPIHostToken.get(options.apiHostID)
          : await this._authenticateInternalUser(options.apiHostID);
      return await this._request(method, path, data, { ...options, token });
    } catch (error: any) {
      if (error?.response && error.response.status === 401) {
        const token: string = await this._authenticateInternalUser(
          options.apiHostID,
        );
        return await this._request(method, path, data, { ...options, token });
      }
      throw error;
    }
  }
}
