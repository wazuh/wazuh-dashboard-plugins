/*
 * Wazuh app - App state service
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class AppState {
  /**
   * Class constructor
   * @param {*} $cookies
   * @param {*} $window
   */
  constructor($cookies, $window) {
    this.$cookies = $cookies;
    this.$window = $window;
    this.navigate = {};
  }


  //Gets all the extensions
  getAllExtensions() {
    return this.$cookies.getObject('extensions');
  }

  //Extensions setters and getters
  getExtensions(id) {
    const current = this.$cookies.getObject('extensions');
    return current ? current[id] : false;
  }

  //Sets the extension for an API
  setExtensions(id, extensions) {
    if (id && extensions) {
      const current = this.$cookies.getObject('extensions') || {};
      current[id] = extensions;
      const exp = this.generateExpirationDate();
      this.$cookies.putObject('extensions', current, { expires: exp });
    }
  }

  //Removes the extension when an API is removed
  removeExtensions(id) {
    try {
      const current = angular.copy(this.$cookies.getObject('extensions') || {});
      delete current[id]
      const exp = this.generateExpirationDate();
      if (Object.keys(current).length) {
        this.$cookies.putObject('extensions', current, { expires: exp });
      } else {
        this.$cookies.remove('extensions');
      }
    } catch (error) {}
  }

  //Generates the expiration date
  generateExpirationDate() {
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    return exp;
  }
  
  //Cluster setters and getters
  getClusterInfo() {
    return this.$cookies.getObject('_clusterInfo');
  }

  //Sets the cluster info
  setClusterInfo(cluster_info) {
    const exp = this.generateExpirationDate();
    if (cluster_info) {
      this.$cookies.putObject('_clusterInfo', cluster_info, { expires: exp });
    }
  }

  //CreatedAt setters and getters

  setCreatedAt(date) {
    const exp = this.generateExpirationDate();
    this.$cookies.putObject('_createdAt', date, { expires: exp });
  }

  getCreatedAt() {
    return this.$cookies.getObject('_createdAt');
  }

  //Current api setters and getters

  getCurrentAPI() {
    return this.$cookies.getObject('API');
  }

  removeCurrentAPI() {
    return this.$cookies.remove('API');
  }

  setCurrentAPI(API) {
    const exp = this.generateExpirationDate();
    if (API) {
      this.$cookies.putObject('API', API, { expires: exp });
    }
  }

  //Patterns setters and getters
  getPatternSelector() {
    return this.$cookies.getObject('patternSelector');
  }

  setPatternSelector(value) {
    this.$cookies.putObject('patternSelector', value);
  }

  setCurrentPattern(newPattern) {
    const exp = this.generateExpirationDate();
    if (newPattern) {
      this.$cookies.putObject('_currentPattern', newPattern, { expires: exp });
    }
  }

  getCurrentPattern() {
    return this.$cookies.getObject('_currentPattern');
  }

  //Dev tools setters and getters

  setCurrentDevTools(current) {
    this.$window.localStorage.setItem('currentDevTools', current);
  }

  getCurrentDevTools() {
    return this.$window.localStorage.getItem('currentDevTools');
  }

  //Session storage setters and getters
  setSessionStorageItem(key, value) {
    this.$window.sessionStorage.setItem(key, value);
  }

  getSessionStorageItem(key) {
    return this.$window.sessionStorage.getItem(key);
  }

  removeSessionStorageItem(key) {
    this.$window.sessionStorage.removeItem(key);
  }

  setNavigation(params) {
    for (var key in params) {
      this.navigate[key] = params[key];
    }
  }

  getNavigation() {
    return this.navigate;
  }
}
