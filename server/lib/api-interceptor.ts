/*
 * Wazuh app - Interceptor API entries
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import axios from 'axios';
import {
  ManageHosts
} from './manage-hosts';
import {
  UpdateRegistry
} from './update-registry';

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

interface APIHost{
  url: string
  port: string
  username: string
  password: string
}

const manageHosts = new ManageHosts();

// Cache to save the token for the internal user by API host ID
const CacheInternalUserAPIHostToken = new Map<string,string>();

export const authenticate = async (apiHostID: string, authContext?: any) => {
  try{
    const api: APIHost = await manageHosts.getHostById(apiHostID);
    const optionsRequest = {
      method: !!authContext ? 'POST' : 'GET',
      headers: {
        'content-type': 'application/json',
      },
      auth: {
        username: api.username,
        password: api.password,
      },
      url: `${api.url}:${api.port}/security/user/authenticate${!!authContext ? '/run_as' : ''}`,
      ...(!!authContext ? { data: authContext } : {})
    };

    const response = await axios(optionsRequest);
    const token: string = (((response || {}).data || {}).data || {}).token;
    if (!authContext) {
      CacheInternalUserAPIHostToken.set(apiHostID, token);
    };
    return token;
  }catch(error){
    throw error;
  }
};

const buildRequestOptions = async (method: string, path: string, data: any, { idHost, forceRefresh, token }) => {
  const api = await manageHosts.getHostById(idHost);
  return {
    method: method,
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(data.headers ? data.headers : {})
    },
    data: data.body || data || {},
    params: data.params || {},
    url: `${api.url}:${api.port}${path}`,
  }
}

export const requestAsInternalUser = async (method: string, path: string, data: any, options: any) => {
  try{
    const token = CacheInternalUserAPIHostToken.has(options.apiHostID) && options.forceRefresh
      ? CacheInternalUserAPIHostToken.get(options.apiHostID)
      : await authenticate(options.apiHostID);
    return await request(method, path, data, {...options, token});
  }catch(error){
    if (error.response && error.response.status === 401) {
      try{
        const token = await authenticate(options.idHost);
        return await request(method, path, data, {...options, token});
      }catch(error){
        throw error;
      }
    }
    throw error;
  }
};

export const requestAsCurrentUser = async (method: string, path: string, data: any, options: any) => {
  return await request(method, path, data, options)
};

const request = async (method: string, path: string, data: any, options: any) => {
  try{
    const optionsRequest = buildRequestOptions(method, path, data, options)
    const response = await axios(optionsRequest);
    return response;
  }catch(error){
    throw error;
  }
};
