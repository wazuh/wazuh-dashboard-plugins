/*
 * Wazuh app - Service which caches the API user allow run as
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ApiInterceptor } from './api-interceptor';
import { ManageHosts } from './manage-hosts';
import { log } from '../logger';
// Private variable to save the cache
const _cache = {};

// Export an interface which interacts with the private cache object
export const CacheInMemoryAPIUserAllowRunAs = {
  // Set an entry with API ID, username and allow_run_as
  set: (apiID: string, username: string, allow_run_as : boolean): void => {
    if(!_cache[apiID]){
      _cache[apiID] = {}; // Create a API ID entry if it doesn't exist in cache object
    };
    _cache[apiID][username] = allow_run_as;
  },
  // Get the value of an entry with API ID and username from cache
  get: (apiID: string, username: string): boolean =>  _cache[apiID] && typeof _cache[apiID][username] !== 'undefined' ? _cache[apiID][username] : false,
  // Check if it exists the API ID and username in the cache
  has: (apiID: string, username: string): boolean => _cache[apiID] && typeof _cache[apiID][username] !== 'undefined' ? true : false
};

const apiInterceptor = new ApiInterceptor();
const manageHosts = new ManageHosts();

export const APIUserAllowRunAs = {
  async check(apiId){
    try{
      const api = await manageHosts.getHostById(apiId);
      log('APIUserAllowRunAs:check', `Check if API user ${api.username} (${apiId}) has run_as`, 'debug');
      // Check if api.run_as is false or undefined, then it set to false in cache
      if(!api.run_as){
        CacheInMemoryAPIUserAllowRunAs.set(apiId, api.username, false);
      };
      // Check if the API user is cached and returns it
      if(CacheInMemoryAPIUserAllowRunAs.has(apiId, api.username)){
        return CacheInMemoryAPIUserAllowRunAs.get(apiId, api.username);
      };
      const response = await apiInterceptor.request(
        'get',
        `${api.url}:${api.port}/security/users/me`,
        {},
        { idHost: apiId }
      );
      const APIUserAllowRunAs = response.data.data.affected_items[0].allow_run_as;
      // Cache the run_as for the API user
      CacheInMemoryAPIUserAllowRunAs.set(apiId, api.username, APIUserAllowRunAs);
      return APIUserAllowRunAs;
    }catch(error){
      log('APIUserAllowRunAs:check', error.message || error);
      return false;
    }
  }
}