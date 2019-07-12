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
  }

  /**
   * Add or replace specific setting from config.yml
   * @param {String} key The setting name.
   * @param {String} value New value for the setting.
   * @param {Boolean} exists If true, it just replaces the value for that key.
   */
  updateLine(key, value, exists = false) {
    try {
      const file = path.join(__dirname, '../../config.yml');
      const data = fs.readFileSync(file, { encoding: 'utf-8' });
      const re = new RegExp(`^${key}\\s{0,}:\\s{1,}.*`, 'gm');
      const result = exists
        ? data.replace(re, `${key}: ${value}`)
        : `${data}\n${key}: ${value}`;
      fs.writeFileSync(file, result, 'utf8');
      return true;
    } catch (error) {
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
      return { needRestart: needRestartFields.includes(key) };
    } catch (error) {
      this.busy = false;
      throw error;
    }
  }

  composeHost(host, id) {
    return `  - ${!id ? new Date().getTime() : id}:
      url: ${host.url}
      port: ${host.port}
      username: ${host.username || host.user}
      password: ${host.password}`;
  }

  composeRegex(host) {
    const hostId = Object.keys(host)[0];
    const hostProps = Object.keys(host[hostId]).length;
    let str = `\\s*-\\s*${hostId}\\s*:[\\n\\r]`;
    for (let i = 0; i < hostProps; i++) {
      str = str.concat('\\s*\\S*\\s*\\S*');
      if (i != hostProps - 1) {
        str = str.concat('[\\n\\r]')
      }
    }
    return new RegExp(`${str}`, 'gm');
  }

  async getHosts() {
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;
      const configuration = getConfiguration() || {};
      if (!configuration['wazuh.hosts']) {
        throw new Error('There are not configured hosts.');
      } else {
        this.busy = false;
        return configuration['wazuh.hosts'] || [];
      }
    } catch (error) {
      this.busy = false;
      throw error;
    }
  }

  async addHost(host) {
    const file = path.join(__dirname, '../../config.yml');
    let data = await fs.readFileSync(file, { encoding: 'utf-8' });
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;
      const configuration = getConfiguration() || {};
      if (!configuration['wazuh.hosts']) {
        const result = `${data}\nwazuh.hosts:\n${this.composeHost(host)}\n`;
        await fs.writeFileSync(file, result, 'utf8');
        data = await fs.readFileSync(file, { encoding: 'utf-8' });
      } else {
        const lastHost = (configuration['wazuh.hosts'] || []).pop();
        if (lastHost) {
          const lastHostObject = this.composeHost(lastHost[Object.keys(lastHost)[0]], Object.keys(lastHost)[0]);
          const regex = this.composeRegex(lastHost);
          const replace = data.replace(regex, `\n${lastHostObject}\n${this.composeHost(host)}\n`)
          await fs.writeFileSync(file, replace, 'utf8');
        }
      }
      this.busy = false;
      return true;
    } catch (error) {
      this.busy = false;
      throw error;
    }
  }

  async deleteHost(req) {
    const file = path.join(__dirname, '../../config.yml');
    let data = await fs.readFileSync(file, { encoding: 'utf-8' });
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
        await fs.writeFileSync(file, result, 'utf8');
        if (hostsNumber === 1) {
          data = await fs.readFileSync(file, { encoding: 'utf-8' });
          const clearHosts = data.replace(new RegExp(`wazuh.hosts:\\s*[\\n\\r]`, 'gm'), '')
          await fs.writeFileSync(file, clearHosts, 'utf8');
        }
      }
      this.busy = false;
      return true;
    } catch (error) {
      this.busy = false;
      throw error;
    }
  }

  async updateHost(id, host) {
    const file = path.join(__dirname, '../../config.yml');
    let data = await fs.readFileSync(file, { encoding: 'utf-8' });
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
        const result = data.replace(regex, `\n${this.composeHost(host)}`);
        await fs.writeFileSync(file, result, 'utf8');
      }
      this.busy = false;
      return true;
    } catch (error) {
      this.busy = false;
      throw error;
    }
  }
}
