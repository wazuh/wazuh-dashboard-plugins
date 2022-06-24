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
import { log } from '../../lib/logger';
import packageJSON from '../../../package.json';
import { pluginPlatformTemplate } from '../../integration-files/kibana-template';
import { getConfiguration } from '../../lib/get-configuration';
import { totalmem } from 'os';
import fs from 'fs';
import { ManageHosts } from '../../lib/manage-hosts';
import { WAZUH_ALERTS_PATTERN, WAZUH_DATA_CONFIG_REGISTRY_PATH, WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME, WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH, PLUGIN_PLATFORM_NAME, PLUGIN_PLATFORM_INSTALLATION_USER_GROUP, PLUGIN_PLATFORM_INSTALLATION_USER } from '../../../common/constants';
import { createDataDirectoryIfNotExists } from '../../lib/filesystem';

const manageHosts = new ManageHosts();

export function jobInitializeRun(context) {
  const PLUGIN_PLATFORM_INDEX = context.server.config.kibana.index;
  log('initialize', `${PLUGIN_PLATFORM_NAME} index: ${PLUGIN_PLATFORM_INDEX}`, 'info');
  log('initialize', `App revision: ${packageJSON.revision}`, 'info');

  let configurationFile = {};
  let pattern = null;
  // Read config from package.json and wazuh.yml
  try {
    configurationFile = getConfiguration();

    pattern =
      configurationFile && typeof configurationFile.pattern !== 'undefined'
        ? configurationFile.pattern
        : WAZUH_ALERTS_PATTERN;
    // global.XPACK_RBAC_ENABLED =
    //   configurationFile &&
    //     typeof configurationFile['xpack.rbac.enabled'] !== 'undefined'
    //     ? configurationFile['xpack.rbac.enabled']
    //     : true;
  } catch (error) {
    log('initialize', error.message || error);
    context.wazuh.logger.error(
      'Something went wrong while reading the configuration.' + (error.message || error)
    );
  }

  try {
    // RAM in MB
    const ram = Math.ceil(totalmem() / 1024 / 1024);
    log('initialize', `Total RAM: ${ram}MB`, 'info');
  } catch (error) {
    log(
      'initialize',
      `Could not check total RAM due to: ${error.message || error}`
    );
  }

  // Save Wazuh App setup
  const saveConfiguration = async () => {
    try {
      const commonDate = new Date().toISOString();

      const configuration = {
        name: 'Wazuh App',
        'app-version': packageJSON.version,
        revision: packageJSON.revision,
        installationDate: commonDate,
        lastRestart: commonDate,
        hosts: {}
      };
      try {
        createDataDirectoryIfNotExists();
        createDataDirectoryIfNotExists('config');
        await fs.writeFileSync(WAZUH_DATA_CONFIG_REGISTRY_PATH, JSON.stringify(configuration), 'utf8');
        log(
          'initialize:saveConfiguration',
          'Wazuh configuration registry inserted',
          'debug'
        );
      } catch (error) {
        log('initialize:saveConfiguration', error.message || error);
        context.wazuh.logger.error(
          'Could not create Wazuh configuration registry'
        );
      }
    } catch (error) {
      log('initialize:saveConfiguration', error.message || error);
      context.wazuh.logger.error(
        'Error creating wazuh-version registry'
      );
    }
  };

  /**
   * Checks if the .wazuh-version exists, in this case it will be deleted and the wazuh-registry.json will be created
   */
  const checkWazuhRegistry = async () => {
    try {
      log(
        'initialize:checkwazuhRegistry',
        'Checking wazuh-version registry.',
        'debug'
      );

      if(!fs.existsSync(WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH)){
        throw new Error(`The data directory is missing in the ${PLUGIN_PLATFORM_NAME} root instalation. Create the directory in ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH} and give it the required permissions (sudo mkdir ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH};sudo chown -R ${PLUGIN_PLATFORM_INSTALLATION_USER}:${PLUGIN_PLATFORM_INSTALLATION_USER_GROUP} ${WAZUH_DATA_PLUGIN_PLATFORM_BASE_ABSOLUTE_PATH}). After restart the ${PLUGIN_PLATFORM_NAME} service.`);
      };

      if (!fs.existsSync(WAZUH_DATA_CONFIG_REGISTRY_PATH)) {
        log(
          'initialize:checkwazuhRegistry',
          'wazuh-version registry does not exist. Initializing configuration.',
          'debug'
        );

        // Create the app registry file for the very first time
        await saveConfiguration();
      } else {
        // If this function fails, it throws an exception
        const source = JSON.parse(fs.readFileSync(WAZUH_DATA_CONFIG_REGISTRY_PATH, 'utf8'));

        // Check if the stored revision differs from the package.json revision
        const isUpgradedApp = packageJSON.revision !== source.revision || packageJSON.version !== source['app-version'];

        // Rebuild the registry file if revision or version fields are differents
        if (isUpgradedApp) { 
          log(
            'initialize:checkwazuhRegistry',
            'Wazuh app revision or version changed, regenerating wazuh-version registry',
            'info'
          );
          // Rebuild registry file in blank
          await saveConfiguration();
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Init function. Check for "wazuh-version" document existance.
  const init = async () => {
    await checkWazuhRegistry();
  };

  const createKibanaTemplate = () => {
    log(
      'initialize:createKibanaTemplate',
      `Creating template for ${PLUGIN_PLATFORM_INDEX}`,
      'debug'
    );

    try {
      pluginPlatformTemplate.template = PLUGIN_PLATFORM_INDEX + '*';
    } catch (error) {
      log('initialize:createKibanaTemplate', error.message || error);
      context.wazuh.logger.error(
        'Exception: ' + error.message || error
      );
    }

    return context.core.elasticsearch.client.asInternalUser.indices.putTemplate({
      name: WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME,
      order: 0,
      create: true,
      body: pluginPlatformTemplate
    });
  };

  const createEmptyKibanaIndex = async () => {
    try {
      log(
        'initialize:createEmptyKibanaIndex',
        `Creating ${PLUGIN_PLATFORM_INDEX} index.`,
        'info'
      );
      await context.core.elasticsearch.client.asInternalUser.indices.create({
        index: PLUGIN_PLATFORM_INDEX
      });
      log(
        'initialize:createEmptyKibanaIndex',
        `Successfully created ${PLUGIN_PLATFORM_INDEX} index.`,
        'debug'
      );
      await init();
      return;
    } catch (error) {
      return Promise.reject(
        new Error(
          `Error creating ${
          PLUGIN_PLATFORM_INDEX
          } index due to ${error.message || error}`
        )
      );
    }
  };

  const fixKibanaTemplate = async () => {
    try {
      await createKibanaTemplate();
      log(
        'initialize:fixKibanaTemplate',
        `Successfully created ${PLUGIN_PLATFORM_INDEX} template.`,
        'debug'
      );
      await createEmptyKibanaIndex();
      return;
    } catch (error) {
      return Promise.reject(
        new Error(
          `Error creating template for ${
          PLUGIN_PLATFORM_INDEX
          } due to ${error.message || error}`
        )
      );
    }
  };

  const getTemplateByName = async () => {
    try {
      await context.core.elasticsearch.client.asInternalUser.indices.getTemplate({
        name: WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME
      });
      log(
        'initialize:getTemplateByName',
        `No need to create the ${PLUGIN_PLATFORM_INDEX} template, already exists.`,
        'debug'
      );
      await createEmptyKibanaIndex();
      return;
    } catch (error) {
      log('initialize:getTemplateByName', error.message || error);
      return fixKibanaTemplate();
    }
  };

  // Does Kibana index exist?
  const checkKibanaStatus = async () => {
    try {
      const response = await context.core.elasticsearch.client.asInternalUser.indices.exists({
        index: PLUGIN_PLATFORM_INDEX
      });
      if (response.body) {
        // It exists, initialize!
        await init();
      } else {
        // No Kibana index created...
        log(
          'initialize:checkKibanaStatus',
          `Not found ${PLUGIN_PLATFORM_INDEX} index`,
          'info'
        );
        await getTemplateByName();
      }
    } catch (error) {
      log('initialize:checkKibanaStatus', error.message || error);
      context.wazuh.logger.error(error.message || error);
    }
  };

  // Wait until Elasticsearch js is ready
  const checkStatus = async () => {
    try {
      // TODO: wait until elasticsearch is ready?
      // await server.plugins.elasticsearch.waitUntilReady();
      return await checkKibanaStatus();
    } catch (error) {
      log(
        'initialize:checkStatus',
        'Waiting for elasticsearch plugin to be ready...',
        'debug'
      );
      setTimeout(() => checkStatus(), 3000);
    }
  };

  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  return checkStatus();
}
