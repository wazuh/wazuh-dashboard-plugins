/*
 * Wazuh app - Module for agent info fetching functions
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import cron from 'node-cron';
import needle from 'needle';
import { getPath } from '../util/get-path';
import colors from 'ansicolors';
import { log } from './logger';
import { ElasticWrapper } from './lib/elastic-wrapper';
import { monitoringTemplate } from './integration-files/monitoring-template';
import packageJSON from '../package.json';
import { getConfiguration } from './lib/get-configuration';
import { parseCron } from './lib/parse-cron';
import { BuildBody } from './lib/replicas-shards-helper';

export function Monitoring(server, options) {
  const blueWazuh = colors.blue('wazuh');

  let ENABLED = true;
  let FREQUENCY = 3600;
  let CRON_FREQ = '0 1 * * * *';
  try {
    const configFile = getConfiguration();

    ENABLED =
      configFile &&
      typeof configFile['wazuh.monitoring.enabled'] !== 'undefined'
        ? configFile['wazuh.monitoring.enabled'] &&
          configFile['wazuh.monitoring.enabled'] !== 'worker'
        : ENABLED;
    FREQUENCY =
      configFile &&
      typeof configFile['wazuh.monitoring.frequency'] !== 'undefined'
        ? configFile['wazuh.monitoring.frequency']
        : FREQUENCY;

    CRON_FREQ = parseCron(FREQUENCY);

    !options &&
      log(
        '[monitoring][configuration]',
        `wazuh.monitoring.enabled: ${ENABLED}`,
        'info'
      );
    !options &&
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        `wazuh.monitoring.enabled: ${ENABLED}`
      );

    !options &&
      log(
        '[monitoring][configuration]',
        `wazuh.monitoring.frequency: ${FREQUENCY} (${CRON_FREQ}) `,
        'info'
      );
    !options &&
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        `wazuh.monitoring.frequency: ${FREQUENCY} (${CRON_FREQ})`
      );
  } catch (error) {
    log('[monitoring][configuration]', error.message || error);
    server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
  }

  const index_pattern = 'wazuh-monitoring-3.x-*';
  const index_prefix = 'wazuh-monitoring-3.x-';

  // Elastic JS Client
  const wzWrapper = new ElasticWrapper(server);

  // Initialize
  let agentsArray = [];

  let fDate = new Date()
    .toISOString()
    .replace(/T/, '-')
    .replace(/\..+/, '')
    .replace(/-/g, '.')
    .replace(/:/g, '')
    .slice(0, -7);
  let todayIndex = index_prefix + fDate;

  // Check status and get agent status array
  const checkStatus = async (apiEntry, maxSize) => {
    try {
      if (!maxSize) {
        throw new Error('You must provide a max size');
      }

      const payload = {
        offset: 0,
        limit: 500
      };

      const options = {
        headers: {
          'wazuh-app-version': packageJSON.version
        },
        username: apiEntry.user,
        password: apiEntry.password,
        rejectUnauthorized: !apiEntry.insecure
      };

      while (agentsArray.length < maxSize) {
        const response = await needle(
          'get',
          `${getPath(apiEntry)}/agents`,
          payload,
          options
        );
        if (!response.error && response.body.data.items) {
          agentsArray = agentsArray.concat(response.body.data.items);
          payload.offset += payload.limit;
        } else {
          throw new Error('Can not access Wazuh API');
        }
      }

      await saveStatus(apiEntry.clusterName);

      return;
    } catch (error) {
      agentsArray.length = 0;
      log('[monitoring][checkStatus]', error.message || error);
      server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
    }
  };

  // Check API status twice and get agents total items
  const checkAndSaveStatus = async apiEntry => {
    try {
      const payload = {
        offset: 0,
        limit: 1
      };

      const options = {
        headers: {
          'wazuh-app-version': packageJSON.version
        },
        username: apiEntry.user,
        password: apiEntry.password,
        rejectUnauthorized: !apiEntry.insecure
      };

      const response = await needle(
        'get',
        `${getPath(apiEntry)}/agents`,
        payload,
        options
      );

      const isCluster = await needle(
        'get',
        `${getPath(apiEntry)}/cluster/status`,
        {},
        options
      );
      const clusterName =
        isCluster &&
        isCluster.body &&
        isCluster.body.data &&
        isCluster.body.data.enabled === 'yes'
          ? await needle(
              'get',
              `${getPath(apiEntry)}/cluster/node`,
              {},
              options
            )
          : false;

      apiEntry.clusterName =
        clusterName &&
        clusterName.body &&
        clusterName.body.data &&
        clusterName.body.data.cluster
          ? clusterName.body.data.cluster
          : false;

      if (
        !response.error &&
        response.body.data &&
        response.body.data.totalItems
      ) {
        await checkStatus(apiEntry, response.body.data.totalItems);
      } else {
        log(
          '[monitoring][checkAndSaveStatus]',
          'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.'
        );
        server.log(
          [blueWazuh, 'monitoring', 'error'],
          'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.'
        );
      }
      return;
    } catch (error) {
      log('[monitoring][checkAndSaveStatus]', error.message || error);
      server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
    }
  };

  // Load Wazuh API credentials from Elasticsearch document
  const loadCredentials = async apiEntries => {
    try {
      if (typeof apiEntries === 'undefined' || !('hits' in apiEntries)) return;

      const filteredApis = apiEntries.hits.filter(
        (element, index, self) =>
          index ===
          self.findIndex(
            t =>
              t._source.api_user === element._source.api_user &&
              t._source.api_password === element._source.api_password &&
              t._source.url === element._source.url &&
              t._source.api_port === element._source.api_port
          )
      );

      for (const element of filteredApis) {
        const apiEntry = {
          user: element._source.api_user,
          password: Buffer.from(
            element._source.api_password,
            'base64'
          ).toString('ascii'),
          url: element._source.url,
          port: element._source.api_port,
          insecure: element._source.insecure
        };

        await checkAndSaveStatus(apiEntry);
      }

      return { result: 'ok' };
    } catch (error) {
      log('[monitoring][loadCredentials]', error.message || error);
      server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
    }
  };

  // Get API configuration from elastic and callback to loadCredentials
  const getConfig = async () => {
    try {
      const data = await wzWrapper.getWazuhAPIEntries();

      if (data.hits.total > 0) {
        return data.hits;
      }

      log(
        '[monitoring][getConfig]',
        'There is no Wazuh API entries yet',
        'info'
      );
      return {
        error: 'no credentials',
        error_code: 1
      };
    } catch (error) {
      log('[monitoring][getConfig]', error.message || error);
      return {
        error: 'no elasticsearch',
        error_code: 2
      };
    }
  };

  // fetchAgents on demand
  const fetchAgentsExternal = async () => {
    try {
      const data = await getConfig();
      return loadCredentials(data);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  // Configure Kibana patterns.
  const configureKibana = async () => {
    try {
      log(
        '[monitoring][configureKibana]',
        `Creating index pattern: ${index_pattern}`,
        'info'
      );
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        `Creating index pattern: ${index_pattern}`
      );

      await wzWrapper.createMonitoringIndexPattern(index_pattern);

      log(
        '[monitoring][configureKibana]',
        `Created index pattern: ${index_pattern}`,
        'info'
      );
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        `Created index pattern: ${index_pattern}`
      );

      return;
    } catch (error) {
      log('[monitoring][configureKibana]', error.message || error);
      server.log(
        [blueWazuh, 'monitoring', 'error'],
        'Error creating index-pattern due to ' + error
      );
    }
  };

  // Creating wazuh-monitoring index
  const createIndex = async (todayIndex, clusterName) => {
    try {
      if (!ENABLED) return;
      const configFile = getConfiguration();

      const shards =
        configFile &&
        typeof configFile['wazuh.monitoring.shards'] !== 'undefined'
          ? configFile['wazuh.monitoring.shards']
          : 5;

      const replicas =
        configFile &&
        typeof configFile['wazuh.monitoring.replicas'] !== 'undefined'
          ? configFile['wazuh.monitoring.replicas']
          : 1;

      const configuration = {
        settings: {
          index: {
            number_of_shards: shards,
            number_of_replicas: replicas
          }
        }
      };

      await wzWrapper.createIndexByName(todayIndex, configuration);

      log(
        '[monitoring][createIndex]',
        'Successfully created today index.',
        'info'
      );
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        'Successfully created today index.'
      );
      await insertDocument(todayIndex, clusterName);
      return;
    } catch (error) {
      log(
        '[monitoring][createIndex]',
        `Could not create ${todayIndex} index on elasticsearch due to ${error.message ||
          error}`
      );
      server.log(
        [blueWazuh, 'monitoring', 'error'],
        `Could not create ${todayIndex} index on elasticsearch due to ${error.message ||
          error}`
      );
    }
  };

  // Inserting one document per agent into Elastic. Bulk.
  const insertDocument = async (todayIndex, clusterName) => {
    try {
      let body = '';
      if (agentsArray.length > 0) {
        const managerName = agentsArray[0].name;
        for (let element of agentsArray) {
          body +=
            '{ "index":  { "_index": "' +
            todayIndex +
            '", "_type": "wazuh-agent" } }\n';
          let date = new Date(Date.now()).toISOString();
          element['@timestamp'] = date;
          element.host = managerName;
          element.cluster = { name: clusterName ? clusterName : 'disabled' };
          body += JSON.stringify(element) + '\n';
        }
        if (body === '') return;

        await wzWrapper.pushBulkAnyIndex(todayIndex, body);

        agentsArray.length = 0;
      }
      return;
    } catch (error) {
      log(
        '[monitoring][insertDocument]',
        `Error inserting agent data into elasticsearch. Bulk request failed due to ${error.message ||
          error}`
      );
      server.log(
        [blueWazuh, 'monitoring', 'error'],
        `Error inserting agent data into elasticsearch. Bulk request failed due to ${error.message ||
          error}`
      );
    }
  };

  // Save agent status into elasticsearch, create index and/or insert document
  const saveStatus = async clusterName => {
    try {
      if (!ENABLED) return;
      fDate = new Date()
        .toISOString()
        .replace(/T/, '-')
        .replace(/\..+/, '')
        .replace(/-/g, '.')
        .replace(/:/g, '')
        .slice(0, -7);
      todayIndex = index_prefix + fDate;

      const result = await wzWrapper.checkIfIndexExists(todayIndex);

      if (result) {
        const configurationFile = getConfiguration();
        const shardConfiguration = BuildBody(
          configurationFile,
          'wazuh.monitoring',
          5,
          1
        );
        await wzWrapper.updateIndexSettings(todayIndex, shardConfiguration);
        await insertDocument(todayIndex, clusterName);
      } else {
        await createIndex(todayIndex, clusterName);
      }

      return;
    } catch (error) {
      log(
        '[monitoring][saveStatus]',
        `Could not check if the index ${todayIndex} exists due to ${error.message ||
          error}`
      );
      server.log(
        [blueWazuh, 'monitoring', 'error'],
        `Could not check if the index ${todayIndex} exists due to ${error.message ||
          error}`
      );
    }
  };

  const createWazuhMonitoring = async () => {
    try {
      try {
        await wzWrapper.deleteMonitoring();

        log(
          '[monitoring][createWazuhMonitoring]',
          'Successfully deleted old wazuh-monitoring pattern.',
          'info'
        );
        server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Successfully deleted old wazuh-monitoring pattern.'
        );
      } catch (error) {
        log(
          '[monitoring][createWazuhMonitoring]',
          'No need to delete old wazuh-monitoring pattern.',
          'info'
        );
        server.log(
          [blueWazuh, 'monitoring', 'info'],
          'No need to delete  old wazuh-monitoring pattern.'
        );
      }

      await configureKibana();
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const checkTemplate = async () => {
    try {
      log(
        '[monitoring][checkTemplate]',
        'Updating wazuh-monitoring template...',
        'info'
      );
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        'Updating wazuh-monitoring template...'
      );
      await wzWrapper.putMonitoringTemplate(monitoringTemplate);
      return;
    } catch (error) {
      log(
        '[monitoring][checkTemplate]',
        `Something went wrong updating wazuh-monitoring template... ${error.message ||
          error}`
      );
      server.log(
        [blueWazuh, 'monitoring', 'error'],
        `Something went wrong updating wazuh-monitoring template... ${error.message ||
          error}`
      );
      return Promise.reject(error);
    }
  };

  // Main. First execution when installing / loading App.
  const init = async () => {
    try {
      log(
        '[monitoring][init]',
        'Creating/Updating wazuh-agent template...',
        'info'
      );
      await checkTemplate();

      log('[monitoring][init]', 'Creating today index...', 'info');
      server.log([blueWazuh, 'monitoring', 'info'], 'Creating today index...');

      await saveStatus();

      const patternId = 'index-pattern:' + index_pattern;

      // Checks if wazuh-monitoring index pattern is already created, if it fails create it
      try {
        log(
          '[monitoring][init]',
          'Checking if wazuh-monitoring pattern exists...',
          'info'
        );
        server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Checking if wazuh-monitoring pattern exists...'
        );
        await wzWrapper.getIndexPatternUsingGet(patternId);
      } catch (error) {
        log(
          '[monitoring][init]',
          "Didn't find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...",
          'info'
        );
        server.log(
          [blueWazuh, 'monitoring', 'info'],
          "Didn't find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it..."
        );
        return createWazuhMonitoring();
      }

      log(
        '[monitoring][init]',
        'Skipping wazuh-monitoring pattern creation. Already exists.',
        'info'
      );
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        'Skipping wazuh-monitoring creation. Already exists.'
      );

      return;
    } catch (error) {
      server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
      log('[monitoring][init]', error.message || error);
      return;
    }
  };

  // Check Elasticsearch Server status and Kibana index presence
  const checkElasticsearchServer = async () => {
    try {
      const data = await wzWrapper.checkIfIndexExists(
        wzWrapper.WZ_KIBANA_INDEX
      );

      if (data) {
        const pluginsData = await server.plugins.elasticsearch.waitUntilReady();
        return pluginsData;
      }
      return Promise.reject(data);
    } catch (error) {
      log('[monitoring][checkElasticsearchServer]', error.message || error);
      return Promise.reject(error);
    }
  };

  // Wait until Kibana server is ready
  const checkKibanaStatus = async () => {
    try {
      log(
        '[monitoring][checkKibanaStatus]',
        'Waiting for Kibana and Elasticsearch servers to be ready...',
        'info'
      );
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        'Waiting for Kibana and Elasticsearch servers to be ready...'
      );
      await checkElasticsearchServer();
      await init();
      return;
    } catch (error) {
      log(
        '[monitoring][checkKibanaStatus]',
        'Waiting for Kibana and Elasticsearch servers to be ready...',
        'info'
      );
      server.log(
        [blueWazuh, 'monitoring', 'info'],
        'Waiting for Kibana and Elasticsearch servers to be ready...',
        'info'
      );
      setTimeout(() => checkKibanaStatus(), 3000);
    }
  };

  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  if (!options) checkKibanaStatus();

  const cronTask = async () => {
    try {
      const template = await wzWrapper.getTemplateByName('wazuh-agent');

      // Prevents to insert monitoring indices without the proper template inserted
      if (
        typeof template === 'object' &&
        typeof template['wazuh-agent'] !== 'undefined' &&
        typeof template['wazuh-agent'].index_patterns !== 'undefined'
      ) {
        agentsArray = [];
        const data = await getConfig();
        await loadCredentials(data);
      } else {
        log(
          '[monitoring][cronTask]',
          'No wazuh-agent template found, not inserting monitoring data',
          'info'
        );
        server.log(
          [blueWazuh, 'monitoring [cronTask]', 'info'],
          'No wazuh-agent template found, not inserting monitoring data'
        );
      }

      return;
    } catch (error) {
      log('[monitoring][cronTask]', error.message || error);
      server.log(
        [blueWazuh, 'monitoring [cronTask]', 'error'],
        error.message || error
      );
    }
  };
  if (!options && ENABLED) cronTask();
  // Cron tab for getting agent status.
  if (!options && ENABLED) cron.schedule(CRON_FREQ, cronTask, true);
  return fetchAgentsExternal;
}
