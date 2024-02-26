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
import { CacheAPIUserAllowRunAs } from './cache-api-user-has-run-as';
import { ServerAPIClient } from './server-api-client';

interface IAPIHost {
  id: string;
  username: string;
  password: string;
  port: number;
  run_as: boolean;
}

/**
 * This service manages the API connections.
 * Get API hosts configuration
 * Get API host entries (combine configuration and registry file)
 * Set API host
 * Delete API host
 * Cache the allow_run_as value for API ID and username
 * Ability to get if the configured user is allowed to use run as
 */
export class ManageHosts {
  public cacheAPIUserAllowRunAs: CacheAPIUserAllowRunAs;
  public serverAPIClient: ServerAPIClient | null = null;
  constructor(
    private logger: Logger,
    private configuration: IConfiguration,
    private updateRegistry,
  ) {
    this.cacheAPIUserAllowRunAs = new CacheAPIUserAllowRunAs(this.logger, this);
  }

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

  async set(hostID: string, data: IAPIHost) {
    try {
      const hosts = await this.get();
      this.logger.debug(`API connections data: ${JSON.stringify(hosts)}`);

      let updatedHosts = [...hosts];

      const hostExistIndex = updatedHosts.findIndex(({ id }) => id === hostID);
      if (hostExistIndex !== -1) {
        this.logger.debug(`API connection with ID [${hostID}] found`);
        this.logger.debug(`Replacing API connection ID [${hostID}]`);
        // Exist
        // Update the API connection info
        updatedHosts = updatedHosts.map((item, index) =>
          index === hostExistIndex ? { ...item, ...data } : item,
        );
      } else {
        this.logger.debug(`API connection with ID [${hostID}] not found`);
        // Not exist
        // Add new host
        this.logger.debug(`Adding new API connection with ID [${data.id}]`);
        updatedHosts.push(data);
      }
      this.logger.debug(
        `API connections to save ${JSON.stringify(updatedHosts)}`,
      );
      await this.configuration.set({
        hosts: updatedHosts,
      });
      this.logger.info(`API connection with ID [${hostID}] was updated`);
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
      this.logger.debug(`API connections data: ${JSON.stringify(hosts)}`);

      const newHosts = [...hosts];

      const hostExistIndex = newHosts.findIndex(({ id }) => id === hostID);
      if (hostExistIndex === -1) {
        this.logger.debug(`API connection with ID [${hostID}] not found`);
        throw new Error(`API connection with ID [${hostID}] was not found`);
      }
      this.logger.debug(`API connection with ID [${hostID}] found`);
      // Exist
      // Remove host
      this.logger.debug(`Removing API connection with ID [${hostID}]`);
      newHosts.splice(hostExistIndex, 1);

      this.logger.debug('Updating API connections');
      await this.configuration.set({
        hosts: newHosts,
      });
      this.logger.debug('Updated API connections');
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
      const hosts = await this.get(undefined, options);
      const registry = await this.updateRegistry.getHosts();
      const result = await this.joinHostRegistry(hosts, registry);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Joins the hosts with the related information in the registry
   * @param {Object} hosts
   * @param {Object} registry
   * @param {Boolean} removePassword
   */
  private async joinHostRegistry(hosts: any, registry: any) {
    try {
      if (!Array.isArray(hosts)) {
        throw new Error('API connections is not a list');
      }

      return await Promise.all(
        hosts.map(async h => {
          const { id } = h;
          const host = { ...h, ...registry[id] };
          // Add to run_as from API user. Use the cached value or get it doing a request
          host.allow_run_as = await this.cacheAPIUserAllowRunAs.check(id);
          return host;
        }),
      );
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
