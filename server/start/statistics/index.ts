/*
 * Wazuh app - Module for agent info fetching functions
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import cron from 'node-cron';
import { log } from '../../lib/logger';
import { statisticsTemplate } from '../../integration-files/statistics-template';
import { getConfiguration } from '../../lib/get-configuration';
import { parseCron } from '../../lib/parse-cron';
import { indexDate } from '../../lib/index-date';
import { buildIndexSettings } from '../../lib/build-index-settings';
import { WazuhHostsCtrl } from '../../controllers/wazuh-hosts';
import { 
  WAZUH_STATISTICS_PATTERN,
  WAZUH_INDEX_SHARDS,
  WAZUH_INDEX_REPLICAS,
  WAZUH_STATISTICS_TEMPLATE_NAME,
  WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
  WAZUH_STATISTICS_DEFAULT_CREATION,
  WAZUH_STATISTICS_DEFAULT_ENABLED,
  WAZUH_STATISTICS_DEFAULT_FREQUENCY,
} from '../../../common/constants';

const blueWazuh = '\u001b[34mwazuh\u001b[39m';
const statisticsErrorLogColors = [blueWazuh, 'statistics', 'error'];
const wazuhHostController = new WazuhHostsCtrl();

let STATISTICS_ENABLED, STATISTICS_FREQUENCY, STATISTICS_CRON_FREQ, STATISTICS_CREATION, STATISTICS_INDEX_PATTERN, STATISTICS_INDEX_PREFIX;

// Utils functions

/**
 * Delay as promise
 * @param timeMs
 */
function delay(timeMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

/**
 * Get the setting value from the configuration
 * @param setting
 * @param configuration
 * @param defaultValue
 */
function getAppConfigurationSetting(setting: string, configuration: any, defaultValue: any){
  return typeof configuration[setting] !== 'undefined' ? configuration[setting] : defaultValue;
};

/**
 * Set the statistics variables
 * @param context
 */
function initStatisticsConfiguration(context){
  try{
    const appConfig = getConfiguration();
    STATISTICS_ENABLED = appConfig && typeof appConfig['wazuh.statistics.enabled'] !== 'undefined'
      ? appConfig['wazuh.statistics.enabled'] &&
        appConfig['wazuh.statistics.enabled'] !== 'worker'
      : WAZUH_STATISTICS_DEFAULT_ENABLED;
    STATISTICS_FREQUENCY = getAppConfigurationSetting('wazuh.statistics.frequency', appConfig, WAZUH_STATISTICS_DEFAULT_FREQUENCY);
    STATISTICS_CRON_FREQ = parseCron(STATISTICS_FREQUENCY);
    STATISTICS_CREATION = getAppConfigurationSetting('wazuh.statistics.creation', appConfig, WAZUH_STATISTICS_DEFAULT_CREATION);

    STATISTICS_INDEX_PATTERN = getAppConfigurationSetting('wazuh.statistics.pattern', appConfig, WAZUH_STATISTICS_PATTERN);
    const lastCharIndexPattern = STATISTICS_INDEX_PATTERN[STATISTICS_INDEX_PATTERN.length - 1];
    if (lastCharIndexPattern !== '*') {
      STATISTICS_INDEX_PATTERN += '*';
    };
    STATISTICS_INDEX_PREFIX = STATISTICS_INDEX_PATTERN.slice(0,STATISTICS_INDEX_PATTERN.length - 1);

    log(
      'statistics:initStatisticsConfiguration',
      `wazuh.statistics.enabled: ${STATISTICS_ENABLED}`,
      'debug'
    );

    log(
      'statistics:initStatisticsConfiguration',
      `wazuh.statistics.frequency: ${STATISTICS_FREQUENCY} (${STATISTICS_CRON_FREQ})`,
      'debug'
    );

    log(
      'statistics:initStatisticsConfiguration',
      `wazuh.statistics.pattern: ${STATISTICS_INDEX_PATTERN} (index prefix: ${STATISTICS_INDEX_PREFIX})`,
      'debug'
    );
  }catch(error){
    const errorMessage = error.message || error;
    log(
      'statistics:initStatisticsConfiguration',
      errorMessage
    );
    context.wazuh.logger.error(errorMessage)
  }
};

/**
 * Main. First execution when installing / loading App.
 * @param context
 */
async function init(context) {
  try {
    if (STATISTICS_ENABLED) {
      await checkTemplate(context);
    };
  } catch (error) {
    const errorMessage = error.message || error;
    log('statistics:init', error.message || error);
    context.wazuh.logger.error(errorMessage);
  }
}

/**
 * Verify wazuh-agent template
 */
async function checkTemplate(context) {
  try {
    log(
      'statistics:checkTemplate',
      'Updating the statistics template',
      'debug'
    );

    try {
      // Check if the template already exists
      const currentTemplate = await context.core.elasticsearch.client.asInternalUser.indices.getTemplate({
        name: WAZUH_STATISTICS_TEMPLATE_NAME
      });
      // Copy already created index patterns
      statisticsTemplate.index_patterns = currentTemplate.body[WAZUH_STATISTICS_TEMPLATE_NAME].index_patterns;
    }catch (error) {
      // Init with the default index pattern
      statisticsTemplate.index_patterns = [WAZUH_STATISTICS_PATTERN];
    }

    // Check if the user is using a custom pattern and add it to the template if it does
    if (!statisticsTemplate.index_patterns.includes(STATISTICS_INDEX_PATTERN)) {
      statisticsTemplate.index_patterns.push(STATISTICS_INDEX_PATTERN);
    };

    // Update the statistics template
    await context.core.elasticsearch.client.asInternalUser.indices.putTemplate({
      name: WAZUH_STATISTICS_TEMPLATE_NAME,
      body: statisticsTemplate
    });
    log(
      'statistics:checkTemplate',
      'Updated the statistics template',
      'debug'
    );
  } catch (error) {
    const errorMessage = `Something went wrong updating the statistics template ${error.message || error}`;
    log(
      'statistics:checkTemplate',
      errorMessage
    );
    context.wazuh.logger.error(statisticsErrorLogColors, errorMessage);
    throw error;
  }
}

/**
* Wait until Kibana server is ready
*/
async function checkKibanaStatus(context) {
 try {
    log(
      'statistics:checkKibanaStatus',
      'Waiting for Kibana and Elasticsearch servers to be ready...',
      'debug'
    );

   await checkElasticsearchServer(context);
   await init(context);
   return;
 } catch (error) {
    log(
      'statistics:checkKibanaStatus',
      error.mesage ||error
    );
    try{
      await delay(3000);
      await checkKibanaStatus(context);
    }catch(error){};
 }
}


/**
 * Check Elasticsearch Server status and Kibana index presence
 */
async function checkElasticsearchServer(context) {
  try {
    const data = await context.core.elasticsearch.client.asInternalUser.indices.exists({
      index: context.server.config.kibana.index
    });

    return data.body;
    // TODO: check if Elasticsearch can receive requests
    // if (data) {
    //   const pluginsData = await this.server.plugins.elasticsearch.waitUntilReady();
    //   return pluginsData;
    // }
    return Promise.reject(data);
  } catch (error) {
    log('statistics:checkElasticsearchServer', error.message || error);
    return Promise.reject(error);
  }
}

const fakeResponseEndpoint = {
  ok: (body: any) => body,
  custom: (body: any) => body,
}
/**
 * Get API configuration from elastic and callback to loadCredentials
 */
async function getHostsConfiguration() {
  try {
    const hosts = await wazuhHostController.getHostsEntries(false, false, fakeResponseEndpoint);
    if (hosts.body.length) {
      return hosts.body;
    };

    log(
      'statistics:getConfig',
      'There are no Wazuh API entries yet',
      'debug'
    );
    return Promise.reject({
      error: 'no credentials',
      error_code: 1
    });
  } catch (error) {
    log('statistics:getHostsConfiguration', error.message || error);
    return Promise.reject({
      error: 'no wazuh hosts',
      error_code: 2
    });
  }
}
/**
 * Start the cron job
 */
export async function jobStatisticsRun(context) {
  // Init the statistics variables
  initStatisticsConfiguration(context);
  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  await checkKibanaStatus(context);
  // // Run the cron job only it it's enabled
  if (STATISTICS_ENABLED) {
    cron.schedule(STATISTICS_CRON_FREQ, () => (context));
  }
}


