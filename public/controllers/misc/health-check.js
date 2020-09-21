/*
 * Wazuh app - Health check controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import chrome from 'ui/chrome';
import { AppState } from '../../react-services/app-state';
import { PatternHandler } from '../../react-services/pattern-handler';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { ApiCheck } from '../../react-services/wz-api-check';
import { ApiRequest } from '../../react-services/api-request';
import { SavedObject } from '../../react-services/saved-objects';
import { ErrorHandler } from '../../react-services/error-handler';
import { toastNotifications } from 'ui/notify';

export class HealthCheck {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $rootScope
   * @param {*} $timeout
   * @param {*} $location
   * @param {*} errorHandler
   * @param {*} Private
   * @param {*} $window
   */
  constructor(
    $scope,
    $rootScope,
    $timeout,
    $location,
    errorHandler,
    Private,
    $window
  ) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.$location = $location;
    this.genericReq = GenericRequest;
    this.apiReq = ApiRequest;
    this.errorHandler = errorHandler;
    this.wazuhConfig = new WazuhConfig();
    this.$window = $window;
    this.results = [];

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

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  /**
   * Manage an error
   */
  handleError(error) {
    this.errors.push(
      ErrorHandler.handle(error, 'Health Check', { silent: true })
    );
  }

  /**
   * This validates a pattern
   */
  async checkPatterns() {
    try {
      const patternId = AppState.getCurrentPattern();
      let patternTitle = '';
      if (this.checks.pattern) {
        const i = this.results.map(item => item.id).indexOf(2);
        let patternData = patternId ? await SavedObject.existsIndexPattern(patternId) : false;
        if(!patternData) patternData = {};  
        patternTitle = patternData.title;
        /* This extra check will work as long as Wazuh monitoring index ID is wazuh-monitoring-3.x-*.
           Currently is not possible to change that index pattern as it has always been created on our backend.
           This extra check checks if the index pattern exists for the current logged in user
           in case it doesn't exist, the index pattern is automatically created. This is necessary to make it work with Opendistro multinenancy
           as every index pattern is stored in its current tenant .kibana-tenant-XX index. 
           */
          try{
              await SavedObject.existsMonitoringIndexPattern('wazuh-monitoring-3.x-*'); //this checks if it exists, if not it automatically creates the index pattern
          }catch(err){}
        if (!patternData.status) {
          const patternList = await PatternHandler.getPatternList("healthcheck");
          if (patternList.length) {
            const currentPattern = patternList[0].id;
            AppState.setCurrentPattern(currentPattern);
            return this.checkPatterns();
          } else {
            this.errors.push('The selected index-pattern is not present.');
            this.results[i].status = 'Error';
          }
        } else {
          this.processedChecks++;
          this.results[i].status = 'Ready';
        }
      }

      if (this.checks.template) {
        if (!patternTitle) {
          var patternData = await SavedObject.existsIndexPattern(patternId);
          patternTitle = patternData.title;
        }
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

  async trySetDefault() {
    try {
      const response = await GenericRequest.request('GET', '/hosts/apis');
      const hosts = response.data;
      const errors = [];

      if (hosts.length) {
        for (var i = 0; i < hosts.length; i++) {
          try {
            const API = await ApiCheck.checkApi(hosts[i]);
            if (API && API.data) {
              return hosts[i].id;
            }
          } catch (err) {
            errors.push(`Could not connect to API with id: ${hosts[i].id}: ${err.message || err}`);
          }
        }
        if(errors.length){
          errors.forEach(error => this.errors.push(error));
          return Promise.reject('No API available to connect.');
        }
      }
    } catch (err) {
      return Promise.reject(`Error connecting to API: ${err}`);
    }
  }

  /**
   * This attempts to connect with API
   */
  async checkApiConnection() {
    try {
      const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
      if (this.checks.api && currentApi && currentApi.id) {
        let data;
        try {
          data = await ApiCheck.checkStored(currentApi.id);
        } catch (err) {
          try{
            const newApi = await this.trySetDefault();
            data = await ApiCheck.checkStored(newApi, true);
          }catch(err2){
            throw err2
          };
        }

        if (((data || {}).data || {}).idChanged) {
          this.showToast(
            'warning',
            'Selected Wazuh API has been updated',
            '',
            3000
          );
          const apiRaw = JSON.parse(AppState.getCurrentAPI());
          AppState.setCurrentAPI(
            JSON.stringify({ name: apiRaw.name, id: data.data.idChanged })
          );
        }
        //update cluster info
        const cluster_info = (((data || {}).data || {}).data || {})
          .cluster_info;
        if (cluster_info) {
          AppState.setClusterInfo(cluster_info);
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
          this.errors.push(data.data.data.apiIsDown ? 'Wazuh API is down.' : `Error connecting to the API.${data.data.error && data.data.error.message ? ` ${data.data.error.message}` : ''}`);
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
            if (!setupData.data.data['app-version']) {
              this.errors.push('Error fetching app version');
            };
            if (!apiVersion) {
              this.errors.push('Error fetching Wazuh API version');
            };
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
      this.results[0].status = 'Error';
      this.results[1].status = 'Error';
      AppState.removeNavigation();
      if (error && error.data && error.data.code && error.data.code === 3002) {
        return error;
      } else {
        this.handleError(error);
      }
    }
  }

  /**
   * On controller loads
   */
  async load() {
    try {
      const configuration = this.wazuhConfig.getConfig();

      AppState.setPatternSelector(configuration['ip.selector']);

      this.checks.pattern = configuration['checks.pattern'];
      this.checks.template = configuration['checks.template'];
      this.checks.api = configuration['checks.api'];
      this.checks.setup = configuration['checks.setup'];
      this.checks.fields = configuration['checks.fields'];

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
          status: this.checks.fields ? 'Checking...' : 'disabled'
        }
      );

      for (let key in this.checks) this.totalChecks += this.checks[key] ? 1 : 0;

      if (this.totalChecks == 0) this.zeroChecks = true;

      await Promise.all([this.checkPatterns(), this.checkApiConnection()]);

      this.checksDone = true;

      if (this.checks.fields) {
        try {
          await this.genericReq.request('GET', '/elastic/known-fields/all', {});
          this.results[this.results.length - 1].status = 'Ready';
        } catch (error) {
          this.results[this.results.length - 1].status = 'Error';
          this.handleError(error);
        }
      }

      if (!this.errors || !this.errors.length) {
        await this.$timeout(300);
        const params = this.$rootScope.previousParams || {};
        var queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
        const url = 'wazuh#' + (this.$rootScope.previousLocation || '') + '?' + queryString;
        this.$window.location.assign(
          chrome.addBasePath(url)
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
    window.location.href = '/app/wazuh#/settings';
  }
}
