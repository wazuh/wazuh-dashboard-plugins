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
  'wazuh-version.shards',
  'wazuh-version.replicas',
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
}
