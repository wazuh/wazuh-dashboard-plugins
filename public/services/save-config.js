/*
 * Wazuh app - Group handler service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class SaveConfig {
  constructor(apiReq) {
    this.apiReq = apiReq;
  }

  async saveManagerConfiguration(content) {
    try {
      const result = await this.apiReq.request(
        'POST',
        `/manager/files?path=etc/ossec.conf`,
        { content, origin: 'xmleditor' }
      );
      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async saveNodeConfiguration(node, content) {
    try {
      //-

      return result;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
