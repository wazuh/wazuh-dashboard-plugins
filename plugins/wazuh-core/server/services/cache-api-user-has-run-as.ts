/*
 * Wazuh app - Service which caches the API user allow run as
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
import { ManageHosts } from './manage-hosts';
import { API_USER_STATUS_RUN_AS } from '../../common/api-user-status-run-as';

// Object.freeze(API_USER_STATUS_RUN_AS);
/**
 * This service caches the status of API host internal user allows the run as option.
 */
export class CacheAPIUserAllowRunAs {
  readonly API_USER_STATUS_RUN_AS;
  private _cache: any;
  constructor(private logger: Logger, private manageHosts: ManageHosts) {
    // Private variable to save the cache
    this._cache = {};
    this.API_USER_STATUS_RUN_AS = API_USER_STATUS_RUN_AS;
  }
  // Set an entry with API ID, username and allow_run_as
  set(apiID: string, username: string, allow_run_as: number): void {
    if (!this._cache[apiID]) {
      this._cache[apiID] = {}; // Create a API ID entry if it doesn't exist in cache object
    }
    this._cache[apiID][username] = allow_run_as;
  }
  // Get the value of an entry with API ID and username from cache
  get(apiID: string, username: string): number {
    return this._cache[apiID] &&
      typeof this._cache[apiID][username] !== 'undefined'
      ? this._cache[apiID][username]
      : API_USER_STATUS_RUN_AS.ALL_DISABLED;
  }
  // Check if it exists the API ID and username in the cache
  has(apiID: string, username: string): boolean {
    return this._cache[apiID] &&
      typeof this._cache[apiID][username] !== 'undefined'
      ? true
      : false;
  }
  async check(apiId: string): Promise<number> {
    try {
      const api = await this.manageHosts.get(apiId, { excludePassword: true });
      this.logger.debug(
        `Check if API user ${api.username} (${apiId}) has run_as`,
      );
      // Check if api.run_as is false or undefined, then it set to false in cache
      if (!api.run_as) {
        this.set(apiId, api.username, API_USER_STATUS_RUN_AS.HOST_DISABLED);
      }
      // Check if the API user is cached and returns it
      if (this.has(apiId, api.username)) {
        return this.get(apiId, api.username);
      }
      const response =
        await this.manageHosts.serverAPIClient.asInternalUser.request(
          'GET',
          '/security/users/me',
          {},
          { apiHostID: apiId },
        );
      const statusUserAllowRunAs = response.data.data.affected_items[0]
        .allow_run_as
        ? API_USER_STATUS_RUN_AS.ENABLED
        : API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED;

      // Cache the run_as for the API user
      this.set(apiId, api.username, statusUserAllowRunAs);
      return statusUserAllowRunAs;
    } catch (error) {
      this.logger.error(error.message || error);
      return API_USER_STATUS_RUN_AS.ALL_DISABLED;
    }
  }
  async canUse(apiId: string): Promise<number | never> {
    const ApiUserCanUseStatus = await this.check(apiId);
    if (ApiUserCanUseStatus === API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED) {
      const api = await this.manageHosts.get(apiId, {
        excludePassword: true,
      });
      throw new Error(
        `API with host ID [${apiId}] misconfigured. The Wazuh API user [${api.username}] is not allowed to use [run_as]. Allow it in the user configuration or set [run_as] host setting with [false] value.`,
      );
    }
    return ApiUserCanUseStatus;
  }
}
