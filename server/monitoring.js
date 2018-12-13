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
import { getConfiguration } from './lib/get-configuration';
import { parseCron } from './lib/parse-cron';
import { BuildBody } from './lib/replicas-shards-helper';
import * as ApiHelper from './lib/api-helper';

const blueWazuh = colors.blue('wazuh');

export class Monitoring {
  constructor(server, quiet = false) {
    this.server = server;
    this.ENABLED = true;
    this.FREQUENCY = 3600;
    this.CRON_FREQ = '0 1 * * * *';
    this.index_pattern = 'wazuh-monitoring-3.x-*';
    this.index_prefix = 'wazuh-monitoring-3.x-';
    this.wzWrapper = new ElasticWrapper(server);
    this.agentsArray = [];
    this.todayIndex =
      this.index_prefix +
      new Date()
        .toISOString()
        .replace(/T/, '-')
        .replace(/\..+/, '')
        .replace(/-/g, '.')
        .replace(/:/g, '')
        .slice(0, -7);
    this.initVariables();
    this.quiet = quiet;
  }

  initVariables() {
    try {
      const configFile = getConfiguration();

      this.ENABLED =
        configFile &&
        typeof configFile['wazuh.monitoring.enabled'] !== 'undefined'
          ? configFile['wazuh.monitoring.enabled'] &&
            configFile['wazuh.monitoring.enabled'] !== 'worker'
          : this.ENABLED;
      this.FREQUENCY =
        configFile &&
        typeof configFile['wazuh.monitoring.frequency'] !== 'undefined'
          ? configFile['wazuh.monitoring.frequency']
          : this.FREQUENCY;

      this.CRON_FREQ = parseCron(this.FREQUENCY);

      !this.quiet &&
        log(
          '[monitoring][configuration]',
          `wazuh.monitoring.enabled: ${this.ENABLED}`,
          'info'
        );

      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          `wazuh.monitoring.enabled: ${this.ENABLED}`
        );

      !this.quiet &&
        log(
          '[monitoring][configuration]',
          `wazuh.monitoring.frequency: ${this.FREQUENCY} (${this.CRON_FREQ}) `,
          'info'
        );

      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          `wazuh.monitoring.frequency: ${this.FREQUENCY} (${this.CRON_FREQ})`
        );
    } catch (error) {
      !this.quiet && log('[monitoring][configuration]', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }

  // Check status and get agent status array
  async checkStatus(api, maxSize) {
    try {
      if (!maxSize) {
        throw new Error('You must provide a max size');
      }

      const options = ApiHelper.buildOptionsObject(api);

      const payload = {
        offset: 0,
        limit: 500
      };

      this.agentsArray = ApiHelper.fetchAllAgents(
        api,
        maxSize,
        payload,
        options
      );

      await this.saveStatus(api.clusterName);

      return;
    } catch (error) {
      this.agentsArray = [];
      !this.quiet && log('[monitoring][checkStatus]', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }

  // Check API status twice and get agents total items
  async checkAndSaveStatus(api) {
    try {
      const payload = {
        offset: 0,
        limit: 1
      };

      const options = ApiHelper.buildOptionsObject(api);

      const response = await needle(
        'get',
        `${getPath(api)}/agents`,
        payload,
        options
      );

      const isCluster = await needle(
        'get',
        `${getPath(api)}/cluster/status`,
        {},
        options
      );

      const clusterName =
        isCluster &&
        isCluster.body &&
        isCluster.body.data &&
        isCluster.body.data.enabled === 'yes'
          ? await needle('get', `${getPath(api)}/cluster/node`, {}, options)
          : false;

      api.clusterName =
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
        await this.checkStatus(api, response.body.data.totalItems);
      } else {
        !this.quiet &&
          log(
            '[monitoring][checkAndSaveStatus]',
            'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.'
          );
        !this.quiet &&
          this.server.log(
            [blueWazuh, 'monitoring', 'error'],
            'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.'
          );
      }
      return;
    } catch (error) {
      !this.quiet &&
        log('[monitoring][checkAndSaveStatus]', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }
  // Load Wazuh API credentials from Elasticsearch document
  async loadCredentials(apiEntries) {
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

        await this.checkAndSaveStatus(apiEntry);
      }

      return { result: 'ok' };
    } catch (error) {
      !this.quiet &&
        log('[monitoring][loadCredentials]', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }

  // Get API configuration from elastic and callback to loadCredentials
  async getConfig() {
    try {
      const data = await this.wzWrapper.getWazuhAPIEntries();

      if (data.hits.total > 0) {
        return data.hits;
      }

      !this.quiet &&
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
      !this.quiet && log('[monitoring][getConfig]', error.message || error);
      return {
        error: 'no elasticsearch',
        error_code: 2
      };
    }
  }

  // fetchAgents on demand
  async fetchAgentsExternal() {
    try {
      const data = await this.getConfig();
      return this.loadCredentials(data);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Configure Kibana patterns.
  async configureKibana() {
    try {
      !this.quiet &&
        log(
          '[monitoring][configureKibana]',
          `Creating index pattern: ${this.index_pattern}`,
          'info'
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          `Creating index pattern: ${this.index_pattern}`
        );

      await this.wzWrapper.createMonitoringIndexPattern(this.index_pattern);

      !this.quiet &&
        log(
          '[monitoring][configureKibana]',
          `Created index pattern: ${this.index_pattern}`,
          'info'
        );
      this.server.log(
        [blueWazuh, 'monitoring', 'info'],
        `Created index pattern: ${this.index_pattern}`
      );

      return;
    } catch (error) {
      !this.quiet &&
        log('[monitoring][configureKibana]', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          'Error creating index-pattern due to ' + error
        );
    }
  }

  // Creating wazuh-monitoring index
  async createIndex(todayIndex, clusterName) {
    try {
      if (!this.ENABLED) return;
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

      await this.wzWrapper.createIndexByName(todayIndex, configuration);

      !this.quiet &&
        log(
          '[monitoring][createIndex]',
          'Successfully created today index.',
          'info'
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Successfully created today index.'
        );
      await this.insertDocument(todayIndex, clusterName);
      return;
    } catch (error) {
      !this.quiet &&
        log(
          '[monitoring][createIndex]',
          `Could not create ${todayIndex} index on elasticsearch due to ${error.message ||
            error}`
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          `Could not create ${todayIndex} index on elasticsearch due to ${error.message ||
            error}`
        );
    }
  }

  // Inserting one document per agent into Elastic. Bulk.
  async insertDocument(todayIndex, clusterName) {
    try {
      let body = '';
      if (this.agentsArray.length > 0) {
        for (const element of this.agentsArray) {
          body +=
            '{ "index":  { "_index": "' +
            todayIndex +
            '", "_type": "wazuh-agent" } }\n';
          let date = new Date(Date.now()).toISOString();
          element['@timestamp'] = date;
          element.host = element.manager;
          element.cluster = { name: clusterName ? clusterName : 'disabled' };
          body += JSON.stringify(element) + '\n';
        }
        if (body === '') return;

        await this.wzWrapper.pushBulkAnyIndex(todayIndex, body);

        this.agentsArray = [];
      }
      return;
    } catch (error) {
      !this.quiet &&
        log(
          '[monitoring][insertDocument]',
          `Error inserting agent data into elasticsearch. Bulk request failed due to ${error.message ||
            error}`
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          `Error inserting agent data into elasticsearch. Bulk request failed due to ${error.message ||
            error}`
        );
    }
  }

  // Save agent status into elasticsearch, create index and/or insert document
  async saveStatus(clusterName) {
    try {
      if (!this.ENABLED) return;

      this.todayIndex =
        this.index_prefix +
        new Date()
          .toISOString()
          .replace(/T/, '-')
          .replace(/\..+/, '')
          .replace(/-/g, '.')
          .replace(/:/g, '')
          .slice(0, -7);

      const result = await this.wzWrapper.checkIfIndexExists(this.todayIndex);

      if (result) {
        const configurationFile = getConfiguration();
        const shardConfiguration = BuildBody(
          configurationFile,
          'wazuh.monitoring',
          5,
          1
        );
        await this.wzWrapper.updateIndexSettings(
          this.todayIndex,
          shardConfiguration
        );
        await this.insertDocument(this.todayIndex, clusterName);
      } else {
        await this.createIndex(this.todayIndex, clusterName);
      }

      return;
    } catch (error) {
      !this.quiet &&
        log(
          '[monitoring][saveStatus]',
          `Could not check if the index ${
            this.todayIndex
          } exists due to ${error.message || error}`
        );
      this.server.log(
        [blueWazuh, 'monitoring', 'error'],
        `Could not check if the index ${
          this.todayIndex
        } exists due to ${error.message || error}`
      );
    }
  }

  async createWazuhMonitoring() {
    try {
      try {
        await this.wzWrapper.deleteMonitoring();

        !this.quiet &&
          log(
            '[monitoring][createWazuhMonitoring]',
            'Successfully deleted old wazuh-monitoring pattern.',
            'info'
          );
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Successfully deleted old wazuh-monitoring pattern.'
        );
      } catch (error) {
        !this.quiet &&
          log(
            '[monitoring][createWazuhMonitoring]',
            'No need to delete old wazuh-monitoring pattern.',
            'info'
          );
        !this.quiet &&
          this.server.log(
            [blueWazuh, 'monitoring', 'info'],
            'No need to delete  old wazuh-monitoring pattern.'
          );
      }

      await this.configureKibana();
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async checkTemplate() {
    try {
      !this.quiet &&
        log(
          '[monitoring][checkTemplate]',
          'Updating wazuh-monitoring template...',
          'info'
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Updating wazuh-monitoring template...'
        );
      await this.wzWrapper.putMonitoringTemplate(monitoringTemplate);
      return;
    } catch (error) {
      !this.quiet &&
        log(
          '[monitoring][checkTemplate]',
          `Something went wrong updating wazuh-monitoring template... ${error.message ||
            error}`
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          `Something went wrong updating wazuh-monitoring template... ${error.message ||
            error}`
        );
      return Promise.reject(error);
    }
  }

  // Main. First execution when installing / loading App.
  async init() {
    try {
      !this.quiet &&
        log(
          '[monitoring][init]',
          'Creating/Updating wazuh-agent template...',
          'info'
        );
      await this.checkTemplate();

      !this.quiet &&
        log('[monitoring][init]', 'Creating today index...', 'info');
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Creating today index...'
        );

      await this.saveStatus();

      const patternId = 'index-pattern:' + this.index_pattern;

      // Checks if wazuh-monitoring index pattern is already created, if it fails create it
      try {
        !this.quiet &&
          log(
            '[monitoring][init]',
            'Checking if wazuh-monitoring pattern exists...',
            'info'
          );
        !this.quiet &&
          this.server.log(
            [blueWazuh, 'monitoring', 'info'],
            'Checking if wazuh-monitoring pattern exists...'
          );
        await this.wzWrapper.getIndexPatternUsingGet(patternId);
        !this.quiet &&
          this.server.log(
            [blueWazuh, 'monitoring', 'info'],
            'Updating known fields for wazuh-monitoring pattern...'
          );
        !this.quiet &&
          log(
            '[monitoring][init]',
            'Updating known fields for wazuh-monitoring pattern...',
            'info'
          );
        await this.wzWrapper.updateMonitoringIndexPatternKnownFields(patternId);
      } catch (error) {
        !this.quiet &&
          log(
            '[monitoring][init]',
            "Didn't find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...",
            'info'
          );
        !this.quiet &&
          this.server.log(
            [blueWazuh, 'monitoring', 'info'],
            "Didn't find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it..."
          );
        return this.createWazuhMonitoring();
      }

      !this.quiet &&
        log(
          '[monitoring][init]',
          'Skipping wazuh-monitoring pattern creation. Already exists.',
          'info'
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Skipping wazuh-monitoring creation. Already exists.'
        );

      return;
    } catch (error) {
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
      !this.quiet && log('[monitoring][init]', error.message || error);
      return;
    }
  }

  // Check Elasticsearch Server status and Kibana index presence
  async checkElasticsearchServer() {
    try {
      const data = await this.wzWrapper.checkIfIndexExists(
        this.wzWrapper.WZ_KIBANA_INDEX
      );

      if (data) {
        const pluginsData = await this.server.plugins.elasticsearch.waitUntilReady();
        return pluginsData;
      }
      return Promise.reject(data);
    } catch (error) {
      !this.quiet &&
        log('[monitoring][checkElasticsearchServer]', error.message || error);
      return Promise.reject(error);
    }
  }

  // Wait until Kibana server is ready
  async checkKibanaStatus() {
    try {
      !this.quiet &&
        log(
          '[monitoring][checkKibanaStatus]',
          'Waiting for Kibana and Elasticsearch servers to be ready...',
          'info'
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Waiting for Kibana and Elasticsearch servers to be ready...'
        );
      await this.checkElasticsearchServer();
      await this.init();
      return;
    } catch (error) {
      !this.quiet &&
        log(
          '[monitoring][checkKibanaStatus]',
          'Waiting for Kibana and Elasticsearch servers to be ready...',
          'info'
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'info'],
          'Waiting for Kibana and Elasticsearch servers to be ready...',
          'info'
        );
      setTimeout(() => this.checkKibanaStatus(), 3000);
    }
  }

  async cronTask() {
    try {
      const template = await this.wzWrapper.getTemplateByName('wazuh-agent');

      // Prevents to insert monitoring indices without the proper template inserted
      if (
        typeof template === 'object' &&
        typeof template['wazuh-agent'] !== 'undefined' &&
        typeof template['wazuh-agent'].index_patterns !== 'undefined'
      ) {
        this.agentsArray = [];
        const data = await this.getConfig();
        await this.loadCredentials(data);
      } else {
        !this.quiet &&
          log(
            '[monitoring][cronTask]',
            'No wazuh-agent template found, not inserting monitoring data',
            'info'
          );
        !this.quiet &&
          this.server.log(
            [blueWazuh, 'monitoring [cronTask]', 'info'],
            'No wazuh-agent template found, not inserting monitoring data'
          );
      }

      return;
    } catch (error) {
      !this.quiet && log('[monitoring][cronTask]', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring [cronTask]', 'error'],
          error.message || error
        );
    }
  }

  run() {
    // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
    this.checkKibanaStatus();

    // Run the cron job only it it's enabled
    if (this.ENABLED) {
      this.cronTask();
      cron.schedule(this.CRON_FREQ, () => this.cronTask(), true);
    }
  }
}
