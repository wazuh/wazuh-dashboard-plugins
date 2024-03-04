/*
 * Wazuh app - Module for app initialization
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import packageJSON from '../../../package.json';
import { pluginPlatformTemplate } from '../../integration-files/kibana-template';
import { totalmem } from 'os';
import fs from 'fs';
import {
  WAZUH_DATA_CONFIG_REGISTRY_PATH,
  WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME,
  WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH,
  PLUGIN_PLATFORM_NAME,
  PLUGIN_PLATFORM_INSTALLATION_USER_GROUP,
  PLUGIN_PLATFORM_INSTALLATION_USER,
  PLUGIN_APP_NAME,
} from '../../../common/constants';
import { createDataDirectoryIfNotExists } from '../../lib/filesystem';
import _ from 'lodash';

export function jobInitializeRun(context) {
  const PLUGIN_PLATFORM_INDEX =
    context.server.config.opensearchDashboards.index;
  context.wazuh.logger.info(
    `${PLUGIN_PLATFORM_NAME} index: ${PLUGIN_PLATFORM_INDEX}`,
  );
  context.wazuh.logger.info(`App revision: ${packageJSON.revision}`);

  try {
    // RAM in MB
    context.wazuh.logger.debug('Getting the total RAM memory');
    const ram = Math.ceil(totalmem() / 1024 / 1024);
    context.wazuh.logger.info(`Total RAM: ${ram}MB`);
  } catch (error) {
    context.wazuh.logger.error(
      `Could not check total RAM due to: ${error.message}`,
    );
  }

  // Save Wazuh App setup
  const saveConfiguration = async (hosts = {}) => {
    try {
      const commonDate = new Date().toISOString();
      const configuration = {
        name: PLUGIN_APP_NAME,
        'app-version': packageJSON.version,
        revision: packageJSON.revision,
        lastRestart: commonDate,
        hosts,
      };
      context.wazuh.logger.debug('Saving the configuration');
      createDataDirectoryIfNotExists();
      createDataDirectoryIfNotExists('config');
      context.wazuh.logger.debug(
        `Saving configuration in registry file: ${JSON.stringify(
          configuration,
        )}`,
      );
      await fs.writeFileSync(
        WAZUH_DATA_CONFIG_REGISTRY_PATH,
        JSON.stringify(configuration),
        'utf8',
      );
      context.wazuh.logger.info('Configuration registry saved.');
    } catch (error) {
      context.wazuh.logger.error(
        `Error creating the registry file: ${error.message}`,
      );
    }
  };

  /**
   * Checks if the .wazuh-registry.json file exists:
   * - yes: check the plugin version and revision match the values stored in the registry file.
   *  If not, then it migrates the data rebuilding the registry file.
   * - no: create the file with empty hosts
   */
  const checkWazuhRegistry = async () => {
    context.wazuh.logger.debug('Checking the existence app data directory.');

    if (!fs.existsSync(WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH)) {
      throw new Error(
        `The data directory is missing in the ${PLUGIN_PLATFORM_NAME} root instalation. Create the directory in ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH} and give it the required permissions (sudo mkdir ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH};sudo chown -R ${PLUGIN_PLATFORM_INSTALLATION_USER}:${PLUGIN_PLATFORM_INSTALLATION_USER_GROUP} ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH}). After restart the ${PLUGIN_PLATFORM_NAME} service.`,
      );
    }

    context.wazuh.logger.debug('Checking the existence of registry file.');

    if (!fs.existsSync(WAZUH_DATA_CONFIG_REGISTRY_PATH)) {
      context.wazuh.logger.debug(
        'Registry file does not exist. Initializing configuration.',
      );

      // Create the app registry file for the very first time
      await saveConfiguration();
    } else {
      context.wazuh.logger.debug('Reading the registry file');
      // If this function fails, it throws an exception
      const source = JSON.parse(
        fs.readFileSync(WAZUH_DATA_CONFIG_REGISTRY_PATH, 'utf8'),
      );
      context.wazuh.logger.debug('The registry file was read');

      // Check if the stored revision differs from the package.json revision
      const isUpgradedApp =
        packageJSON.revision !== source.revision ||
        packageJSON.version !== source['app-version'];

      // Rebuild the registry file if revision or version fields are differents
      if (isUpgradedApp) {
        context.wazuh.logger.info(
          'App revision or version changed, regenerating registry file',
        );
        // Generate the hosts data.
        const registryHostsData = Object.entries(source.hosts).reduce(
          (accum, [hostID, hostData]) => {
            // Migration: Remove the extensions property of the hosts data.
            if (hostData.extensions) {
              delete hostData.extensions;
            }
            accum[hostID] = hostData;
            return accum;
          },
          {},
        );

        // Rebuild the registry file with the migrated host data
        await saveConfiguration(registryHostsData);

        context.wazuh.logger.info('Migrated the registry file.');
      }
    }
  };

  // Init function. Check for wazuh-registry.json file exists.
  const init = async () => {
    await checkWazuhRegistry();
  };

  const createKibanaTemplate = () => {
    context.wazuh.logger.debug(
      `Creating template for ${PLUGIN_PLATFORM_INDEX}`,
    );

    try {
      pluginPlatformTemplate.template = PLUGIN_PLATFORM_INDEX + '*';
    } catch (error) {
      context.wazuh.logger.error('Exception: ' + error.message);
    }

    return context.core.opensearch.client.asInternalUser.indices.putTemplate({
      name: WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME,
      order: 0,
      create: true,
      body: pluginPlatformTemplate,
    });
  };

  const createEmptyKibanaIndex = async () => {
    try {
      context.wazuh.logger.debug(`Creating ${PLUGIN_PLATFORM_INDEX} index.`);
      await context.core.opensearch.client.asInternalUser.indices.create({
        index: PLUGIN_PLATFORM_INDEX,
      });
      context.wazuh.logger.info(`${PLUGIN_PLATFORM_INDEX} index created`);
      await init();
    } catch (error) {
      throw new Error(
        `Error creating ${PLUGIN_PLATFORM_INDEX} index: ${error.message}`,
      );
    }
  };

  const fixKibanaTemplate = async () => {
    try {
      context.wazuh.logger.debug(`Fixing ${PLUGIN_PLATFORM_INDEX} template`);
      await createKibanaTemplate();
      context.wazuh.logger.info(`${PLUGIN_PLATFORM_INDEX} template created`);
      await createEmptyKibanaIndex();
    } catch (error) {
      throw new Error(
        `Error creating template for ${PLUGIN_PLATFORM_INDEX}: ${error.message}`,
      );
    }
  };

  const getTemplateByName = async () => {
    try {
      context.wazuh.logger.debug(
        `Getting ${WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME} template`,
      );
      await context.core.opensearch.client.asInternalUser.indices.getTemplate({
        name: WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME,
      });
      context.wazuh.logger.debug(
        `No need to create the ${PLUGIN_PLATFORM_INDEX} template, already exists.`,
      );
      await createEmptyKibanaIndex();
    } catch (error) {
      context.wazuh.logger.warn(error.message || error);
      return fixKibanaTemplate();
    }
  };

  // Does Kibana index exist?
  const checkKibanaStatus = async () => {
    try {
      context.wazuh.logger.debug(
        `Checking the existence of ${PLUGIN_PLATFORM_INDEX} index`,
      );
      const response =
        await context.core.opensearch.client.asInternalUser.indices.exists({
          index: PLUGIN_PLATFORM_INDEX,
        });
      if (response.body) {
        context.wazuh.logger.debug(`${PLUGIN_PLATFORM_INDEX} index exist`);
        // It exists, initialize!
        await init();
      } else {
        context.wazuh.logger.debug(
          `${PLUGIN_PLATFORM_INDEX} index does not exist`,
        );
        // No Kibana index created...
        context.wazuh.logger.info(`${PLUGIN_PLATFORM_INDEX} index not found`);
        await getTemplateByName();
      }
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
    }
  };

  // Wait until Elasticsearch js is ready
  const checkStatus = async () => {
    try {
      // TODO: wait until opensearch is ready?
      // await server.plugins.opensearch.waitUntilReady();
      return await checkKibanaStatus();
    } catch (error) {
      context.wazuh.logger.debug(
        'Waiting for opensearch plugin to be ready...',
      );
      setTimeout(() => checkStatus(), 3000);
    }
  };

  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  return checkStatus();
}
