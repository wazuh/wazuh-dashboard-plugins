/*
 * Wazuh app - Statistics handler service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../../../react-services/wz-request';

export default class StatisticsHandler {
  /**
   * Get statistics of demon
   */
  static async demonStatistics(demon, node = false) {
    try {
      let result = null;
      if (node) {
        result = await WzRequest.apiReq(
          'GET',
          `/cluster/${node}/stats/${demon}`,
          {}
        );
      } else {
        result = await WzRequest.apiReq('GET', `/manager/stats/${demon}`, {});
      }

      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
