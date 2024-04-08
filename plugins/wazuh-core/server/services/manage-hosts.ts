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
import { ServerAPIClient } from './server-api-client';
import { API_USER_STATUS_RUN_AS } from '../../common/api-user-status-run-as';
import { HTTP_STATUS_CODES } from '../../common/constants';

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
  allow_run_as: API_USER_STATUS_RUN_AS;
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
  private cacheRegistry: Map<string, IAPIHostRegistry> = new Map();
  constructor(private logger: Logger, private configuration: IConfiguration) {}

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
    return exclude?.length
      ? Object.entries(host).reduce(
          (accum, [key, value]) => ({
            ...accum,
            ...(!exclude.includes(key) ? { [key]: value } : {}),
          }),
          {},
        )
      : host;
  }

  /**
   * Get hosts or host by ID from configuration
   */
  async get(
    hostID?: string,
    options: { excludePassword: boolean } = { excludePassword: false },
  ): Promise<IAPIHost[] | IAPIHost> {
    try {
      hostID
        ? this.logger.debug(`Getting API connection with ID [${hostID}]`)
        : this.logger.debug('Getting API connections');
      const hosts = await this.configuration.get('hosts');
      if (hostID) {
        const host = hosts.find(({ id }: { id: string }) => id === hostID);
        if (host) {
          return this.filterAPIHostData(
            host,
            options.excludePassword ? ['password'] : undefined,
          );
        }
        throw new Error(`API connection with ID [${hostID}] not found`);
      }
      return hosts.map(host =>
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

  private checkHostExistence(
    hosts: IAPIHost[],
    hostID: string,
    { shouldExist }: { shouldExist?: boolean },
  ) {
    const hostExistIndex = hosts.findIndex(({ id }) => id === hostID);
    if (shouldExist && hostExistIndex === -1) {
      const message = `API connection with ID [${hostID}] was not found`;
      this.logger.debug(message);
      throw new Error(message);
    } else if (!shouldExist && hostExistIndex !== -1) {
      const message = `API connection with ID [${hostID}] was found`;
      this.logger.debug(message);
      throw new Error(message);
    }
    return hostExistIndex;
  }

  async create(hostID: string, data: IAPIHost) {
    try {
      const hosts = (await this.get()) as IAPIHost[];

      let updatedHosts = [...hosts];

      // Check if the API connection does not exist
      this.checkHostExistence(updatedHosts, hostID, { shouldExist: false });

      this.logger.debug(`Adding new API connection with ID [${data.id}]`);
      updatedHosts.push(data);
      this.logger.debug('Updating API connections');
      await this.configuration.set({
        hosts: updatedHosts,
      });
      const host = (await this.get(hostID, {
        excludePassword: true,
      })) as IAPIHost;
      this.getRegistryDataByHost(host);
      this.logger.info(`API connection with ID [${hostID}] was created`);
      return data;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async update(hostID: string, data: IAPIHost) {
    try {
      const hosts = (await this.get()) as IAPIHost[];

      let updatedHosts = [...hosts];

      // Check if the API connection exists
      const updatedHostID = data?.id || hostID;
      let hostExistIndex = this.checkHostExistence(
        updatedHosts,
        updatedHostID,
        {
          /* when the updatedHostID is the same than the original one, then should exist,
          otherwise not */
          shouldExist: updatedHostID === hostID,
        },
      );

      this.logger.debug(`Replacing API connection ID [${hostID}]`);
      // Update the API connection info
      hostExistIndex =
        hostExistIndex === -1
          ? /* Get the index of the API connection with the original ID if does not find the updated
          one */
            hosts.findIndex(({ id }) => id === hostID)
          : hostExistIndex;
      updatedHosts = updatedHosts.map((item, index) =>
        index === hostExistIndex ? { ...item, ...data } : item,
      );

      this.logger.debug('Updating API connections');
      await this.configuration.set({
        hosts: updatedHosts,
      });
      const host = (await this.get(updatedHostID, {
        excludePassword: true,
      })) as IAPIHost;
      this.getRegistryDataByHost(host);
      this.logger.info(`API connection with ID [${updatedHostID}] was updated`);
      return data;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  /**
   * Delete an API connection entry by ID from configuration
   * @param hostID
   */
  async delete(hostID: string) {
    try {
      const hosts = (await this.get()) as IAPIHost[];

      const updatedHosts = [...hosts];

      // Check if the API connection exists
      const hostExistIndex = this.checkHostExistence(updatedHosts, hostID, {
        shouldExist: true,
      });

      this.logger.debug(`API connection with ID [${hostID}] found`);
      // Exist
      // Remove host
      this.logger.debug(`Removing API connection with ID [${hostID}]`);
      updatedHosts.splice(hostExistIndex, 1);

      this.logger.debug('Updating API connections');
      await this.configuration.set({
        hosts: updatedHosts,
      });
      this.deleteRegistryByHost(hostID);
      this.logger.info(`API connection with ID [${hostID}] was removed`);
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
  async getEntries(
    options: { excludePassword: boolean } = { excludePassword: false },
  ) {
    try {
      this.logger.debug('Getting the API connections');
      const hosts = (await this.get(undefined, options)) as IAPIHost[];
      this.logger.debug('Getting registry');
      const registry = Object.entries(this.cacheRegistry.entries());
      return hosts.map(host => {
        const { id } = host;
        return { ...host, ...registry[id] };
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
   * Get the cluster info and allow_run_as values for the API host and store into the registry cache
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
      allow_run_as = API_USER_STATUS_RUN_AS.ALL_DISABLED;

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

      // Get allow_run_as
      if (!host.run_as) {
        allow_run_as = API_USER_STATUS_RUN_AS.HOST_DISABLED;
      } else {
        const responseAllowRunAs =
          await this.serverAPIClient.asInternalUser.request(
            'GET',
            '/security/users/me',
            {},
            { apiHostID },
          );
        if (this.isServerAPIClientResponseOk(responseAllowRunAs)) {
          allow_run_as = responseAllowRunAs.data.data.affected_items[0]
            .allow_run_as
            ? API_USER_STATUS_RUN_AS.ENABLED
            : API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED;
        }
      }

      const responseClusterStatus =
        await this.serverAPIClient.asInternalUser.request(
          'GET',
          `/cluster/status`,
          {},
          { apiHostID },
        );

      if (this.isServerAPIClientResponseOk(responseClusterStatus)) {
        status = 'enabled';

        const responseClusterLocal =
          await this.serverAPIClient.asInternalUser.request(
            'GET',
            `/cluster/local/info`,
            {},
            { apiHostID },
          );

        if (this.isServerAPIClientResponseOk(responseClusterStatus)) {
          node = responseClusterLocal.data.data.affected_items[0].node;
          cluster = responseClusterLocal.data.data.affected_items[0].cluster;
        }
      }
    } catch (error) {}

    const data = {
      manager,
      node,
      status,
      cluster,
      allow_run_as,
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
      if (!hosts.length) {
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
    if (registryHost.allow_run_as === API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED) {
      throw new Error(
        `API host with host ID [${apiId}] misconfigured. The configurated API user is not allowed to use [run_as]. Allow it in the API user configuration or set [run_as] host setting with [false] value.`,
      );
    }
    return registryHost.allow_run_as === API_USER_STATUS_RUN_AS.ENABLED;
  }
}
