/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import path from 'path';

export class UpdateRegistry {
  constructor() {
    this.busy = false;
    this.file = path.join(__dirname, '../../server/wazuh-registry.json');
  }


  /**
   * Reads the Wazuh registry content
   */
  async readContent(){
    try {
      const content = await fs.readFileSync(this.file, { encoding: 'utf-8' });
      return JSON.parse(content);  
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Uptades the cluster information associated with the current selected API
   * @param {String} id 
   * @param {Object} clusterInfo 
   */
  async updateWazuhClusterInfo(id, clusterInfo) {
    return;
  }
}