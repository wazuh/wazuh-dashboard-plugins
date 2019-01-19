/*
 * Wazuh app - Useful functions to handle API entries
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import packageJSON from '../../package.json';
import needle from 'needle';
import { getPath } from '../../util/get-path';

export function buildOptionsObject(api) {
  return {
    headers: {
      'wazuh-app-version': packageJSON.version
    },
    username: api.user,
    password: api.password,
    rejectUnauthorized: !api.insecure
  };
}

export async function fetchAllAgents(api, maxSize, payload, options) {
  try {
    let agents = [];
    // Prevents infinite loop if offset gets higher than maxSize
    while (agents.length < maxSize && payload.offset < maxSize) {
      const response = await needle(
        'get',
        `${getPath(api)}/agents`,
        payload,
        options
      );
      if (!response.error && response.body.data.items) {
        agents = agents.concat(response.body.data.items);
        payload.offset += payload.limit;
      } else {
        throw new Error('Can not access Wazuh API');
      }
    }
    return agents;
  } catch (error) {
    return Promise.reject(error);
  }
}
