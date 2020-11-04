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