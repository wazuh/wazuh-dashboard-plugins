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
import {
  WAZUH_PLUGIN_PLATFORM_TEMPLATE_NAME,
  PLUGIN_PLATFORM_NAME,
} from '../../../common/constants';
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
