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
    const cacheKey = apiHost.id || `${apiHost.url}:${apiHost.port}`;
    const cached = this._httpsAgentCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const agentOptions: https.AgentOptions = {
      // Default to false unless verify_ca is enabled with a valid CA.
      rejectUnauthorized: false,
    };

    let keyPath = '';
    let certPath = '';
    let caPath = '';

    try {
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
        `Certificate configuration for host [${apiHost.id}]: key="${keyValue}", cert="${certValue}", ca="${caValue}"`,
      );

      const hasKey = keyValue !== '';
      const hasCert = certValue !== '';
      const hasCa = caValue !== '';

      if (hasKey !== hasCert) {
        const missing = hasKey ? 'cert' : 'key';
        const present = hasKey ? 'key' : 'cert';
        throw new Error(
          `Incomplete SSL client certificate configuration for host [${apiHost.id}]. ` +
            `The "${present}" is configured but "${missing}" is missing. ` +
            `Both "key" and "cert" must be provided together.`,
        );
      }

      caPath = hasCa ? this._resolveConfigPath(caValue) : '';

      if (hasKey && hasCert) {
        keyPath = this._resolveConfigPath(keyValue);
        certPath = this._resolveConfigPath(certValue);
        this.logger.debug(
          `Checking certificate files for host [${apiHost.id}]. key: ${keyPath}, cert: ${certPath}`,
        );

        // Check if files exist before reading
        const keyExists = fs.existsSync(keyPath);
        const certExists = fs.existsSync(certPath);

        if (keyExists && certExists) {
          agentOptions.key = fs.readFileSync(keyPath);
          agentOptions.cert = fs.readFileSync(certPath);
          this.logger.debug(
            `Certificate files loaded successfully for host [${apiHost.id}]`,
          );
        } else {
          const message = [
            { exist: keyExists, path: keyPath, label: 'Key' },
            { exist: certExists, path: certPath, label: 'Cert' },
          ]
            .map(
              ({ exist, path, label }) =>
                `${label} [${path}]${exist ? '' : ' not'} found`,
            )
            .join(', ');
          throw new Error(
            `Certificate files not found for host [${apiHost.id}]. ${message}`,
          );
        }
      }

      if (hasCa) {
        this.logger.debug(
          `Checking CA certificate file for host [${apiHost.id}]. ca: ${caPath}`,
        );

        if (fs.existsSync(caPath)) {
          agentOptions.ca = fs.readFileSync(caPath);
          agentOptions.rejectUnauthorized = true;
          this.logger.debug(
            `CA certificate loaded successfully for host [${apiHost.id}]`,
          );
        } else {
          throw new Error(
            `CA certificate file not found for host [${apiHost.id}]. ca: ${caPath}`,
          );
        }
      }
    } catch (error: any) {
      const message = `Error reading certificate files for host [${
        apiHost.id
      }]: ${error?.message || String(error)}`;
      this.logger.error(message);
      // Fall back to default agent on error
      throw new Error(message);
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

  private _enhanceConnectionError(
    error: any,
    apiHostID: string,
    api: IAPIHost,
  ): Error {
    if (error.response) {
      return error;
    }

    const host = `${api.url}:${api.port}`;
    const originalMessage = error.message || String(error);
    const code = error.code || this._inferErrorCode(originalMessage);
    const hasCerts = !!(api.key || api.cert || api.ca);

    this.logger.debug(
      `Connection error for host [${apiHostID}]: code=${code}, message=${originalMessage}`,
    );

    const enhancedMessage = this._getConnectionErrorMessage(
      code,
      originalMessage,
      host,
      hasCerts,
    );

    const enhanced = new Error(enhancedMessage);
    (enhanced as any).code = code;
    (enhanced as any).response = error.response;
    return enhanced;
  }

  private _inferErrorCode(message: string): string {
    const patterns: [RegExp, string][] = [
      [/socket hang up/i, 'ECONNRESET'],
      [/ECONNREFUSED/i, 'ECONNREFUSED'],
      [/ENOTFOUND/i, 'ENOTFOUND'],
      [/certificate.*(expire|not yet valid)/i, 'CERT_HAS_EXPIRED'],
      [/self.signed/i, 'DEPTH_ZERO_SELF_SIGNED_CERT'],
      [/altname/i, 'ERR_TLS_CERT_ALTNAME_INVALID'],
    ];
    for (const [pattern, code] of patterns) {
      if (pattern.test(message)) {
        return code;
      }
    }
    return '';
  }

  private _getConnectionErrorMessage(
    code: string,
    originalMessage: string,
    host: string,
    hasCerts: boolean,
  ): string {
    switch (code) {
      case 'ECONNRESET':
      case 'ERR_SOCKET_CLOSED':
      case 'EPIPE':
        return hasCerts
          ? `Connection to [${host}] was rejected by the server. ` +
              `Verify the SSL client certificates are valid and signed by the CA trusted by the server.`
          : `Connection to [${host}] was rejected by the server. ` +
              `If the server requires SSL client certificates, configure "key", "cert", and "ca" for this host.`;
      case 'ECONNREFUSED':
        return `Could not connect to [${host}]. Verify the server is running and the URL/port are correct.`;
      case 'ENOTFOUND':
        return `Could not resolve hostname [${host}]. Verify the URL is correct.`;
      case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
        return `SSL certificate verification failed for [${host}]. The server certificate may not be signed by the configured CA.`;
      case 'CERT_HAS_EXPIRED':
        return `The SSL certificate for [${host}] has expired.`;
      case 'ERR_TLS_CERT_ALTNAME_INVALID':
        return `The hostname does not match the certificate's Subject Alternative Names for [${host}].`;
      case 'DEPTH_ZERO_SELF_SIGNED_CERT':
        return `The server at [${host}] uses a self-signed certificate. Configure the CA certificate to verify the connection.`;
      default:
        return `Error connecting to [${host}]: ${originalMessage}`;
    }
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
    try {
      return await this._axios(optionsRequest);
    } catch (error: any) {
      const api = (await this.manageHosts.get(options.apiHostID)) as IAPIHost;
      throw this._enhanceConnectionError(error, options.apiHostID, api);
    }
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

    try {
      const response: AxiosResponse = await this._axios(optionsRequest);
      const token: string = (((response || {}).data || {}).data || {}).token;
      return token;
    } catch (error: any) {
      throw this._enhanceConnectionError(error, apiHostID, api);
    }
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
