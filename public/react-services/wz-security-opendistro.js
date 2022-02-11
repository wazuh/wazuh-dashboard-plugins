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

export class WzSecurityOpendistro {
  static async getUsers() {
    try {
      const users = await GenericRequest.request(
        "GET",
        `/api/v1/configuration/internalusers`,
        {}
      );
      const tmpUsers = (users.data || {}).data || {};
      const usersArray = Object.keys(tmpUsers).map(user => {
        const full_name = ((tmpUsers[user] || {}).attributes || {}).full_name || null;
        const email = ((tmpUsers[user] || {}).attributes || {}).email || null;
        return {username: user, email, full_name, roles: []}
      })
      return usersArray;
    } catch (error) {
      throw error;
    }
  }

}
