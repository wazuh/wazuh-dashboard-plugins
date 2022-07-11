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

import axios, { AxiosResponse } from 'axios';
import { ManageHosts } from './manage-hosts';
import https from 'https';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const _axios = axios.create({ httpsAgent });

interface APIHost{
  url: string
  port: string
  username: string
  password: string
}

export interface APIInterceptorRequestOptions{
  apiHostID: string
  token: string
  forceRefresh?: boolean
}

export interface APIInterceptorRequestOptionsInternalUser{
  apiHostID: string
  forceRefresh?: boolean
}

const manageHosts = new ManageHosts();

// Cache to save the token for the internal user by API host ID
const CacheInternalUserAPIHostToken = new Map<string,string>();

export const authenticate = async (apiHostID: string, authContext?: any): Promise<string> => {
  try{
    const api: APIHost = await manageHosts.getHostById(apiHostID);
    const optionsRequest = {
      method: 'POST',
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

    const response: AxiosResponse = await _axios(optionsRequest);
    const token: string = (((response || {}).data || {}).data || {}).token;
    if (!authContext) {
      CacheInternalUserAPIHostToken.set(apiHostID, token);
    };
    return token;
  }catch(error){
    throw error;
  }
};

const buildRequestOptions = async (method: string, path: string, data: any, { apiHostID, forceRefresh, token }: APIInterceptorRequestOptions) => {
  const api = await manageHosts.getHostById(apiHostID);
  const { body, params, headers, ...rest } = data;
  return {
    method: method,
    headers: {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + token,
      ...(headers ? headers : {})
    },
    data: body || rest || {},
    params: params || {},
    url: `${api.url}:${api.port}${path}`,
  }
}

export const requestAsInternalUser = async (method: string, path: string, data: any, options: APIInterceptorRequestOptionsInternalUser) => {
  try{
    const token = CacheInternalUserAPIHostToken.has(options.apiHostID) && !options.forceRefresh
      ? CacheInternalUserAPIHostToken.get(options.apiHostID)
      : await authenticate(options.apiHostID);
    return await request(method, path, data, {...options, token});
  }catch(error){
    if (error.response && error.response.status === 401) {
      try{
        const token: string = await authenticate(options.apiHostID);
        return await request(method, path, data, {...options, token});
      }catch(error){
        throw error;
      }
    }
    throw error;
  }
};

export const requestAsCurrentUser = async (method: string, path: string, data: any, options: APIInterceptorRequestOptions) => {
  return await request(method, path, data, options)
};

const request = async (method: string, path: string, data: any, options: any): Promise<AxiosResponse> => {
  try{
    const optionsRequest = await buildRequestOptions(method, path, data, options);
    const response: AxiosResponse = await _axios(optionsRequest);
    return response;
  }catch(error){
    throw error;
  }
};
