/*
 * Wazuh app - App state service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export class AppState {
  constructor($cookies, $window) {
    this.$cookies = $cookies;
    this.$window = $window;
  }

  getExtensions(id) {
    const current = this.$cookies.getObject('extensions');
    return current ? current[id] : false;
  }

  setExtensions(id, extensions) {
    const current = this.$cookies.getObject('extensions') || {};
    current[id] = extensions;
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    if (extensions) {
      this.$cookies.putObject('extensions', current, { expires: exp });
    }
  }

  getClusterInfo() {
    return this.$cookies.getObject('_clusterInfo');
  }

  removeClusterInfo() {
    return this.$cookies.remove('_clusterInfo');
  }

  setClusterInfo(cluster_info) {
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    if (cluster_info) {
      this.$cookies.putObject('_clusterInfo', cluster_info, { expires: exp });
    }
  }

  getCurrentPattern() {
    return this.$cookies.getObject('_currentPattern');
  }

  setCreatedAt(date) {
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    this.$cookies.putObject('_createdAt', date, { expires: exp });
  }

  setCurrentPattern(newPattern) {
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    if (newPattern) {
      this.$cookies.putObject('_currentPattern', newPattern, { expires: exp });
    }
  }

  removeCurrentPattern() {
    return this.$cookies.remove('_currentPattern');
  }

  getCreatedAt() {
    return this.$cookies.getObject('_createdAt');
  }

  removeCreatedAt() {
    return this.$cookies.remove('_createdAt');
  }

  getCurrentAPI() {
    return this.$cookies.getObject('API');
  }

  removeCurrentAPI() {
    return this.$cookies.remove('API');
  }

  setCurrentAPI(API) {
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    if (API) {
      this.$cookies.putObject('API', API, { expires: exp });
    }
  }

  getPatternSelector() {
    return this.$cookies.getObject('patternSelector');
  }

  setPatternSelector(value) {
    this.$cookies.putObject('patternSelector', value);
  }

  setCurrentDevTools(current) {
    this.$window.localStorage.setItem('currentDevTools', current);
  }

  getCurrentDevTools() {
    return this.$window.localStorage.getItem('currentDevTools');
  }
}
