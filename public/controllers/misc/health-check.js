/*
 * Wazuh app - Health check controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { SavedObjectsClientProvider } from 'ui/saved_objects';

import chrome from 'ui/chrome';

export class HealthCheck {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $rootScope
   * @param {*} $timeout
   * @param {*} $location
   * @param {*} genericReq
   * @param {*} apiReq
   * @param {*} appState
   * @param {*} testAPI
   * @param {*} errorHandler
   * @param {*} wazuhConfig
   * @param {*} Private
   * @param {*} $window
   */
  constructor(
    $scope,
    $rootScope,
    $timeout,
    $location,
    genericReq,
    apiReq,
    appState,
    testAPI,
    errorHandler,
    wazuhConfig,
    Private,
    $window
  ) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.$location = $location;
    this.genericReq = genericReq;
    this.apiReq = apiReq;
    this.appState = appState;
    this.testAPI = testAPI;
    this.errorHandler = errorHandler;
    this.wazuhConfig = wazuhConfig;
    this.$window = $window;
    this.results = [];

    this.savedObjectsClient = Private(SavedObjectsClientProvider);

    this.checks = {
      api: true,
      pattern: true,
      setup: true,
      template: true
    };

    this.errors = [];
    this.processedChecks = 0;
    this.totalChecks = 0;
    this.$rootScope.hideWzMenu = true;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.load();
  }

  /**
   * Manage an error
   */
  handleError(error) {
    this.errors.push(
      this.errorHandler.handle(error, 'Health Check', false, true)
    );
  }

  /**
   * This validates a pattern
   */
  async checkPatterns() {
    try {
      const data = await this.savedObjectsClient.get(
        'index-pattern',
        this.appState.getCurrentPattern()
      );
      const patternTitle = data.attributes.title;

      if (this.checks.pattern) {
        const i = this.results.map(item => item.id).indexOf(2);
        const patternData = await this.genericReq.request(
          'GET',
          `/elastic/index-patterns/${patternTitle}`
        );
        if (!patternData.data.status) {
          this.errors.push('The selected index-pattern is not present.');
          this.results[i].status = 'Error';
        } else {
          this.processedChecks++;
          this.results[i].status = 'Ready';
        }
      }

      if (this.checks.template) {
        const i = this.results.map(item => item.id).indexOf(3);
        const templateData = await this.genericReq.request(
          'GET',
          `/elastic/template/${patternTitle}`
        );
        if (!templateData.data.status) {
          this.errors.push('No template found for the selected index-pattern.');
          this.results[i].status = 'Error';
        } else {
          this.processedChecks++;
          this.results[i].status = 'Ready';
        }
      }
      this.$scope.$applyAsync();
      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * This attempts to connect with API
   */
  async checkApiConnection() {
    try {
      if (this.checks.api) {
        const data = await this.testAPI.checkStored(
          JSON.parse(this.appState.getCurrentAPI()).id
        );

        if (((data || {}).data || {}).idChanged) {
          const apiRaw = JSON.parse(this.appState.getCurrentAPI());
          this.appState.setCurrentAPI(
            JSON.stringify({ name: apiRaw.name, id: data.data.idChanged })
          );
        }
        const i = this.results.map(item => item.id).indexOf(0);
        if (data === 3099) {
          this.errors.push('Wazuh not ready yet.');
          this.results[i].status = 'Error';
          if (this.checks.setup) {
            const i = this.results.map(item => item.id).indexOf(1);
            this.results[i].status = 'Error';
          }
        } else if (data.data.error || data.data.data.apiIsDown) {
          this.errors.push('Error connecting to the API.');
          this.results[i].status = 'Error';
        } else {
          this.processedChecks++;
          this.results[i].status = 'Ready';
          if (this.checks.setup) {
            const versionData = await this.apiReq.request(
              'GET',
              '/version',
              {}
            );
            const apiVersion = versionData.data.data;
            const setupData = await this.genericReq.request(
              'GET',
              '/api/setup'
            );
            if (!setupData.data.data['app-version'] || !apiVersion) {
              this.errorHandler.handle(
                'Error fetching app version or API version',
                'Health Check'
              );
              this.errors.push('Error fetching version');
            }
            const apiSplit = apiVersion.split('v')[1].split('.');
            const appSplit = setupData.data.data['app-version'].split('.');

            const i = this.results.map(item => item.id).indexOf(1);
            if (apiSplit[0] !== appSplit[0] || apiSplit[1] !== appSplit[1]) {
              this.errors.push(
                'API version mismatch. Expected v' +
                  setupData.data.data['app-version']
              );
              this.results[i].status = 'Error';
            } else {
              this.processedChecks++;
              this.results[i].status = 'Ready';
            }
          }
        }
      } else {
        if (this.checks.setup) this.processedChecks++;
      }
      this.$scope.$applyAsync();
      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * On controller loads
   */
  async load() {
    try {
      const configuration = this.wazuhConfig.getConfig();

      this.appState.setPatternSelector(configuration['ip.selector']);

      this.checks.pattern = configuration['checks.pattern'];
      this.checks.template = configuration['checks.template'];
      this.checks.api = configuration['checks.api'];
      this.checks.setup = configuration['checks.setup'];

      this.results.push(
        {
          id: 0,
          description: 'Check Wazuh API connection',
          status: this.checks.api ? 'Checking...' : 'disabled'
        },
        {
          id: 1,
          description: 'Check for Wazuh API version',
          status: this.checks.setup ? 'Checking...' : 'disabled'
        },
        {
          id: 2,
          description: 'Check Elasticsearch index pattern',
          status: this.checks.pattern ? 'Checking...' : 'disabled'
        },
        {
          id: 3,
          description: 'Check Elasticsearch template',
          status: this.checks.template ? 'Checking...' : 'disabled'
        },
        {
          id: 4,
          description: 'Check index pattern known fields',
          status: 'Checking...'
        }
      );

      for (let key in this.checks) this.totalChecks += this.checks[key] ? 1 : 0;

      if (this.totalChecks == 0) this.zeroChecks = true;

      await Promise.all([this.checkPatterns(), this.checkApiConnection()]);

      this.checksDone = true;

      try {
        await this.genericReq.request('GET', '/elastic/known-fields/all', {});
        this.results[this.results.length - 1].status = 'Ready';
      } catch (error) {
        this.results[this.results.length - 1].status = 'Error';
        this.handleError(error);
      }

      if (!this.errors || !this.errors.length) {
        await this.$timeout(300);
        this.$window.location.assign(
          chrome.addBasePath('wazuh#' + this.$rootScope.previousLocation || '')
        );
        return;
      }

      this.$scope.$applyAsync();
      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * This navigates to app root path or an a previous stored location
   */
  goApp() {
    this.$window.location.assign(
      chrome.addBasePath('wazuh#' + this.$rootScope.previousLocation || '')
    );
  }
}
