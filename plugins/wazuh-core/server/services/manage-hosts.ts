/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { Logger } from 'opensearch-dashboards/server';
import { IConfiguration } from '../../common/services/configuration';
import { API_USER_STATUS_RUN_AS } from '../../common/api-user-status-run-as';
import { HTTP_STATUS_CODES } from '../../common/constants';
import { ServerAPIClient } from './server-api-client';

interface IAPIHost {
  id: string;
  username: string;
  password: string;
  port: number;
  run_as: boolean;
}

interface IAPIHostRegistry {
  manager: string | null;
  node: string | null;
  status: string;
  cluster: string;
  allowRunAs: API_USER_STATUS_RUN_AS;
}

/**
 * This service manages the API connections.
 * Get API hosts configuration
 * Get API host entries (combine configuration and registry data)
 * Create API host
 * Update API host
 * Delete API host
 * Cache the registry data for API hosts
 * Ability to get if the configured user is allowed to use run as
 */
export class ManageHosts {
  public serverAPIClient: ServerAPIClient | null = null;
  private readonly cacheRegistry = new Map<string, IAPIHostRegistry>();

  constructor(
    private readonly logger: Logger,
    private readonly configuration: IConfiguration,
  ) {}

  setServerAPIClient(client: ServerAPIClient) {
    this.serverAPIClient = client;
  }

  /**
   * Exclude fields from an API host data
   * @param host
   * @param exclude
   * @returns
   */
  private filterAPIHostData(host: IAPIHost, exclude: string[]) {
    if (!exclude?.length) {
      return host;
    }

    const filteredHost: Partial<IAPIHost> = {};

    for (const key in host) {
      if (!exclude.includes(key)) {
        filteredHost[key] = host[key];
      }
    }

    return filteredHost;
  }

  /**
   * Get hosts or host by ID from configuration
   */
  async get(
    hostID?: string,
    options?: { excludePassword: boolean },
  ): Promise<IAPIHost[] | IAPIHost> {
    try {
      const { excludePassword = false } = options || {};

      if (hostID) {
        this.logger.debug(`Getting API connection with ID [${hostID}]`);
      } else {
        this.logger.debug('Getting API connections');
      }

      const hosts = await this.configuration.get('hosts');

      this.logger.debug(`API connections: [${JSON.stringify(hosts)}]`);

      if (hostID) {
        const host = hosts[hostID];

        if (host) {
          this.logger.debug(`API connection with ID [${hostID}] found`);

          return this.filterAPIHostData(
            host,
            excludePassword ? ['password'] : undefined,
          );
        }

        const APIConnectionNotFound = `API connection with ID [${hostID}] not found`;

        this.logger.debug(APIConnectionNotFound);
        throw new Error(APIConnectionNotFound);
      }

      return Object.values(hosts).map(host =>
        this.filterAPIHostData(
          host,
          options.excludePassword ? ['password'] : undefined,
        ),
      );
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * This get all hosts entries in the plugins configuration and the related info in the wazuh-registry.json
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * API entries
   */
  async getEntries(options?: { excludePassword: boolean }) {
    try {
      this.logger.debug('Getting the API connections');

      const hosts = (await this.get(undefined, options)) as IAPIHost[];

      this.logger.debug('Getting registry');

      const registry = Object.fromEntries(this.cacheRegistry.entries());

      return hosts.map(host => {
        const { id } = host;

        return { ...host, cluster_info: registry[id] };
      });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  private isServerAPIClientResponseOk(response: { status: number }) {
    return response.status === HTTP_STATUS_CODES.OK;
  }

  /**
   * Get the cluster info and allowRunAs values for the API host and store into the registry cache
   * @param host
   * @returns
   */
  private async getRegistryDataByHost(
    host: IAPIHost,
  ): Promise<IAPIHostRegistry> {
    const apiHostID = host.id;

    this.logger.debug(`Getting registry data from host [${apiHostID}]`);
    // Get cluster info data

    let manager = null,
      node = null,
      status = 'disabled',
      cluster = 'Disabled',
      allowRunAs = API_USER_STATUS_RUN_AS.ALL_DISABLED;

    try {
      const responseAgents = await this.serverAPIClient.asInternalUser.request(
        'GET',
        `/agents`,
        { params: { agents_list: '000' } },
        { apiHostID },
      );

      if (this.isServerAPIClientResponseOk(responseAgents)) {
        manager = responseAgents.data.data.affected_items[0].manager;
      }

      // Get allowRunAs
      if (host.run_as) {
        const responseAllowRunAs =
          await this.serverAPIClient.asInternalUser.request(
            'GET',
            '/security/users/me',
            {},
            { apiHostID },
          );

        if (this.isServerAPIClientResponseOk(responseAllowRunAs)) {
          allowRunAs = responseAllowRunAs.data.data.affected_items[0].allowRunAs
            ? API_USER_STATUS_RUN_AS.ENABLED
            : API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED;
        }
      } else {
        allowRunAs = API_USER_STATUS_RUN_AS.HOST_DISABLED;
      }

      const responseClusterStatus =
        await this.serverAPIClient.asInternalUser.request(
          'GET',
          `/cluster/status`,
          {},
          { apiHostID },
        );

      if (
        this.isServerAPIClientResponseOk(responseClusterStatus) &&
        responseClusterStatus.data?.data?.enabled === 'yes'
      ) {
        status = 'enabled';

        const responseClusterLocal =
          await this.serverAPIClient.asInternalUser.request(
            'GET',
            `/cluster/local/info`,
            {},
            { apiHostID },
          );

        if (this.isServerAPIClientResponseOk(responseClusterLocal)) {
          node = responseClusterLocal.data.data.affected_items[0].node;
          cluster = responseClusterLocal.data.data.affected_items[0].cluster;
        }
      }
    } catch {
      this.logger.debug(
        `Error getting the cluster info and allowRunAs values for the API host [${apiHostID}]`,
      );
    }

    const data = {
      manager,
      node,
      status,
      cluster,
      allowRunAs,
    };

    this.updateRegistryByHost(apiHostID, data);

    return data;
  }

  /**
   * Initialize the service on plugin start.
   * - Get the registry data for the configured API hosts and store into the in memory cache
   * @returns
   */
  async start() {
    try {
      this.logger.debug('Start');

      const hosts = (await this.get(undefined, {
        excludePassword: true,
      })) as IAPIHost[];

      if (hosts.length === 0) {
        this.logger.debug('No hosts found. Skip.');

        return;
      }

      await Promise.all(
        hosts.map(host =>
          (async () => [host.id, await this.getRegistryDataByHost(host)])(),
        ),
      );
      this.logger.debug('API hosts data stored in the registry');
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  private getRegistryByHost(hostID: string) {
    this.logger.debug(`Getting cache for API host [${hostID}]`);

    const result = this.cacheRegistry.get(hostID);

    this.logger.debug(`Get cache for APIhost [${hostID}]`);

    return result;
  }

  private updateRegistryByHost(hostID: string, data: any) {
    this.logger.debug(`Updating cache for APIhost [${hostID}]`);

    const result = this.cacheRegistry.set(hostID, data);

    this.logger.debug(`Updated cache for APIhost [${hostID}]`);

    return result;
  }

  private deleteRegistryByHost(hostID: string) {
    this.logger.debug(`Deleting cache for API host [${hostID}]`);

    const result = this.cacheRegistry.delete(hostID);

    this.logger.debug(`Deleted cache for API host [${hostID}]`);

    return result;
  }

  /**
   * Check if the authentication with run_as is enabled and the API user can use it
   * @param apiId
   * @returns
   */
  isEnabledAuthWithRunAs(apiId: string): boolean {
    this.logger.debug(`Checking if the API host [${apiId}] can use the run_as`);

    const registryHost = this.getRegistryByHost(apiId);

    if (!registryHost) {
      throw new Error(
        `API host with ID [${apiId}] was not found in the registry. This could be caused by a problem getting and storing the registry data or the API host was removed.`,
      );
    }

    if (registryHost.allowRunAs === API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED) {
      throw new Error(
        `API host with host ID [${apiId}] misconfigured. The configurated API user is not allowed to use [run_as]. Allow it in the API user configuration or set [run_as] host setting with [false] value.`,
      );
    }

    return registryHost.allowRunAs === API_USER_STATUS_RUN_AS.ENABLED;
  }
}
