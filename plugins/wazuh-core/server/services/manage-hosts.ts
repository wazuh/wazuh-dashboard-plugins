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
import { Logger, PluginInitializerContext } from 'opensearch-dashboards/server';
import { first } from 'rxjs/operators';
import { IConfiguration } from '../../common/services/configuration';
import { ServerAPIClient } from './server-api-client';
import { API_USER_STATUS_RUN_AS } from '../../common/api-user-status-run-as';
import { HTTP_STATUS_CODES } from '../../common/constants';

export interface IAPIHost {
  id: string;
  url: string;
  username: string;
  password: string;
  port: number;
  run_as: boolean;
  key?: string;
  cert?: string;
  ca?: string;
}

interface IAPIHostRegistry {
  manager: string | null;
  node: string | null;
  cluster: string;
  allow_run_as: API_USER_STATUS_RUN_AS;
  verify_ca: boolean | null;
}

interface GetRegistryDataByHostOptions {
  /* this option lets to throw the error when trying to fetch the required data
  of the API host that is used by the checkStoredAPI of /api/check-stored-api
  endpoint */
  throwError: boolean;
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
    private readonly initializerContext?: PluginInitializerContext,
  ) {}

  /**
   * Calculate verify_ca based on certificate paths.
   * If key, cert, and ca are all configured, verify_ca is true.
   * Otherwise, verify_ca is null (not configured) or false (partially configured).
   */
  private calculateVerifyCa(host: IAPIHost): boolean | null {
    // Check if certificate paths are defined
    const hasKey =
      host.key && typeof host.key === 'string' && host.key.trim() !== '';
    const hasCert =
      host.cert && typeof host.cert === 'string' && host.cert.trim() !== '';
    const hasCa =
      host.ca && typeof host.ca === 'string' && host.ca.trim() !== '';

    // If all certificate paths are configured, enable CA verification
    if (hasKey && hasCert && hasCa) {
      return true;
    }

    // If no certificate paths are defined, return null (not configured)
    if (!hasKey && !hasCert && !hasCa) {
      return null;
    }

    // If only some paths are configured, return false (partially configured)
    return false;
  }

  /**
   * Resolve verify_ca for a host.
   * Uses cached registry value when present, otherwise derives from host config.
   */
  public resolveVerifyCa(host: IAPIHost): boolean | null {
    const registryHost = this.cacheRegistry.get(host.id);
    if (registryHost && typeof registryHost.verify_ca !== 'undefined') {
      return registryHost.verify_ca;
    }

    return this.calculateVerifyCa(host);
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
            { ...host, id: hostID },
            excludePassword ? ['password'] : undefined,
          );
        }

        const APIConnectionNotFound = `API connection with ID [${hostID}] not found`;

        this.logger.debug(APIConnectionNotFound);
        throw new Error(APIConnectionNotFound);
      }

      return Object.entries(hosts).map(([id, host]: [string, any]) =>
        this.filterAPIHostData(
          { ...host, id },
          excludePassword ? ['password'] : undefined,
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
      const registry = Object.fromEntries([...this.cacheRegistry.entries()]);

      const hostsNeedingRegistry = hosts.filter(host => !registry[host.id]);
      const enhanceHostWithRegistry = (host: IAPIHost, registryData: any) => {
        const { allow_run_as, verify_ca, ca, cert, key, ...cluster_info } =
          registryData || {};
        return {
          ...host,
          allow_run_as,
          verify_ca,
          cluster_info,
        };
      };
      if (hostsNeedingRegistry.length > 0) {
        this.logger.debug(
          `Found ${hostsNeedingRegistry.length} hosts without registry data, updating cache`,
        );

        await Promise.allSettled(
          hostsNeedingRegistry.map(async (host: IAPIHost) => {
            try {
              await this.getRegistryDataByHost(host, { throwError: false });
              this.logger.debug(`Registry data updated for host [${host.id}]`);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              this.logger.warn(
                `Failed to get registry data for host [${host.id}]: ${errorMessage}`,
              );
            }
          }),
        );

        const updatedRegistry = Object.fromEntries([
          ...this.cacheRegistry.entries(),
        ]);
        return hosts.map(host => {
          const { id } = host;
          return enhanceHostWithRegistry(host, updatedRegistry[id]);
        });
      }

      return hosts.map(host => {
        const { id } = host;
        return enhanceHostWithRegistry(host, registry[id]);
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
    options: GetRegistryDataByHostOptions,
  ): Promise<IAPIHostRegistry> {
    const apiHostID = host.id;

    this.logger.debug(`Getting registry data from host [${apiHostID}]`);
    // Get cluster info data

    let manager = null,
      node = null,
      cluster = null,
      allow_run_as = API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK;

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
      const responseAllowRunAs =
        await this.serverAPIClient.asInternalUser.request(
          'GET',
          '/security/users/me',
          {},
          { apiHostID },
        );
      if (this.isServerAPIClientResponseOk(responseAllowRunAs)) {
        const allow_run_as_response =
          responseAllowRunAs.data.data.affected_items[0].allow_run_as;
        if (host.run_as) {
          allow_run_as = allow_run_as_response
            ? API_USER_STATUS_RUN_AS.ENABLED
            : API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED;
        } else {
          allow_run_as = allow_run_as_response
            ? API_USER_STATUS_RUN_AS.HOST_DISABLED
            : API_USER_STATUS_RUN_AS.ALL_DISABLED;
        }
      } else {
        allow_run_as = API_USER_STATUS_RUN_AS.HOST_DISABLED;
      }

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
    } catch (error) {
      if (options?.throwError) {
        throw error;
      }
    }

    // Calculate verify_ca based on certificate paths
    const verify_ca = this.calculateVerifyCa(host);

    const data = {
      manager,
      node,
      cluster,
      allow_run_as,
      verify_ca,
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

      await Promise.allSettled(
        hosts.map(host =>
          (async () => {
            try {
              return [
                host.id,
                await this.getRegistryDataByHost(host, { throwError: false }),
              ];
            } catch (error) {
              this.logger.warn(
                `Failed to get registry data for host [${
                  host.id
                }] during startup: ${error.message || error}`,
              );
              return [host.id, null];
            }
          })(),
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
    if (registryHost.allow_run_as === API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK) {
      throw new Error(
        `API host with host ID [${apiId}] could not check the ability to use the run as. Ensure the API host is accesible and the internal user has the minimal permissions to check this capability.`,
      );
    }
    if (registryHost.allow_run_as === API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED) {
      throw new Error(
        `API host with host ID [${apiId}] misconfigured. The configurated API user is not allowed to use [run_as]. Allow it in the API user configuration or set [run_as] host setting with [false] value.`,
      );
    }

    /* The allowed values to compare should be:
      API_USER_STATUS_RUN_AS.ENABLED: use run_as
      API_USER_STATUS_RUN_AS.HOST_DISABLED: not use run_as
      API_USER_STATUS_RUN_AS.ALL_DISABLED: not use run_as
    */
    if (
      ![
        API_USER_STATUS_RUN_AS.ENABLED,
        API_USER_STATUS_RUN_AS.HOST_DISABLED,
        API_USER_STATUS_RUN_AS.ALL_DISABLED,
      ].includes(registryHost.allow_run_as)
    ) {
      throw new Error(
        `API host with host ID [${apiId}] has an unexpected value [${registryHost.allow_run_as}] stored in the registry. This could be caused by a problem getting and storing the registry data.`,
      );
    }
    return registryHost.allow_run_as === API_USER_STATUS_RUN_AS.ENABLED;
  }
}
