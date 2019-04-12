/*
 * Wazuh app - Module for agent info fetching functions
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import { indexDate } from './lib/index-date';
import { BuildBody } from './lib/replicas-shards-helper';
import * as ApiHelper from './lib/api-helper';

const blueWazuh = colors.blue('wazuh');

export class Monitoring {
  /**
   * @param {Object} server Hapi.js server object provided by Kibana
   * @param {Boolean} quite Boolean value used to show/don't show logs and stdout messages
   */
  constructor(server, quiet = false) {
    this.server = server;
    this.ENABLED = true;
    this.FREQUENCY = 900;
    this.CRON_FREQ = '0 1 * * * *';
    this.CREATION = 'd';
    this.index_pattern = 'wazuh-monitoring-3.x-*';
    this.index_prefix = 'wazuh-monitoring-3.x-';
    this.wzWrapper = new ElasticWrapper(server);
    this.agentsArray = [];
    this.quiet = quiet;
    this.initVariables();
  }

  /**
   * Fill the value of ENABLED, FREQUENCY and CRON_FREQ depending on the user configuration.
   */
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
        (configFile || {})['wazuh.monitoring.frequency'] || this.FREQUENCY;

      this.CRON_FREQ = parseCron(this.FREQUENCY);

      this.CREATION =
        (configFile || {})['wazuh.monitoring.creation'] || this.CREATION;

      this.datedIndex = this.index_prefix + indexDate(this.CREATION);

      this.index_pattern =
        (configFile || {})['wazuh.monitoring.pattern'] || this.index_pattern;

      const lastCharFromPattern = this.index_pattern[
        this.index_pattern.length - 1
      ];
      if (lastCharFromPattern !== '*') {
        this.index_pattern += '*';
      }
      this.index_prefix = this.index_pattern.slice(
        0,
        this.index_pattern.length - 1
      );

      !this.quiet &&
        log(
          'monitoring:configuration',
          `wazuh.monitoring.enabled: ${this.ENABLED}`,
          'debug'
        );

      !this.quiet &&
        log(
          'monitoring:configuration',
          `wazuh.monitoring.frequency: ${this.FREQUENCY} (${this.CRON_FREQ}) `,
          'debug'
        );

      !this.quiet &&
        log(
          'monitoring:configuration',
          `wazuh.monitoring.pattern: ${this.index_pattern} (index prefix: ${
            this.index_prefix
          })`,
          'debug'
        );
    } catch (error) {
      !this.quiet && log('monitoring:configuration', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }

  /**
   * Check status and get agent status array
   * @param {Object} api Wazuh API entry from Elasticsearch.
   * @param {Number} maxSize Fetching agent purposes.
   */
  async checkStatus(api, maxSize) {
    try {
      if (!maxSize) {
        throw new Error('You must provide a max size');
      }

      const options = ApiHelper.buildOptionsObject(api);

      const payload = {
        offset: 0,
        limit: 500,
        q: 'id!=000'
      };

      this.agentsArray = await ApiHelper.fetchAllAgents(
        api,
        maxSize,
        payload,
        options
      );

      await this.saveStatus(api.clusterName);

      return;
    } catch (error) {
      this.agentsArray = [];
      !this.quiet && log('monitoring:checkStatus', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }

  /**
   * Check API status twice and get agents total items
   * @param {Object} api Wazuh API entry from Elasticsearch.
   */
  async checkAndSaveStatus(api) {
    try {
      const payload = {
        offset: 0,
        limit: 1,
        q: 'id!=000'
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
        (((isCluster || {}).body || {}).data || {}).enabled === 'yes'
          ? await needle('get', `${getPath(api)}/cluster/node`, {}, options)
          : false;

      api.clusterName =
        (((clusterName || {}).body || {}).data || {}).cluster || false;

      if (!response.error && ((response.body || {}).data || {}).totalItems) {
        await this.checkStatus(api, response.body.data.totalItems);
      } else if ((response || {}).error) {
        const msg = ((response || {}).body || {}).message || false;
        const extraLog =
          msg ||
          'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.';

        !this.quiet && log('monitoring:checkAndSaveStatus', extraLog);
        !this.quiet &&
          this.server.log([blueWazuh, 'monitoring', 'error'], extraLog);
      }
      return;
    } catch (error) {
      !this.quiet &&
        log('monitoring:checkAndSaveStatus', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }

  /**
   * Iterates over all the Wazuh API entries, then it sends each API entry to the fetching function.
   * @param {Array<Object>} apiEntries List of Wazuh API entries from Elasticsearch.
   */
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
      !this.quiet && log('monitoring:loadCredentials', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
    }
  }

  /**
   * Get API configuration from elastic and callback to loadCredentials
   */
  async getConfig() {
    try {
      const data = await this.wzWrapper.getWazuhAPIEntries();

      if (data.hits.total > 0) {
        return data.hits;
      }

      !this.quiet &&
        log(
          'monitoring:getConfig',
          'There are no Wazuh API entries yet',
          'debug'
        );
      return {
        error: 'no credentials',
        error_code: 1
      };
    } catch (error) {
      !this.quiet && log('monitoring:getConfig', error.message || error);
      return {
        error: 'no elasticsearch',
        error_code: 2
      };
    }
  }

  /**
   * Fetch agents on demand
   */
  async fetchAgentsExternal() {
    try {
      const data = await this.getConfig();
      return this.loadCredentials(data);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Configure Kibana patterns
   */
  async configureKibana() {
    try {
      !this.quiet &&
        log(
          'monitoring:configureKibana',
          `Creating index pattern: ${this.index_pattern}`,
          'debug'
        );

      await this.wzWrapper.createMonitoringIndexPattern(this.index_pattern);

      !this.quiet &&
        log(
          'monitoring:configureKibana',
          `Created index pattern: ${this.index_pattern}`,
          'info'
        );

      return;
    } catch (error) {
      !this.quiet && log('monitoring:configureKibana', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          'Error creating index-pattern due to ' + error
        );
    }
  }

  /**
   * Creating wazuh-monitoring index
   * @param {String} datedIndex The name for the index (e.g. daily: wazuh-monitoring-3.x-YYYY.MM.DD)
   * @param {String} clusterName Wazuh cluster name.
   */
  async createIndex(datedIndex, clusterName) {
    try {
      if (!this.ENABLED) return;
      const configFile = getConfiguration();

      const shards =
        typeof (configFile || {})['wazuh.monitoring.shards'] !== 'undefined'
          ? configFile['wazuh.monitoring.shards']
          : 2;

      const replicas =
        typeof (configFile || {})['wazuh.monitoring.replicas'] !== 'undefined'
          ? configFile['wazuh.monitoring.replicas']
          : 0;

      const configuration = {
        settings: {
          index: {
            number_of_shards: shards,
            number_of_replicas: replicas
          }
        }
      };

      await this.wzWrapper.createIndexByName(datedIndex, configuration);

      !this.quiet &&
        log(
          'monitoring:createIndex',
          'Successfully created new index.',
          'debug'
        );

      await this.insertDocument(datedIndex, clusterName);
      return;
    } catch (error) {
      !this.quiet &&
        log(
          'monitoring:createIndex',
          `Could not create ${datedIndex} index on elasticsearch due to ${error.message ||
            error}`
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          `Could not create ${datedIndex} index on elasticsearch due to ${error.message ||
            error}`
        );
    }
  }

  /**
   * Inserting one document per agent into Elastic. Bulk.
   * @param {String} datedIndex The name for the index (e.g. daily: wazuh-monitoring-3.x-YYYY.MM.DD)
   * @param {String} clusterName Wazuh cluster name.
   */
  async insertDocument(datedIndex, clusterName) {
    try {
      let body = '';
      if (this.agentsArray.length > 0) {
        for (const element of this.agentsArray) {
          body +=
            '{ "index":  { "_index": "' +
            datedIndex +
            '", "_type": "wazuh-agent" } }\n';
          let date = new Date(Date.now()).toISOString();
          element['@timestamp'] = date;
          element.host = element.manager;
          element.cluster = { name: clusterName ? clusterName : 'disabled' };
          body += JSON.stringify(element) + '\n';
        }
        if (body === '') return;

        await this.wzWrapper.pushBulkAnyIndex(datedIndex, body);

        this.agentsArray = [];
      }
      return;
    } catch (error) {
      !this.quiet &&
        log(
          'monitoring:insertDocument',
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

  /**
   * Save agent status into elasticsearch, create index and/or insert document
   * @param {String} clusterName Wazuh cluster name.
   */
  async saveStatus(clusterName) {
    try {
      if (!this.ENABLED) return;

      this.datedIndex = this.index_prefix + indexDate(this.CREATION);

      const result = await this.wzWrapper.checkIfIndexExists(this.datedIndex);

      if (result) {
        const configurationFile = getConfiguration();
        const shardConfiguration = BuildBody(
          configurationFile,
          'wazuh.monitoring',
          2
        );
        await this.wzWrapper.updateIndexSettings(
          this.datedIndex,
          shardConfiguration
        );
        await this.insertDocument(this.datedIndex, clusterName);
      } else {
        await this.createIndex(this.datedIndex, clusterName);
      }

      return;
    } catch (error) {
      !this.quiet &&
        log(
          'monitoring:saveStatus',
          `Could not check if the index ${
            this.datedIndex
          } exists due to ${error.message || error}`
        );
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          `Could not check if the index ${
            this.datedIndex
          } exists due to ${error.message || error}`
        );
    }
  }

  /**
   * Removes the existing one index pattern, then it recreates the pattern with the new format.
   */
  async createWazuhMonitoring() {
    try {
      try {
        await this.wzWrapper.deleteMonitoring();

        !this.quiet &&
          log(
            'monitoring:createWazuhMonitoring',
            'Successfully deleted old wazuh-monitoring pattern.',
            'debug'
          );
      } catch (error) {
        !this.quiet &&
          log(
            'monitoring:createWazuhMonitoring',
            'No need to delete old wazuh-monitoring pattern.',
            'debug'
          );
      }

      await this.configureKibana();
      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Verify wazuh-agent template
   */
  async checkTemplate() {
    try {
      !this.quiet &&
        log(
          'monitoring:checkTemplate',
          'Updating wazuh-monitoring template...',
          'debug'
        );

      try {
        // Check if the template already exists
        const currentTemplate = await this.wzWrapper.getTemplateByName(
          'wazuh-agent'
        );
        // Copy already created index patterns
        monitoringTemplate.index_patterns =
          currentTemplate['wazuh-agent'].index_patterns;
      } catch (error) {
        // Init with the default index pattern
        monitoringTemplate.index_patterns = ['wazuh-monitoring-3.x-*'];
      }

      // Check if the user is using a custom pattern
      if (!monitoringTemplate.index_patterns.includes(this.index_pattern)) {
        monitoringTemplate.index_patterns.push(this.index_pattern);
      }

      await this.wzWrapper.putMonitoringTemplate(monitoringTemplate);
      return;
    } catch (error) {
      !this.quiet &&
        log(
          'monitoring:checkTemplate',
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

  /**
   * Main. First execution when installing / loading App.
   */
  async init() {
    try {
      !this.quiet &&
        log(
          'monitoring:init',
          'Creating/Updating wazuh-agent template...',
          'debug'
        );
      if (this.ENABLED) {
        await this.checkTemplate();
      }

      !this.quiet && log('monitoring:init', 'Creating new index...', 'debug');

      await this.saveStatus();

      const patternId = 'index-pattern:' + this.index_pattern;

      // Checks if wazuh-monitoring index pattern is already created, if it fails create it
      try {
        !this.quiet &&
          log(
            'monitoring:init',
            'Checking if wazuh-monitoring pattern exists...',
            'debug'
          );

        await this.wzWrapper.getIndexPatternUsingGet(patternId);

        !this.quiet &&
          log(
            'monitoring:init',
            'Updating known fields for wazuh-monitoring pattern...',
            'debug'
          );
        await this.wzWrapper.updateMonitoringIndexPatternKnownFields(patternId);
      } catch (error) {
        !this.quiet &&
          log(
            'monitoring:init',
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
          'monitoring:init',
          'Skipping wazuh-monitoring pattern creation. Already exists.',
          'debug'
        );

      return;
    } catch (error) {
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring', 'error'],
          error.message || error
        );
      !this.quiet && log('monitoring:init', error.message || error);
      return;
    }
  }

  /**
   * Check Elasticsearch Server status and Kibana index presence
   */
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
        log('monitoring:checkElasticsearchServer', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Wait until Kibana server is ready
   */
  async checkKibanaStatus() {
    try {
      !this.quiet &&
        log(
          'monitoring:checkKibanaStatus',
          'Waiting for Kibana and Elasticsearch servers to be ready...',
          'debug'
        );

      await this.checkElasticsearchServer();
      await this.init();
      return;
    } catch (error) {
      !this.quiet &&
        log(
          'monitoring:checkKibanaStatus',
          'Waiting for Kibana and Elasticsearch servers to be ready...',
          'debug'
        );

      setTimeout(() => this.checkKibanaStatus(), 3000);
    }
  }

  sleep(timeMs) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, timeMs);
    });
  }

  /**
   * Task used by the cron job.
   */
  async cronTask() {
    try {
      const template = await this.wzWrapper.getTemplateByName('wazuh-agent');
      const patterns =
        ((template || {})['wazuh-agent'] || {}).index_patterns || false;
      // Prevents to insert monitoring indices without the proper template inserted
      if (Array.isArray(patterns)) {
        // Discover new fields for all monitoring index patterns
        for (const pattern of patterns) {
          await this.wzWrapper.updateMonitoringIndexPatternKnownFields(
            'index-pattern:' + pattern
          );
        }
        this.agentsArray = [];
        const data = await this.getConfig();
        await this.loadCredentials(data);
      } else {
        !this.quiet &&
          log(
            'monitoring:cronTask',
            'No wazuh-agent template found, not inserting monitoring data',
            'debug'
          );
      }

      return;
    } catch (error) {
      // Retry to call itself again if Kibana index is not ready yet
      try {
        if (
          this.wzWrapper.buildingKibanaIndex ||
          ((error || {}).status === 404 &&
            (error || {}).displayName === 'NotFound')
        ) {
          await this.sleep(1000);
          return this.cronTask();
        }
      } catch (error) {} //eslint-disable-line

      !this.quiet && log('monitoring:cronTask', error.message || error);
      !this.quiet &&
        this.server.log(
          [blueWazuh, 'monitoring :cronTask', 'error'],
          error.message || error
        );
    }
  }

  /**
   * Function to start the cron job
   */
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
