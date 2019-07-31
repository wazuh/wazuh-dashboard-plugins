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
import { log } from '../logger';

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
      log('update-registry:readContent', 'Reading wazuh-registry.json content', 'debug');
      return JSON.parse(content);  
    } catch (error) {
      log('update-registry:readContent', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Writes the wazuh-registry.json
   * @param {Object} content 
   */
    async writeContent(content){
      try {
        if (this.busy) {
          throw new Error('Another process is updating the registry file');
        }
        this.busy = true;
        await fs.writeFileSync(this.file, JSON.stringify(content));
        this.busy = false;
        log('update-registry:writeContent', 'Writting wazuh-registry.json content', 'debug');
      } catch (error) {
        log('update-registry:writeContent', error.message || error);
        return Promise.reject(error)
      }
  }

  /**
   * Uptades the cluster information associated with the current selected API
   * @param {String} id 
   * @param {Object} clusterInfo 
   */
  async updateWazuhClusterInfo(id, clusterInfo) {
    try {
      const content = await this.readContent();
      const hosts = content.hosts || [];
      const data = Object.assign({'id': id}, clusterInfo);
      if (!hosts.length || !this.checkHost(id, hosts)) {
        content.hosts.push(data);
      } else {
        content.hosts = Object.assign(this.updateHostInfo(id, hosts, clusterInfo));
      }
      this.writeContent(content);
      log('update-registry:updateWazuhClusterInfo', `API ${id} was properly updated`, 'debug');
    } catch (error) {
      log('update-registry:updateWazuhClusterInfo', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Checks if the host exist in order to update the data, otherwise creates it
   * @param {String} id 
   * @param {Object} hosts 
   */
  checkHost(id, hosts) {
    try {
      const exists = hosts.filter(host => {
        return host.id == id;
      });
      return exists.length === 1; //Checks if the host exists and if is an unique
    } catch (error) {
      log('update-registry:checkHost', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Replace the existing host information with the new and return the hosts list updated
   * @param {String} id 
   * @param {Object} hosts 
   * @param {Object} clusterInfo
   */
  updateHostInfo(id, hosts, clusterInfo){
    try {
      const idx = this.findIndexHost(id, hosts)
      hosts[idx] = Object.assign({'id': id}, clusterInfo);
      return hosts;
    } catch (error) {
      log('update-registry:updateHostInfo', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Returns the index of the array where the API is stored
   * @param {String} id 
   * @param {Array} hosts 
   */
  findIndexHost(id, hosts){
    try {
      let i = 0;
      while (i < hosts.length){
        if (hosts[i].id == id) break;
        i++;
      }
      return i;
    } catch (error) {
      log('update-registry:findIndexHost', error.message || error);
      return Promise.reject(error)
    }
  }

  /**
   * 
   * @param {Object} req 
   */
  async deleteHost(req) {
    try {
      if (!req.params || !req.params.id) throw new Error('API id is not present');
      const id = req.params.id;
      const content = await this.readContent();
      const hosts = content.hosts.filter(h => {
        return h.id != id;
      });
      content.hosts = hosts;
      await this.writeContent(content);
      log('update-registry:deleteHost', `API ${id} was removed from the registry`, 'debug'); 
    } catch (error) {
      log('update-registry:deleteHost', error.message || error);
      return Promise.reject(error);
    }
  }
}