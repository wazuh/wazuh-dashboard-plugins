import { Logger } from 'opensearch-dashboards/server';
import {
  IConfigurationStore,
  IConfiguration,
} from '../../common/services/configuration';
import { CacheTTL } from '../../common/services/cache';
import fs from 'fs';
import yml from 'js-yaml';
import { createDirectoryIfNotExists } from './filesystem';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { TPluginSettingWithKey } from '../../common/constants';
import path from 'path';

interface IConfigurationStoreOptions {
  cache_seconds: number;
  file: string;
}

interface IStoreGetOptions {
  ignoreCache: boolean;
}

export class ConfigurationStore implements IConfigurationStore {
  private configuration: IConfiguration;
  private _cache: CacheTTL<any>;
  private _cacheKey: string;
  private _fileEncoding: string = 'utf-8';
  file: string = '';
  constructor(private logger: Logger, options: IConfigurationStoreOptions) {
    this.file = options.file;

    if (!this.file) {
      const error = new Error('File is not defined');
      this.logger.error(error.message);
      throw error;
    }

    /* The in-memory ttl cache is used to reduce the access to the persistence */
    this._cache = new CacheTTL<any>(this.logger.get('cache'), {
      ttlSeconds: options.cache_seconds,
    });
    this._cacheKey = 'configuration';
  }
  private readContentConfigurationFile() {
    this.logger.debug(`Reading file [${this.file}]`);
    const content = fs.readFileSync(this.file, {
      encoding: this._fileEncoding,
    });
    return content;
  }
  private writeContentConfigurationFile(content: string, options = {}) {
    this.logger.debug(`Writing file [${this.file}]`);
    fs.writeFileSync(this.file, content, {
      encoding: this._fileEncoding,
      ...options,
    });
    this.logger.debug(`Wrote file [${this.file}]`);
  }
  private readConfigurationFile() {
    const content = this.readContentConfigurationFile();
    const contentAsObject = yml.load(content) || {}; // Ensure the contentAsObject is an object
    this.logger.debug(
      `Content file [${this.file}]: ${JSON.stringify(contentAsObject)}`,
    );
    // Transform value for key in the configuration file
    return Object.fromEntries(
      Object.entries(contentAsObject).map(([key, value]) => {
        const setting = this.configuration._settings.get(key);
        return [key, setting?.store?.file?.transformFrom?.(value) ?? value];
      }),
    );
  }
  private updateConfigurationFile(attributes: any) {
    // Plugin settings configurables in the configuration file.
    const pluginSettingsConfigurableFile = Object.fromEntries(
      Object.entries(attributes)
        .filter(
          ([key]) =>
            this.configuration._settings.get(key)?.store?.file?.configurable,
        )
        .map(([key, value]) => [key, value]),
    );

    const content = this.readContentConfigurationFile();

    const contentUpdated = Object.entries(
      pluginSettingsConfigurableFile,
    ).reduce((accum, [key, value]) => {
      const re = new RegExp(`^${key}\\s{0,}:\\s{1,}.*`, 'gm');
      const match = accum.match(re);

      // Remove the setting if value is null
      if (value === null) {
        return accum.replace(re, '');
      }

      const formattedValue = formatSettingValueToFile(value);
      const updateSettingEntry = `${key}: ${formattedValue}`;
      return match
        ? /* Replace the setting if it is defined */
          accum.replace(re, `${updateSettingEntry}`)
        : /* Append the new setting entry to the end of file */ `${accum}${
            accum.endsWith('\n') ? '' : '\n'
          }${updateSettingEntry}` /*exists*/;
    }, content);

    this.writeContentConfigurationFile(contentUpdated);
    return pluginSettingsConfigurableFile;
  }
  setConfiguration(configuration: IConfiguration) {
    this.configuration = configuration;
  }
  private async storeGet(params?: IStoreGetOptions) {
    if (!params?.ignoreCache && this._cache.has(null, this._cacheKey)) {
      return this._cache.get(null, this._cacheKey);
    }
    const configuration = await this.readConfigurationFile();

    // Cache the values
    this._cache.set(configuration, this._cacheKey);
    return configuration;
  }
  private async storeSet(attributes: any) {
    const configuration = await this.updateConfigurationFile(attributes);
    this._cache.set(attributes, this._cacheKey);
    return configuration;
  }
  private getDefaultConfigurationFileContent() {
    const header: string = `---
#
# App configuration file
# Copyright (C) 2015-2024 Wazuh, Inc.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# Find more information about this on the LICENSE file.
#
${printSection('App configuration file', { prefix: '# ', fill: '=' })}
#
# Please check the documentation for more information about configuration options:
# ${webDocumentationLink('user-manual/wazuh-dashboard/config-file.html')}
#
# Also, you can check our repository:
# https://github.com/wazuh/wazuh-dashboard-plugins`;

    const hostsConfiguration = `${printSection('API connections', {
      prefix: '# ',
      fill: '-',
    })}
#
# The following configuration is the default structure to define a host.
#
# hosts:
#   # Host ID / name,
#   - env-1:
#       # Host URL
#       url: https://env-1.example
#       # Host / API port
#       port: 55000
#       # Host / API username
#       username: wazuh-wui
#       # Host / API password
#       password: wazuh-wui
#       # Use RBAC or not. If set to true, the username must be "wazuh-wui".
#       run_as: true
#   - env-2:
#       url: https://env-2.example
#       port: 55000
#       username: wazuh-wui
#       password: wazuh-wui
#       run_as: true

hosts:
  - default:
      url: https://localhost
      port: 55000
      username: wazuh-wui
      password: wazuh-wui
      run_as: false
`;

    const pluginSettingsConfigurationFileGroupByCategory =
      this.configuration.groupSettingsByCategory(
        null,
        setting => setting?.store?.file?.configurable,
      );

    const pluginSettingsConfiguration =
      pluginSettingsConfigurationFileGroupByCategory
        .map(({ category: categorySetting, settings }) => {
          const category = printSettingCategory(categorySetting);

          const pluginSettingsOfCategory = settings
            .map(setting => printSetting(setting))
            .join('\n#\n');
          /*
  #------------------- {category name} --------------
  #
  #  {category description}
  #
  # {setting description}
  # settingKey: settingDefaultValue
  #
  # {setting description}
  # settingKey: settingDefaultValue
  # ...
  */
          return [category, pluginSettingsOfCategory].join('\n#\n');
        })
        .join('\n#\n');

    return [header, pluginSettingsConfiguration, hostsConfiguration].join(
      '\n#\n',
    );
  }
  ensureConfigurationFileIsCreated() {
    try {
      this.logger.debug(
        `Ensuring the configuration file is created [${this.file}]`,
      );
      const dirname = path.resolve(path.dirname(this.file));
      createDirectoryIfNotExists(dirname);
      if (!fs.existsSync(this.file)) {
        this.writeContentConfigurationFile(
          this.getDefaultConfigurationFileContent(),
          {
            mode: 0o600,
          },
        );
        this.logger.info(`Configuration file was created [${this.file}]`);
      } else {
        this.logger.debug(`Configuration file exists [${this.file}]`);
      }
    } catch (error) {
      const enhancedError = new Error(
        `Error ensuring the configuration file is created: ${error.message}`,
      );
      this.logger.error(enhancedError.message);
      throw enhancedError;
    }
  }
  async setup() {
    this.logger.debug('Setup');
  }
  async start() {
    try {
      this.logger.debug('Start');
      this.ensureConfigurationFileIsCreated();
    } catch (error) {
      this.logger.error(`Error starting: ${error.message}`);
    }
  }
  async stop() {
    this.logger.debug('Stop');
  }
  async get(...settings: string[]): Promise<any | { [key: string]: any }> {
    try {
      const storeGetOptions =
        settings.length && typeof settings[settings.length - 1] !== 'string'
          ? settings.pop()
          : {};
      this.logger.debug(
        `Getting settings: [${JSON.stringify(
          settings,
        )}] with store get options [${storeGetOptions}]`,
      );
      const stored = await this.storeGet(storeGetOptions);
      return settings.length
        ? settings.reduce(
            (accum, settingKey: string) => ({
              ...accum,
              [settingKey]: stored?.[settingKey],
            }),
            {},
          )
        : stored;
    } catch (error) {
      const enhancedError = new Error(
        `Error getting configuration: ${error.message}`,
      );
      this.logger.error(enhancedError.message);
      throw enhancedError;
    }
  }
  async set(settings: { [key: string]: any }): Promise<any> {
    try {
      this.logger.debug('Updating');
      const stored = await this.storeGet({ ignoreCache: true });

      const newSettings = {
        ...stored,
        ...settings,
      };
      this.logger.debug(`Updating with ${JSON.stringify(newSettings)}`);
      await this.storeSet(newSettings);
      this.logger.debug('Configuration was updated');
      return settings;
    } catch (error) {
      const enhancedError = new Error(
        `Error setting configuration: ${error.message}`,
      );
      this.logger.error(enhancedError.message);
      throw enhancedError;
    }
  }
  async clear(...settings: string[]): Promise<any> {
    try {
      const removedSettings = {};
      settings.forEach(setting => {
        removedSettings[setting] = null;
      });
      await this.storeSet(removedSettings);
      return removedSettings;
    } catch (error) {
      const enhancedError = new Error(
        `Error clearing configuration: ${error.message}`,
      );
      this.logger.error(enhancedError.message);
      throw enhancedError;
    }
  }
}

// Utils

// Formatters in configuration file
const formatSettingValueToFileType = {
  string: (value: string): string =>
    `"${value.replace(/"/, '\\"').replace(/\n/g, '\\n')}"`, // Escape the " character and new line
  object: (value: any): string => JSON.stringify(value),
  default: (value: any): any => value,
};

/**
 * Format the plugin setting value received in the backend to store in the plugin configuration file (.yml).
 * @param value plugin setting value sent to the endpoint
 * @returns valid value to .yml
 */
function formatSettingValueToFile(value: any) {
  const formatter =
    formatSettingValueToFileType[typeof value] ||
    formatSettingValueToFileType.default;
  return formatter(value);
}

/**
 * Print the setting value
 * @param value
 * @returns
 */
export function printSettingValue(value: unknown): any {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  if (typeof value === 'string' && value.length === 0) {
    return `''`;
  }

  return value;
}

/**
 * Print setting on the default configuration file
 * @param setting
 * @returns
 */
export function printSetting(setting: TPluginSettingWithKey): string {
  /*
  # {setting description}
  # {settingKey}: {settingDefaultValue}
  */
  return [
    splitDescription(setting.description),
    `# ${setting.key}: ${printSettingValue(setting.defaultValue)}`,
  ].join('\n');
}

/**
 * Print category header on the default configuration file
 * @param param0
 * @returns
 */
export function printSettingCategory({ title, description }) {
  /*
  #------------------------------- {category title} -------------------------------
  # {category description}
  #
  */
  return [
    printSection(title, { prefix: '# ', fill: '-' }),
    ...(description ? [splitDescription(description)] : ['']),
  ].join('\n#\n');
}

export function printSection(
  text: string,
  options?: {
    maxLength?: number;
    prefix?: string;
    suffix?: string;
    spaceAround?: number;
    fill?: string;
  },
) {
  const maxLength = options?.maxLength ?? 80;
  const prefix = options?.prefix ?? '';
  const sufix = options?.suffix ?? '';
  const spaceAround = options?.spaceAround ?? 1;
  const fill = options?.fill ?? ' ';
  const fillLength =
    maxLength - prefix.length - sufix.length - 2 * spaceAround - text.length;

  return [
    prefix,
    fill.repeat(Math.floor(fillLength / 2)),
    ` ${text} `,
    fill.repeat(Math.ceil(fillLength / 2)),
    sufix,
  ].join('');
}

/**
 * Given a string, this function builds a multine string, each line about 70
 * characters long, splitted at the closest whitespace character to that lentgh.
 *
 * This function is used to transform the settings description
 * into a multiline string to be used as the setting documentation.
 *
 * The # character is also appended to the beginning of each line.
 *
 * @param text
 * @returns multine string
 */
export function splitDescription(text: string = ''): string {
  const lines = text.match(/.{1,80}(?=\s|$)/g) || [];
  return lines.map(z => '# ' + z.trim()).join('\n');
}
