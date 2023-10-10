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
import * as ApiInterceptor from './api-interceptor';
import { ManageHosts } from './manage-hosts';
import { log } from './logger';
// Private variable to save the cache
const _cache = {};

// Export an interface which interacts with the private cache object
export const CacheInMemoryAPIUserAllowRunAs = {
  // Set an entry with API ID, username and allow_run_as
  set: (apiID: string, username: string, allow_run_as : number): void => {
    if(!_cache[apiID]){
      _cache[apiID] = {}; // Create a API ID entry if it doesn't exist in cache object
    };
    _cache[apiID][username] = allow_run_as;
  },
  // Get the value of an entry with API ID and username from cache
  get: (apiID: string, username: string): number =>  _cache[apiID] && typeof _cache[apiID][username] !== 'undefined' ? _cache[apiID][username] : API_USER_STATUS_RUN_AS.ALL_DISABLED,
  // Check if it exists the API ID and username in the cache
  has: (apiID: string, username: string): boolean => _cache[apiID] && typeof _cache[apiID][username] !== 'undefined' ? true : false
};

const manageHosts = new ManageHosts();

export const APIUserAllowRunAs = {
  async check(apiId: string): Promise<number>{
    try{
      const api = await manageHosts.getHostById(apiId);
      log('APIUserAllowRunAs:check', `Check if API user ${api.username} (${apiId}) has run_as`, 'debug');
      // Check if api.run_as is false or undefined, then it set to false in cache
      if(!api.run_as){
        CacheInMemoryAPIUserAllowRunAs.set(apiId, api.username, API_USER_STATUS_RUN_AS.HOST_DISABLED);
      };
      // Check if the API user is cached and returns it
      if(CacheInMemoryAPIUserAllowRunAs.has(apiId, api.username)){
        return CacheInMemoryAPIUserAllowRunAs.get(apiId, api.username);
      };
      const response = await ApiInterceptor.requestAsInternalUser(
        'get',
        '/security/users/me',
        {},
        { apiHostID: apiId }
      );
      const statusUserAllowRunAs = response.data.data.affected_items[0].allow_run_as ? API_USER_STATUS_RUN_AS.ENABLED : API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED;

      // Cache the run_as for the API user
      CacheInMemoryAPIUserAllowRunAs.set(apiId, api.username, statusUserAllowRunAs);
      return statusUserAllowRunAs;
    }catch(error){
      log('APIUserAllowRunAs:check', error.message || error);
      return API_USER_STATUS_RUN_AS.ALL_DISABLED;
    }
  },
  async canUse(apiId: string): Promise<number | never>{
    const ApiUserCanUseStatus = await APIUserAllowRunAs.check(apiId);
    if(ApiUserCanUseStatus === API_USER_STATUS_RUN_AS.USER_NOT_ALLOWED){
      const api = await manageHosts.getHostById(apiId);
      throw new Error(`API with host ID [${apiId}] misconfigured. The Wazuh API user [${api.username}] is not allowed to use [run_as]. Allow it in the user configuration or set [run_as] host setting with [false] value.`);
    }
    return ApiUserCanUseStatus;
  }
};

/**
 * @example
 *   HOST = set in wazuh.yml config
 *   USER = set in user interface
 *
 * ALL_DISABLED
 *   binary 00 = decimal 0 ---> USER 0 y HOST 0
 * 
 * USER_NOT_ALLOWED
 *   binary 01 = decimal 1 ---> USER 0 y HOST 1
 * 
 * HOST_DISABLED
 *   binary 10 = decimal 2 ---> USER 1 y HOST 0
 * 
 * ENABLED
 *   binary 11 = decimal 3 ---> USER 1 y HOST 1
 */
export enum API_USER_STATUS_RUN_AS{
  ALL_DISABLED = 0, // Wazuh HOST and USER API user configured with run_as=false or undefined
  USER_NOT_ALLOWED = 1, // Wazuh HOST API user configured with run_as = TRUE in wazuh.yml but it has not run_as in Wazuh API
  HOST_DISABLED = 2, // Wazuh HOST API user configured with run_as=false in wazuh.yml but it has not run_as in Wazuh API
  ENABLED = 3 // Wazuh API user configured with run_as=true and allow run_as
}
