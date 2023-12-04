/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import { getConfiguration } from './get-configuration';
import { WAZUH_DATA_CONFIG_APP_PATH } from '../../common/constants';
import { formatSettingValueToFile } from '../../common/services/settings';
import { Logger } from 'opensearch-dashboards/server';

/**
 * This service updates the configuration file
 */
export class UpdateConfigurationFile {
  constructor(private logger: Logger) {
    this.busy = false;
    this.file = WAZUH_DATA_CONFIG_APP_PATH;
  }

  /**
   * Add or replace specific setting from wazuh.yml
   * @param {String} key The setting name.
   * @param {String} value New value for the setting.
   * @param {Boolean} exists If true, it just replaces the value for that key.
   */
  updateLine(key, value, exists = false) {
    try {
      this.logger.debug(`Updating setting: ${key} with value ${value}`);
      const data = fs.readFileSync(this.file, { encoding: 'utf-8' });
      const re = new RegExp(`^${key}\\s{0,}:\\s{1,}.*`, 'gm');
      const formatedValue = formatSettingValueToFile(value);
      const result = exists
        ? data.replace(re, `${key}: ${formatedValue}`)
        : `${data}\n${key}: ${formatedValue}`;
      this.logger.info(`updateLine: ${result}`);
      fs.writeFileSync(this.file, result, 'utf8');
      return true;
    } catch (error) {
      this.logger.error(error.message || error);
      throw error;
    }
  }

  /**
   * Updates wazuh.yml file. If it fails, it throws the error to the next function.
   * @param {Object} updatedConfiguration
   */
  updateConfiguration(updatedConfiguration) {
    try {
      if (this.busy) {
        throw new Error('Another process is updating the configuration file');
      }
      this.busy = true;

      const pluginConfiguration = getConfiguration({ force: true }) || {};

      for (const pluginSettingKey in updatedConfiguration) {
        // Store the configuration in the configuration file.
        const value = updatedConfiguration[pluginSettingKey];
        this.updateLine(
          pluginSettingKey,
          value,
          /* WARNING: This is trusting the result of getConfiguration service only returns the
          settings defined in the configuration file. The updateLine function could be enhanced to
          identify if the setting is defined or not itself.
          */
          typeof pluginConfiguration[pluginSettingKey] !== 'undefined',
        );
        // Update the app configuration server-cached setting in memory with the new value.
        pluginConfiguration[pluginSettingKey] = value;
      }

      this.busy = false;
      this.logger.debug('Updating configuration');
    } catch (error) {
      this.logger.error(error.message || error);
      this.busy = false;
      throw error;
    }
  }
}
