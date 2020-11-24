/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
  'wazuh.monitoring.enabled',
  'wazuh.monitoring.frequency',
  'wazuh.monitoring.shards',
  'wazuh.monitoring.replicas',
  'wazuh.monitoring.creation',
  'wazuh.monitoring.pattern',
  'alerts.sample.prefix',
  'cron.statistics.index.shards',
  'cron.statistics.index.replicas',
  'logs.level',
];

const newReloadFields = [
  'hideManagerAlerts',
];
export class UpdateConfigurationFile {
  constructor() {
    this.busy = false;
    this.file = path.join(
      __dirname,
      '../../../../optimize/wazuh/config/wazuh.yml'
    );
  }

  /**
   * Add or replace specific setting from wazuh.yml
   * @param {String} key The setting name.
   * @param {String} value New value for the setting.
   * @param {Boolean} exists If true, it just replaces the value for that key.
   */
  updateLine(key, value, exists = false) {
    try {
      const data = fs.readFileSync(this.file, { encoding: 'utf-8' });
      const re = new RegExp(`^${key}\\s{0,}:\\s{1,}.*`, 'gm');
      const formatedValue = this.formatValue(value);
      const result = exists
        ? data.replace(re, `${key}: ${formatedValue}`)
        : `${data}\n${key}: ${formatedValue}`;
      fs.writeFileSync(this.file, result, 'utf8');
      log('update-configuration:updateLine', 'Updating line', 'debug');
      return true;
    } catch (error) {
      log('update-configuration:updateLine', error.message || error);
      throw error;
    }
  }

  formatValue = (value) => typeof value === 'string'
    ? isNaN(Number(value)) ? `'${value}'` : value
    : typeof value === 'object'
      ? JSON.stringify(value)
      : value

  formatValueCachedConfiguration = (value) => typeof value === 'string'
    ? isNaN(Number(value)) ? value : Number(value)
    : value;
  /**
   * Updates wazuh.yml file. If it fails, it throws the error to the next function.
   * @param {Object} input
   */
  updateConfiguration(input) {
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;

      const configuration = getConfiguration(true) || {};

      const { key, value } = (input || {}).payload || {};
      this.updateLine(key, value, typeof configuration[key] !== 'undefined');

      // Update the app configuration server-cached setting in memory with the new value
      configuration[key] = this.formatValueCachedConfiguration(value);

      this.busy = false;
      log(
        'update-configuration:updateConfiguration',
        'Updating configuration',
        'debug'
      );
      return {
        needRestart: needRestartFields.includes(key),
        needReload: newReloadFields.includes(key)
      };
    } catch (error) {
      log('update-configuration:updateConfiguration', error.message || error);
      this.busy = false;
      throw error;
    }
  }
}
