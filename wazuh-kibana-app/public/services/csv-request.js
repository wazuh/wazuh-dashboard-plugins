/*
 * Wazuh app - API request service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { GenericRequest } from '../react-services/generic-request';

export class CSVRequest {
  /**
   * Constructor
   */
  constructor() {
    this.genericReq = GenericRequest;
  }

  /**
   * It fetchs data from /api/csv route using the below parameters.
   * @param {string} path Wazuh API route
   * @param {number|string} id Elasticsearch document ID
   * @param {*} filters Array of Wazuh API filters. Optional
   */
  async fetch(path, id, filters = null) {
    try {
      const output = await this.genericReq.request('POST', '/api/csv', {
          path,
          id,
          filters
      });
      return output.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
