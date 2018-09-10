/*
 * Wazuh app - Heakthcheck controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import { SavedObjectsClientProvider } from 'ui/saved_objects';
const app = uiModules.get('app/wazuh', []);

class HealthCheck {
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
    this.$scope.results = [];

    this.savedObjectsClient = Private(SavedObjectsClientProvider);

    this.checks = {
      api: true,
      pattern: true,
      setup: true,
      template: true
    };

    this.$scope.errors = [];
    this.$scope.processedChecks = 0;
    this.$scope.totalChecks = 0;
  }

  handleError(error) {
    this.errorHandler.handle(error, 'Health Check');
    this.$scope.errors.push(
      this.errorHandler.handle(error, 'Health Check', false, true)
    );
  }

  async checkPatterns() {
    try {
      const data = await this.savedObjectsClient.get(
        'index-pattern',
        this.appState.getCurrentPattern()
      );
      const patternTitle = data.attributes.title;

      if (this.checks.pattern) {
        const i = this.$scope.results.map(item => item.id).indexOf(2);
        const patternData = await this.genericReq.request(
          'GET',
          `/api/wazuh-elastic/pattern/${patternTitle}`
        );
        if (!patternData.data.status) {
          this.$scope.errors.push('The selected index-pattern is not present.');
          this.$scope.results[i].status = 'Error';
        } else {
          this.$scope.processedChecks++;
          this.$scope.results[i].status = 'Ready';
        }
      }

      if (this.checks.template) {
        const i = this.$scope.results.map(item => item.id).indexOf(3);
        const templateData = await this.genericReq.request(
          'GET',
          `/api/wazuh-elastic/template/${patternTitle}`
        );
        if (!templateData.data.status) {
          this.$scope.errors.push(
            'No template found for the selected index-pattern.'
          );
          this.$scope.results[i].status = 'Error';
        } else {
          this.$scope.processedChecks++;
          this.$scope.results[i].status = 'Ready';
        }
      }
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  async checkApiConnection() {
    try {
      if (this.checks.api) {
        const data = await this.testAPI.checkStored(
          JSON.parse(this.appState.getCurrentAPI()).id
        );
        if (data && data.data && data.data.idChanged) {
          const apiRaw = JSON.parse(this.appState.getCurrentAPI());
          this.appState.setCurrentAPI(
            JSON.stringify({ name: apiRaw.name, id: data.data.idChanged })
          );
        }
        const i = this.$scope.results.map(item => item.id).indexOf(0);
        if (data.data.error || data.data.data.apiIsDown) {
          this.$scope.errors.push('Error connecting to the API.');
          this.$scope.results[i].status = 'Error';
        } else {
          this.$scope.processedChecks++;
          this.$scope.results[i].status = 'Ready';
          if (this.checks.setup) {
            const versionData = await this.apiReq.request(
              'GET',
              '/version',
              {}
            );
            const apiVersion = versionData.data.data;
            const setupData = await this.genericReq.request(
              'GET',
              '/api/wazuh-elastic/setup'
            );
            if (!setupData.data.data['app-version'] || !apiVersion) {
              this.errorHandler.handle(
                'Error fetching app version or API version',
                'Health Check'
              );
              this.$scope.errors.push('Error fetching version');
            }
            const apiSplit = apiVersion.split('v')[1].split('.');
            const appSplit = setupData.data.data['app-version'].split('.');

            const i = this.$scope.results.map(item => item.id).indexOf(1);
            if (apiSplit[0] !== appSplit[0] || apiSplit[1] !== appSplit[1]) {
              this.$scope.errors.push(
                'API version mismatch. Expected v' +
                  setupData.data.data['app-version']
              );
              this.$scope.results[i].status = 'Error';
            } else {
              this.$scope.processedChecks++;
              this.$scope.results[i].status = 'Ready';
            }
          }
        }
      } else {
        if (this.checks.setup) this.$scope.processedChecks++;
      }
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  async load() {
    try {
      const configuration = this.wazuhConfig.getConfig();

      this.appState.setPatternSelector(configuration['ip.selector']);

      this.checks.pattern = configuration['checks.pattern'];
      this.checks.template = configuration['checks.template'];
      this.checks.api = configuration['checks.api'];
      this.checks.setup = configuration['checks.setup'];

      this.$scope.results.push({
        id: 0,
        description: 'Check Wazuh API connection',
        status: this.checks.api ? 'Checking...' : 'disabled'
      });
      this.$scope.results.push({
        id: 1,
        description: 'Check for Wazuh API version',
        status: this.checks.setup ? 'Checking...' : 'disabled'
      });
      this.$scope.results.push({
        id: 2,
        description: 'Check Elasticsearch index pattern',
        status: this.checks.pattern ? 'Checking...' : 'disabled'
      });
      this.$scope.results.push({
        id: 3,
        description: 'Check Elasticsearch template',
        status: this.checks.template ? 'Checking...' : 'disabled'
      });

      for (let key in this.checks)
        this.$scope.totalChecks += this.checks[key] ? 1 : 0;

      if (this.$scope.totalChecks == 0) this.$scope.zeroChecks = true;

      await Promise.all([this.checkPatterns(), this.checkApiConnection()]);

      this.$scope.checksDone = true;
      if (!this.$scope.errors || !this.$scope.errors.length) {
        await this.$timeout(800);
        this.$window.location.assign(
          '/app/wazuh#' + this.$rootScope.previousLocation || ''
        );
        return;
      }

      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Health Check');
    }
  }

  $onInit() {
    this.$scope.goApp = () =>
      this.$window.location.assign(
        '/app/wazuh#' + this.$rootScope.previousLocation || ''
      );
    this.load();
  }
}

app.controller('healthCheck', HealthCheck);
