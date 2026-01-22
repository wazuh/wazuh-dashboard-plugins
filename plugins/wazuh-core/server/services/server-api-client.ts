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
  private _sslConfigLogged: Set<string> = new Set();
  private _httpsAgentCache: Map<string, https.Agent> = new Map();
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
      // Default to false unless verify_ca is enabled with a valid CA.
      rejectUnauthorized: false,
    };

    let certificatesConfigured = false;
    let caConfigured = false;
    const cacheKey = apiHost.id || `${apiHost.url}:${apiHost.port}`;
    let keyPath = '';
    let certPath = '';
    let caPath = '';
    let verifyCa = false;

    // Read certificate files if configured
    try {
      // Clean and validate certificate paths
      const keyValue =
        apiHost.key && typeof apiHost.key === 'string'
          ? apiHost.key.trim()
          : '';
      const certValue =
        apiHost.cert && typeof apiHost.cert === 'string'
          ? apiHost.cert.trim()
          : '';
      const caValue =
        apiHost.ca && typeof apiHost.ca === 'string' ? apiHost.ca.trim() : '';

      this.logger.debug(
        `Certificate configuration for host ${apiHost.id}: key="${keyValue}", cert="${certValue}", ca="${caValue}"`,
      );

      const hasKey = keyValue !== '';
      const hasCert = certValue !== '';
      const hasCa = caValue !== '';
      verifyCa = apiHost.verify_ca === true;
      const isHttps =
        typeof apiHost.url === 'string' &&
        apiHost.url.trim().toLowerCase().startsWith('https://');

      keyPath = hasKey ? this._resolveConfigPath(keyValue) : '';
      certPath = hasCert ? this._resolveConfigPath(certValue) : '';
      caPath = hasCa ? this._resolveConfigPath(caValue) : '';

      const cached = this._httpsAgentCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      if (hasKey && hasCert) {
        this.logger.debug(
          `Checking certificate files for host ${apiHost.id}. Key: ${keyPath}, Cert: ${certPath}`,
        );

        // Check if files exist before reading
        const keyExists = fs.existsSync(keyPath);
        const certExists = fs.existsSync(certPath);

        if (keyExists && certExists) {
          agentOptions.key = fs.readFileSync(keyPath);
          agentOptions.cert = fs.readFileSync(certPath);
          certificatesConfigured = true;
          this.logger.debug(
            `Certificate files loaded successfully for host ${apiHost.id}`,
          );
        } else {
          this.logger.warn(
            `Certificate files not found for host ${apiHost.id}. Key exists: ${keyExists} (${keyPath}), Cert exists: ${certExists} (${certPath})`,
          );
        }
      }

      if (certificatesConfigured && hasCa && verifyCa) {
        this.logger.debug(
          `Checking CA certificate file for host ${apiHost.id}. CA: ${caPath}`,
        );

        if (fs.existsSync(caPath)) {
          agentOptions.ca = fs.readFileSync(caPath);
          agentOptions.rejectUnauthorized = true;
          caConfigured = true;
          this.logger.debug(
            `CA certificate loaded successfully for host ${apiHost.id}`,
          );
        } else {
          this.logger.warn(
            `CA certificate file not found for host ${apiHost.id}. CA: ${caPath}`,
          );
        }
      }

      if (certificatesConfigured || caConfigured) {
        const logKey = `${apiHost.id}-ssl-config`;
        if (!this._sslConfigLogged.has(logKey)) {
          this.logger.info(
            `SSL certificates configured for host ${apiHost.id}: ` +
              `client certificates=${
                certificatesConfigured ? 'enabled' : 'not configured'
              }, ` +
              `CA verification=${caConfigured ? 'enabled' : 'disabled'}`,
          );
          this._sslConfigLogged.add(logKey);
        } else {
          this.logger.debug(
            `SSL certificates configured for host ${apiHost.id}: ` +
              `client certificates=${
                certificatesConfigured ? 'enabled' : 'not configured'
              }, ` +
              `CA verification=${caConfigured ? 'enabled' : 'disabled'}`,
          );
        }
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

    const agent = new https.Agent(agentOptions);
    this._httpsAgentCache.set(cacheKey, agent);
    return agent;
  }

  private _resolveConfigPath(value: string): string {
    if (!value) {
      return '';
    }
    return path.isAbsolute(value)
      ? value
      : this.configDir
      ? path.resolve(this.configDir, value)
      : value;
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
    const apiWithRegistry = {
      ...api,
      verify_ca: this.manageHosts.resolveVerifyCa(api),
    };
    const { body, params, headers, ...rest } = data;

    // Create HTTPS agent with certificates if configured
    const httpsAgent = this._createHttpsAgent(apiWithRegistry);

    const requestUrl = `${api.url}:${api.port}${path}`;

    return {
      method: method,
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
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
    const apiWithRegistry = {
      ...api,
      verify_ca: this.manageHosts.resolveVerifyCa(api),
    };

    // Create HTTPS agent with certificates if configured
    const httpsAgent = this._createHttpsAgent(apiWithRegistry);

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
