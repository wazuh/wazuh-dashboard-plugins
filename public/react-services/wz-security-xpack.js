/*
 * Wazuh app - Generic request
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { GenericRequest } from "./generic-request";
import { WzRequest } from './wz-request';

export class WzSecurityXpack {
  static async getUsers() {
    try {
      const users = await GenericRequest.request(
        "GET",
        `/internal/security/users`,
        {}
      );
      return users.data;
    } catch (error) {
      throw error;
    }
  }

  static async createUser(username, params) {
    try {
      const response = await GenericRequest.request(
        "POST",
        `/internal/security/users/${username}`,
        { ...params }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async editUser(username, params) {
    try {
      const response = await GenericRequest.request(
        "POST",
        `/internal/security/users/${username}`,
        { ...params }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteUser(username) {
    try {
      const response = await GenericRequest.request(
        "DELETE",
        `/internal/security/users/${username}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async createPolicy(params) {
    try {
      const response = await WzRequest.apiReq(
        "POST",
        '/security/policies',
        { ...params }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
