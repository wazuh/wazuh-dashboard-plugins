/*
 * Wazuh app - Settings controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { base64 } from '../../utils/base64';
import { TabNames } from '../../utils/tab-names';
import { configEquivalences } from '../../utils/config-equivalences';

export class SettingsController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $window
   * @param {*} $location
   * @param {*} testAPI
   * @param {*} appState
   * @param {*} genericReq
   * @param {*} errorHandler
   * @param {*} wzMisc
   * @param {*} wazuhConfig
   */
  constructor(
    $scope,
    $window,
    $location,
    testAPI,
    appState,
    genericReq,
    errorHandler,
    wzMisc,
    wazuhConfig
  ) {
    this.$scope = $scope;
    this.$window = $window;
    this.$location = $location;
    this.testAPI = testAPI;
    this.appState = appState;
    this.genericReq = genericReq;
    this.errorHandler = errorHandler;
    this.wzMisc = wzMisc;
    this.wazuhConfig = wazuhConfig;

    if (this.wzMisc.getWizard()) {
      $window.sessionStorage.removeItem('healthCheck');
      this.wzMisc.setWizard(false);
    }

    this.apiIsDown = this.wzMisc.getApiIsDown();

    // Initialize
    this.currentApiEntryIndex = false;
    this.formData = {};
    this.tab = 'api';
    this.load = true;
    this.loadingLogs = true;
    this.addManagerContainer = false;
    this.showEditForm = {};
    this.formUpdate = {};
    this.editingKey = false;

    this.userRegEx = new RegExp(/^.{3,100}$/);
    this.passRegEx = new RegExp(/^.{3,100}$/);
    this.urlRegEx = new RegExp(/^https?:\/\/[a-zA-Z0-9-.]{1,300}$/);
    this.urlRegExIP = new RegExp(
      /^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/
    );
    this.portRegEx = new RegExp(/^[0-9]{2,5}$/);

    // Tab names
    this.tabNames = TabNames;
    this.configuration = wazuhConfig.getConfig();
    this.configurationTypes = [];
    for (const key in this.configuration) {
      this.configurationTypes[key] = typeof this.configuration[key];
    }
    this.indexPatterns = [];
    this.apiEntries = [];

    const location = this.$location.search();
    if (location && location.tab) {
      this.tab = location.tab;
    }

    this.savingApi = false;
  }

  /**
   * On controller loads
   */
  $onInit() {
    // Loading data
    this.getSettings().then(() => this.getAppInfo());
  }

  /**
   * This switch to a selected tab
   * @param {Object} tab
   */
  switchTab(tab, setNav = false) {
    if (setNav) {
      this.appState.setNavigation({ status: true });
    }
    this.tab = tab;
    this.$location.search('tab', this.tab);
  }

  /**
   * Remove a Wazuh API entry
   * @param {*} item
   */
  async removeManager(item) {
    try {
      let index = this.apiEntries.indexOf(item);
      if (this.appState.getCurrentAPI()) {
        if (
          this.apiEntries[index]._id ===
          JSON.parse(this.appState.getCurrentAPI()).id
        ) {
          // We are trying to remove the one selected as default
          this.appState.removeCurrentAPI();
        }
      }
      await this.genericReq.request(
        'DELETE',
        `/elastic/apis/${this.apiEntries[index]._id}`
      );
      this.showEditForm[this.apiEntries[index]._id] = false;
      this.apiEntries.splice(index, 1);
      this.wzMisc.setApiIsDown(false);
      this.apiIsDown = false;
      this.isEditing = false;
      for (const key in this.showEditForm) this.showEditForm[key] = false;
      this.$scope.$emit('updateAPI', {});
      this.errorHandler.info('The API was removed successfully', 'Settings');
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle('Could not remove the API', 'Settings');
    }
    return;
  }

  // Get current API index
  getCurrentAPIIndex() {
    // eslint-disable-next-line
    this.apiEntries.map((entry, index, array) => {
      if (entry._id === this.currentDefault) this.currentApiEntryIndex = index;
    });
  }

  /**
   * This sort by timestamp two given objects
   * @param {Object} a
   * @param {Object} b
   */
  sortByTimestamp(a, b) {
    const intA = parseInt(a._id);
    const intB = parseInt(b._id);
    return intA > intB ? -1 : intA < intB ? 1 : 0;
  }

  // Set default API
  setDefault(item) {
    const index = this.apiEntries.indexOf(item);

    this.appState.setClusterInfo(this.apiEntries[index]._source.cluster_info);

    if (this.apiEntries[index]._source.cluster_info.status == 'disabled') {
      this.appState.setCurrentAPI(
        JSON.stringify({
          name: this.apiEntries[index]._source.cluster_info.manager,
          id: this.apiEntries[index]._id
        })
      );
    } else {
      this.appState.setCurrentAPI(
        JSON.stringify({
          name: this.apiEntries[index]._source.cluster_info.cluster,
          id: this.apiEntries[index]._id
        })
      );
    }

    this.$scope.$emit('updateAPI', {});

    const currentApi = this.appState.getCurrentAPI();
    this.currentDefault = JSON.parse(currentApi).id;

    this.errorHandler.info(
      `API ${
      this.apiEntries[index]._source.cluster_info.manager
      } set as default`,
      'Settings'
    );

    this.getCurrentAPIIndex();

    if (currentApi && !this.appState.getExtensions(JSON.parse(currentApi).id)) {
      this.appState.setExtensions(
        this.apiEntries[this.currentApiEntryIndex]._id,
        this.apiEntries[this.currentApiEntryIndex]._source.extensions
      );
    }

    this.extensions = this.appState.getExtensions(JSON.parse(currentApi).id);

    if (!this.$scope.$$phase) this.$scope.$digest();
    return;
  }

  // Get settings function
  async getSettings() {
    try {
      const patternList = await this.genericReq.request(
        'GET',
        '/elastic/index-patterns',
        {}
      );
      this.indexPatterns = patternList.data.data;

      if (!patternList.data.data.length) {
        this.wzMisc.setBlankScr('Sorry but no valid index patterns were found');
        this.$location.search('tab', null);
        this.$location.path('/blank-screen');
        return;
      }
      const data = await this.genericReq.request('GET', '/elastic/apis');
      for (const entry of data.data) this.showEditForm[entry._id] = false;

      this.apiEntries = data.data.length > 0 ? data.data : [];
      this.apiEntries = this.apiEntries.sort(this.sortByTimestamp);

      const currentApi = this.appState.getCurrentAPI();

      if (currentApi) {
        this.currentDefault = JSON.parse(currentApi).id;
      }

      if (!this.$scope.$$phase) this.$scope.$digest();
      this.getCurrentAPIIndex();
      if (!this.currentApiEntryIndex && this.currentApiEntryIndex !== 0) return;

      if (
        currentApi &&
        !this.appState.getExtensions(JSON.parse(currentApi).id)
      ) {
        this.appState.setExtensions(
          this.apiEntries[this.currentApiEntryIndex]._id,
          this.apiEntries[this.currentApiEntryIndex]._source.extensions
        );
      }

      this.extensions = this.appState.getExtensions(JSON.parse(currentApi).id);

      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle('Error getting API entries', 'Settings');
    }
    return;
  }

  /**
   * This validate format of fileds in a given api connection form
   * @param {Object} formName
   */
  validator(formName) {
    // Validate user
    if (!this.userRegEx.test(this[formName].user)) {
      return 'Invalid user field';
    }

    // Validate password
    if (!this.passRegEx.test(this[formName].password)) {
      return 'Invalid password field';
    }

    // Validate url
    if (
      !this.urlRegEx.test(this[formName].url) &&
      !this.urlRegExIP.test(this[formName].url)
    ) {
      return 'Invalid url field';
    }

    // Validate port
    const validatePort = parseInt(this[formName].port);
    if (
      !this.portRegEx.test(this[formName].port) ||
      validatePort <= 0 ||
      validatePort >= 99999
    ) {
      return 'Invalid port field';
    }

    return false;
  }

  /**
   * This toggle to a given entry
   * @param {Object} entry
   */
  toggleEditor(entry) {
    if (this.formUpdate && this.formUpdate.password) {
      this.formUpdate.password = '';
    }
    for (const key in this.showEditForm) {
      if (entry && entry._id === key) continue;
      this.showEditForm[key] = false;
    }
    this.showEditForm[entry._id] = !this.showEditForm[entry._id];
    this.isEditing = this.showEditForm[entry._id];
    this.addManagerContainer = false;
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  // Save settings function
  async saveSettings() {
    try {
      if (this.savingApi) {
        this.errorHandler.info('Please, wait for success message', 'Settings');
        return;
      }
      this.savingApi = true;
      this.messageError = '';
      this.isEditing = false;
      const invalid = this.validator('formData');

      if (invalid) {
        this.messageError = invalid;
        this.errorHandler.handle(invalid, 'Settings');
        this.savingApi = false;
        return;
      }

      const tmpData = {
        user: this.formData.user,
        password: base64.encode(this.formData.password),
        url: this.formData.url,
        port: this.formData.port,
        cluster_info: {},
        insecure: 'true',
        extensions: {}
      };

      const config = this.wazuhConfig.getConfig();

      this.appState.setPatternSelector(config['ip.selector']);

      tmpData.extensions.audit = config['extensions.audit'];
      tmpData.extensions.pci = config['extensions.pci'];
      tmpData.extensions.gdpr = config['extensions.gdpr'];
      tmpData.extensions.oscap = config['extensions.oscap'];
      tmpData.extensions.ciscat = config['extensions.ciscat'];
      tmpData.extensions.aws = config['extensions.aws'];
      tmpData.extensions.virustotal = config['extensions.virustotal'];
      tmpData.extensions.osquery = config['extensions.osquery'];

      const checkData = await this.testAPI.check(tmpData);

      // API Check correct. Get Cluster info
      tmpData.cluster_info = checkData.data;

      // Insert new API entry
      const data = await this.genericReq.request(
        'PUT',
        '/elastic/api',
        tmpData
      );
      this.appState.setExtensions(data.data.response._id, tmpData.extensions);
      const newEntry = {
        _id: data.data.response._id,
        _source: {
          cluster_info: tmpData.cluster_info,
          active: tmpData.active,
          url: tmpData.url,
          api_user: tmpData.user,
          api_port: tmpData.port,
          extensions: tmpData.extensions
        }
      };
      this.apiEntries.push(newEntry);
      this.apiEntries = this.apiEntries.sort(this.sortByTimestamp);

      this.errorHandler.info('Wazuh API successfully added', 'Settings');
      this.addManagerContainer = false;

      this.formData = {};

      // Setting current API as default if no one is in the cookies
      if (!this.appState.getCurrentAPI()) {
        // No cookie
        if (
          this.apiEntries[this.apiEntries.length - 1]._source.cluster_info
            .status === 'disabled'
        ) {
          this.appState.setCurrentAPI(
            JSON.stringify({
              name: this.apiEntries[this.apiEntries.length - 1]._source
                .cluster_info.manager,
              id: this.apiEntries[this.apiEntries.length - 1]._id
            })
          );
        } else {
          this.appState.setCurrentAPI(
            JSON.stringify({
              name: this.apiEntries[this.apiEntries.length - 1]._source
                .cluster_info.cluster,
              id: this.apiEntries[this.apiEntries.length - 1]._id
            })
          );
        }
        this.$scope.$emit('updateAPI', {});
        this.currentDefault = JSON.parse(this.appState.getCurrentAPI()).id;
      }

      try {
        await this.genericReq.request('GET', '/api/monitoring');
      } catch (error) {
        if ((error || {}).status === -1) {
          this.errorHandler.handle(
            'Wazuh API was inserted correctly, but something happened while fetching agents data.',
            'Fetch agents',
            true
          );
        } else {
          this.errorHandler.handle(error, 'Fetch agents');
        }
      }

      await this.getSettings();
    } catch (error) {
      if (error.status === 400) {
        error.message =
          'Please, fill all the fields in order to connect with Wazuh RESTful API.';
      }
      this.printError(error);
    }
    this.savingApi = false;
    if (!this.$scope.$$phase) this.$scope.$digest();
    return;
  }

  /**
   * This show us if editor is updating
   */
  isUpdating() {
    for (let key in this.showEditForm) {
      if (this.showEditForm[key]) return true;
    }
    return false;
  }

  // Update settings function
  async updateSettings(item) {
    try {
      if (this.savingApi) {
        this.errorHandler.info('Please, wait for success message', 'Settings');
        return;
      }
      this.savingApi = true;
      this.messageErrorUpdate = '';

      const invalid = this.validator('formUpdate');
      if (invalid) {
        this.messageErrorUpdate = invalid;
        this.errorHandler.handle(invalid, 'Settings');
        this.savingApi = false;
        return;
      }

      const index = this.apiEntries.indexOf(item);

      const tmpData = {
        user: this.formUpdate.user,
        password: base64.encode(this.formUpdate.password),
        url: this.formUpdate.url,
        port: this.formUpdate.port,
        cluster_info: {},
        insecure: 'true',
        id: this.apiEntries[index]._id,
        extensions: this.apiEntries[index]._source.extensions
      };

      const data = await this.testAPI.check(tmpData);
      tmpData.cluster_info = data.data;
      await this.genericReq.request('PUT', '/elastic/api-settings', tmpData);
      this.apiEntries[index]._source.cluster_info = tmpData.cluster_info;

      this.wzMisc.setApiIsDown(false);
      this.apiIsDown = false;

      this.apiEntries[index]._source.cluster_info.cluster =
        tmpData.cluster_info.cluster;
      this.apiEntries[index]._source.cluster_info.manager =
        tmpData.cluster_info.manager;
      this.apiEntries[index]._source.url = tmpData.url;
      this.apiEntries[index]._source.api_port = tmpData.port;
      this.apiEntries[index]._source.api_user = tmpData.user;

      this.apiEntries = this.apiEntries.sort(this.sortByTimestamp);
      this.showEditForm[this.apiEntries[index]._id] = false;
      this.isEditing = false;

      this.errorHandler.info('The API was updated successfully', 'Settings');
    } catch (error) {
      this.printError(error, true);
    }
    this.savingApi = false;
    if (!this.$scope.$$phase) this.$scope.$digest();
    return;
  }

  /**
   * This toggle the addManagerContainer flag
   */
  switch() {
    this.addManagerContainer = !this.addManagerContainer;
  }

  // Check manager connectivity
  async checkManager(item, isIndex) {
    try {
      const index = isIndex ? item : this.apiEntries.indexOf(item);

      const tmpData = {
        user: this.apiEntries[index]._source.api_user,
        //password    : this.apiEntries[index]._source.api_password,
        url: this.apiEntries[index]._source.url,
        port: this.apiEntries[index]._source.api_port,
        cluster_info: {},
        insecure: 'true',
        id: this.apiEntries[index]._id
      };

      const data = await this.testAPI.check(tmpData);
      tmpData.cluster_info = data.data;

      const tmpUrl = `/elastic/api-hostname/${this.apiEntries[index]._id}`;
      await this.genericReq.request('PUT', tmpUrl, {
        cluster_info: tmpData.cluster_info
      });
      // Emit updateAPI event cause the cluster info could had been changed
      this.$scope.$emit('updateAPI', { cluster_info: tmpData.cluster_info });
      this.apiEntries[index]._source.cluster_info = tmpData.cluster_info;
      this.wzMisc.setApiIsDown(false);
      this.apiIsDown = false;
      this.errorHandler.info('Connection success', 'Settings');

      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      if (!this.wzMisc.getApiIsDown()) this.printError(error);
    }
  }

  // Toggle extension
  toggleExtension(extension, state) {
    try {
      const api = JSON.parse(this.appState.getCurrentAPI()).id;
      const currentExtensions = this.appState.getExtensions(api);
      currentExtensions[extension] = state;
      this.appState.setExtensions(api, currentExtensions);
      this.getCurrentAPIIndex();
      this.apiEntries[
        this.currentApiEntryIndex
      ]._source.extensions = currentExtensions;
      if (!this.$scope.$$phase) this.$scope.$digest();
    } catch (error) {
      this.errorHandler.handle(error, 'Settings');
    }
  }

  /**
   * This change to a given index pattern
   * @param {} newIndexPattern
   */
  async changeIndexPattern(newIndexPattern) {
    try {
      this.appState.setCurrentPattern(newIndexPattern);
      await this.genericReq.request(
        'GET',
        `/elastic/known-fields/${newIndexPattern}`,
        {}
      );
      this.$scope.$emit('updatePattern', {});
      this.errorHandler.info(
        'Successfully changed the default index-pattern',
        'Settings'
      );
      this.selectedIndexPattern = newIndexPattern;
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle(
        'Error while changing the default index-pattern',
        'Settings'
      );
    }
    return;
  }

  /**
   * This set the error, and checks if is updating
   * @param {*} error
   * @param {*} updating
   */
  printError(error, updating) {
    const text = this.errorHandler.handle(error, 'Settings');
    if (!updating) this.messageError = text;
    else this.messageErrorUpdate = text;
  }

  /**
   * Returns Wazuh app logs
   */
  async getAppLogs() {
    try {
      this.loadingLogs = true;
      const logs = await this.genericReq.request('GET', '/utils/logs', {});
      this.logs = logs.data.lastLogs.map(item => JSON.parse(item));
      this.loadingLogs = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
    } catch (error) {
      this.logs = [
        {
          date: new Date(),
          level: 'error',
          message: 'Error when loading Wazuh app logs'
        }
      ];
    }
  }

  /**
   * Returns Wazuh app info
   */
  async getAppInfo() {
    try {
      const data = await this.genericReq.request('GET', '/elastic/setup');
      this.appInfo = {};
      this.appInfo['app-version'] = data.data.data['app-version'];
      this.appInfo['installationDate'] = data.data.data['installationDate'];
      this.appInfo['revision'] = data.data.data['revision'];
      this.load = false;
      const config = this.wazuhConfig.getConfig();
      this.appState.setPatternSelector(config['ip.selector']);
      if (
        this.appState.getCurrentPattern() !== undefined &&
        this.appState.getCurrentPattern() !== null
      ) {
        // There's a pattern in the cookies
        this.selectedIndexPattern = this.appState.getCurrentPattern();
      } else {
        // There's no pattern in the cookies, pick the one in the settings
        this.selectedIndexPattern = config['pattern'];
      }

      if (!this.appState.getCurrentAPI()) {
        this.extensions = {};
        this.extensions.audit = config['extensions.audit'];
        this.extensions.pci = config['extensions.pci'];
        this.extensions.gdpr = config['extensions.gdpr'];
        this.extensions.oscap = config['extensions.oscap'];
        this.extensions.ciscat = config['extensions.ciscat'];
        this.extensions.aws = config['extensions.aws'];
        this.extensions.virustotal = config['extensions.virustotal'];
        this.extensions.osquery = config['extensions.osquery'];
      } else {
        this.extensions = this.appState.getExtensions(
          JSON.parse(this.appState.getCurrentAPI()).id
        );
      }

      if (this.tab === 'logs') {
        this.getAppLogs();
      }
      this.getCurrentAPIIndex();
      if (this.currentApiEntryIndex || this.currentApiEntryIndex === 0) {
        await this.checkManager(this.currentApiEntryIndex, true);
      }
      if (!this.$scope.$$phase) this.$scope.$digest();
      return;
    } catch (error) {
      this.errorHandler.handle(
        'Error when loading Wazuh setup info',
        'Settings'
      );
    }
    return;
  }

  /**
   * This ask again for wazuh logs
   */
  refreshLogs() {
    return this.getAppLogs();
  }

  /**
   * This get the string equivalence for a given key
   * @param {String} key
   */
  configEquivalence(key) {
    return configEquivalences[key] || '-';
  }

  /**
   * Cancel edition of a configuration entry
   */
  cancelEditingKey() {
    this.editingKey = false;
    this.editingNewValue = '';
  }

  /**
   * Enable edition for a given key
   * @param {String} key Configuration key
   */
  setEditingKey(key, value) {
    if (typeof value === 'object') {
      try {
        value = JSON.stringify(value);
      } catch (err) {
        this.errorHandler.handle('Error parsing value', key);
      }
    }
    this.editingKey = key;
    this.editingNewValue = value;
  }

  /**
   * Change value for a given configuration key
   * @param {String} key Configuration key
   * @param {String} newValue new configuration value for key
   */
  async editKey(key, newValue) {
    try {
      this.loadingChange = true;
      const response = await this.genericReq.request(
        'PUT',
        '/utils/configuration',
        {
          key,
          value: newValue
        }
      );
      if (response.data.data) {
        this.errorHandler.handle(
          'You must restart Kibana for the changes to take effect',
          '',
          true
        );
      } else {
        this.errorHandler.info(
          'Success. The configuration has been successfully updated'
        );
      }
      this.configuration[key] = newValue;
      this.cancelEditingKey();
      this.loadingChange = false;
    } catch (error) {
      this.cancelEditingKey();
      this.loadingChange = false;
      this.errorHandler.handle(error);
    }
  }
}
