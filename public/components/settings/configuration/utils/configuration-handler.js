/*
 * Wazuh app - Configuration handler service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../react-services/wz-request';
import { AppState } from '../../../../react-services/app-state';

export default class ConfigurationHandler {
  /**
   * Set the configuration key
   */
  static async editKey(key, value) {
    try {
      if (key === 'api.selector') {
        AppState.setAPISelector(value);
      }
      if (key === 'ip.selector') {
        AppState.setPatternSelector(value);
      }
      const result = await WzRequest.genericReq('PUT', '/utils/configuration', {
        key,
        value
      });
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
