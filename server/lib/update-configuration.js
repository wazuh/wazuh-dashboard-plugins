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
import { getConfiguration } from './get-configuration';

const needRestartFields = [
  'pattern',
  'wazuh.shards',
  'wazuh.replicas',
  'wazuh.monitoring.enabled',
  'wazuh.monitoring.frequency',
  'wazuh.monitoring.shards',
  'wazuh.monitoring.replicas',
  'wazuh.monitoring.creation',
  'wazuh.monitoring.pattern',
  'logs.level'
];
export class UpdateConfigurationFile {
  constructor() {
    this.busy = false;
    this.file = path.join(__dirname, '../../config.yml');
  }

  /**
   * Add or replace specific setting from config.yml
   * @param {String} key The setting name.
   * @param {String} value New value for the setting.
   * @param {Boolean} exists If true, it just replaces the value for that key.
   */
  updateLine(key, value, exists = false) {
    try {
      const data = fs.readFileSync(this.file, { encoding: 'utf-8' });
      const re = new RegExp(`^${key}\\s{0,}:\\s{1,}.*`, 'gm');
      const result = exists
        ? data.replace(re, `${key}: ${value}`)
        : `${data}\n${key}: ${value}`;
      fs.writeFileSync(this.file, result, 'utf8');
      log('update-configuration:updateLine', 'Updating line', 'debug');
      return true;
    } catch (error) {
      log('update-configuration:updateLine', error.message || error);
      throw error;
    }
  }

  /**
   * Updates config.yml file. If it fails, it throws the error to the next function.
   * @param {Object} input
   */
  updateConfiguration(input) {
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;
      const configuration = getConfiguration() || {};
      if (!!configuration.admin) {
        throw new Error('You are not authorized to update the configuration');
      }
      const { key, value } = (input || {}).payload || {};
      this.updateLine(key, value, typeof configuration[key] !== 'undefined');
      this.busy = false;
      log('update-configuration:updateConfiguration', 'Updating configuration', 'debug');
      return { needRestart: needRestartFields.includes(key) };
    } catch (error) {
      log('update-configuration:updateConfiguration', error.message || error);
      this.busy = false;
      throw error;
    }
  }

  composeHost(host, id) {
    try {
      log('update-configuration:composeHost', 'Composing host', 'debug');
      return `  - ${!id ? new Date().getTime() : id}:
      url: ${host.url}
      port: ${host.port}
      user: ${host.username || host.user}
      password: ${host.password}`;
    } catch (error) {
      log('update-configuration:composeHost', error.message || error);
      throw error;
    }
  }

  composeRegex(host) {
    try {
      const hostId = Object.keys(host)[0];
      const hostProps = Object.keys(host[hostId]).length;
      let str = `\\s*-\\s*${hostId}\\s*:[\\n\\r]`;
      for (let i = 0; i < hostProps; i++) {
        str = str.concat('\\s*\\S*\\s*\\S*');
        if (i != hostProps - 1) {
          str = str.concat('[\\n\\r]')
        }
      }
      log('update-configuration:composeRegex', 'Composing regex', 'debug');
      return new RegExp(`${str}`, 'gm');
    } catch (error) {
      log('update-configuration:composeRegex', error.message || error);
      throw error;
    }
  }

  async getHosts() {
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;
      const configuration = getConfiguration() || {};
      this.busy = false;
      log('update-configuration:getHosts', 'Getting hosts', 'debug');
      return configuration['wazuh.hosts'] || [];
    } catch (error) {
      this.busy = false;
      log('update-configuration:getHosts', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Get host by id
   * @param {String} id 
   */
  async getHostById(id) {
    try {
      log('update-configuration:getHostById', `Getting host ${id}`, 'debug');
      const hosts = await this.getHosts();
      const host = hosts.filter(h => { return Object.keys(h)[0] == id });
      return host[0];
    } catch (error) {
      log('update-configuration:getHostById', error.message || error);
      return Promise.reject(error);
    }
  }

  // Decrypts the encrypted password
  decryptApiPassword(password) {
    return Buffer.from(
      password,
      'base64'
    ).toString('ascii');
  }

  /**
   *  Iterate the array with the API entries in given from the .wazuh index in order to create a valid array
   * @param {Object} apiEntries 
   */
  transformIndexedApis(apiEntries) {
    const entries = [];
    try {
      apiEntries.map(entry => {
        const id = entry._id;
        const host = entry._source;
        const api = {
          id: id,
          url: host.url,
          port: host.api_port,
          user: host.api_user,
          password: this.decryptApiPassword(host.api_password)
        };
        entries.push(api);
      });
      log('update-configuration:transformIndexedApis', 'Transforming index API schedule to config.yml', 'debug');
    } catch (error) {
      log('update-configuration:transformIndexedApis', error.message || error);
      throw error;
    }
    return entries;
  }


  /**
  * Calls transformIndexedApis() to get the entries to migrate and after that calls addSeveralHosts()
  * @param {Object} apiEntries 
  */
  async migrateFromIndex(apiEntries) {
    try {
      const apis = this.transformIndexedApis(apiEntries);
      await this.addSeveralHosts(apis);
      log('update-configuration:addHost', `Host ${id} was properly added`, 'debug');
    } catch (error) {
      log('update-configuration:migrateFromIndex', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Recursive function used to add several APIs entries
   * @param {Array} hosts 
   */
  async addSeveralHosts(hosts) {
    try {
      log('update-configuration:addSeveralHosts', `Adding several hosts(${hosts.length})`, 'debug');
      const entry = hosts.shift();
      const response = await this.addHost(entry);
      if (hosts.length && response) {
        await this.addSeveralHosts(hosts);
      } else {
        return 'All APIs entries were migrated to the config.yml'
      }
    } catch (error) {
      log('update-configuration:addSeveralHosts', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * 
   * @param {Obeject} host 
   */
  async addHost(host) {
    const id = host.id || new Date().getTime();
    const compose = this.composeHost(host, id);
    let data = await fs.readFileSync(this.file, { encoding: 'utf-8' });
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;
      const configuration = getConfiguration() || {};
      if (!configuration['wazuh.hosts']) {
        const result = `${data}\nwazuh.hosts:\n${compose}\n`;
        await fs.writeFileSync(this.file, result, 'utf8');
        data = await fs.readFileSync(this.file, { encoding: 'utf-8' });
      } else {
        const lastHost = (configuration['wazuh.hosts'] || []).pop();
        if (lastHost) {
          const lastHostObject = this.composeHost(lastHost[Object.keys(lastHost)[0]], Object.keys(lastHost)[0]);
          const regex = this.composeRegex(lastHost);
          const replace = data.replace(regex, `\n${lastHostObject}\n${compose}\n`)
          await fs.writeFileSync(this.file, replace, 'utf8');
        }
      }
      this.busy = false;
      log('update-configuration:addHost', `Host ${id} was properly added`, 'debug');
      return id;
    } catch (error) {
      this.busy = false;
      log('update-configuration:addHost', error.message || error);
      return Promise.reject(error);
    }
  }

  async deleteHost(req) {
    let data = await fs.readFileSync(this.file, { encoding: 'utf-8' });
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;
      const configuration = getConfiguration() || {};
      const hosts = configuration['wazuh.hosts'];
      if (!hosts) {
        throw new Error('There are not configured hosts.');
      } else {
        const hostsNumber = hosts.length;
        const target = (hosts || []).find((element) => {
          return Object.keys(element)[0] === req.params.id;
        });
        if (!target) {
          throw new Error(`Host ${req.params.id} not found.`);
        }
        const regex = this.composeRegex(target);
        const result = data.replace(regex, ``)
        await fs.writeFileSync(this.file, result, 'utf8');
        if (hostsNumber === 1) {
          data = await fs.readFileSync(this.file, { encoding: 'utf-8' });
          const clearHosts = data.replace(new RegExp(`wazuh.hosts:\\s*[\\n\\r]`, 'gm'), '')
          await fs.writeFileSync(this.file, clearHosts, 'utf8');
        }
      }
      this.busy = false;
      log('update-configuration:deleteHost', `Host ${req.params.id} was properly deleted`, 'debug');
      return true;
    } catch (error) {
      this.busy = false;
      log('update-configuration:deleteHost', error.message || error);
      return Promise.reject(error);
    }
  }

  async updateHost(id, host) {
    let data = await fs.readFileSync(this.file, { encoding: 'utf-8' });
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;
      const configuration = getConfiguration() || {};
      const hosts = configuration['wazuh.hosts'];
      if (!hosts) {
        throw new Error('There are not configured hosts.');
      } else {
        const target = (hosts || []).find((element) => {
          return Object.keys(element)[0] === id;
        });
        if (!target) {
          throw new Error(`Host ${id} not found.`);
        }
        const regex = this.composeRegex(target);
        const result = data.replace(regex, `\n${this.composeHost(host, id)}`);
        await fs.writeFileSync(this.file, result, 'utf8');
      }
      this.busy = false;
      log('update-configuration:updateHost', `Host ${id} was properly updated`, 'debug');
      return true;
    } catch (error) {
      this.busy = false;
      log('update-configuration:updateHost', error.message || error);
      return Promise.reject(error);
    }
  }
}
