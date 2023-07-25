/*
 * Wazuh app - APP state service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import store from '../redux/store';
import {
  updateCurrentApi,
  updateShowMenu,
  updateExtensions
} from '../redux/actions/appStateActions';
import { GenericRequest } from '../react-services/generic-request';
import { WazuhConfig } from './wazuh-config';
import { CSVRequest } from '../services/csv-request';
import { getToasts, getCookies, getAngularModule }  from '../kibana-services';
import * as FileSaver from '../services/file-saver';
import { WzAuthentication } from './wz-authentication';
import { UI_ERROR_SEVERITIES, UIErrorLog, UIErrorSeverity, UILogLevel } from './error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { getErrorOrchestrator } from './common-services';

export class AppState {

  static getCachedExtensions = (id) => {
    const extensions = ((store.getState() || {}).appStateReducers || {}).extensions;
    if(Object.keys(extensions).length && extensions[id]){
      return extensions[id];
    }
    return false;
  }


  /**
   * Returns if the extension 'id' is enabled
   * @param {id} id
   */
  static getExtensions = async id => {
    try {
      const cachedExtensions = this.getCachedExtensions(id);
      if(cachedExtensions){
        return cachedExtensions;
      }else{
        const data = await GenericRequest.request('GET', `/api/extensions/${id}`);

        const extensions = data.data.extensions;
        if (Object.keys(extensions).length) {
          AppState.setExtensions(id, extensions);
          return extensions;
        } else {
          const wazuhConfig = new WazuhConfig();
          const config = wazuhConfig.getConfig();
          if(!Object.keys(config).length) return;
          const extensions = Object.keys(config)
          .filter(key => key.split('.')[0] == 'extensions')
          .reduce((extensions, key) => {
            extensions[key.split('.')[1]] = config[key];
            return extensions;
          }, {});
          AppState.setExtensions(id, extensions);
          return extensions;
        }
      }
    } catch (error) {
      const options = {
        context: `${AppState.name}.getExtensions`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
  };

  /**
   *  Sets a new value for the cookie 'currentExtensions' object
   * @param {*} id
   * @param {*} extensions
   */
  static setExtensions = async (id, extensions) => {
    try {
      await GenericRequest.request('POST', '/api/extensions', {
        id,
        extensions
      });
      const updateExtension = updateExtensions(id,extensions);
      store.dispatch(updateExtension);
    } catch (error) {
      const options = {
        context: `${AppState.name}.setExtensions`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error set extensions`,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
  };

  /**
   * Cluster setters and getters
   **/
  static getClusterInfo() {
    try {
      const clusterInfo = getCookies().get('clusterInfo')
        ? decodeURI(getCookies().get('clusterInfo'))
        : false;
      return clusterInfo ? JSON.parse(clusterInfo) : {};
    } catch (error) {
      const options = {
        context: `${AppState.name}.getClusterInfo`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error get cluster info`,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
  }

  /**
   * Sets a new value to the cookie 'clusterInfo' object
   * @param {*} cluster_info
   */
  static setClusterInfo(cluster_info) {
    try {
      const encodedClusterInfo = encodeURI(JSON.stringify(cluster_info));
      const exp = new Date();
      exp.setDate(exp.getDate() + 365);
      if (cluster_info) {
        getCookies().set('clusterInfo', encodedClusterInfo, {
          expires: exp,
          path: window.location.pathname
        });
      }
    } catch (error) {
      const options = {
        context: `${AppState.name}.setClusterInfo`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error set cluster info`,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
  }

  /**
   * Set a new value to the 'createdAt' cookie
   * @param {*} date
   */
  static setCreatedAt(date) {
    try {
      const createdAt = encodeURI(date);
      const exp = new Date();
      exp.setDate(exp.getDate() + 365);
      getCookies().set('createdAt', createdAt, {
        expires: exp,
        path: window.location.pathname
      });
    } catch (error) {
      const options = {
        context: `${AppState.name}.setCreatedAt`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error set createdAt date`,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
  }

  /**
   * Get 'createdAt' value
   */
  static getCreatedAt() {
    try {
      const createdAt = getCookies().get('createdAt')
        ? decodeURI(getCookies().get('createdAt'))
        : false;
      return createdAt ? createdAt : false;
    } catch (error) {
      const options = {
        context: `${AppState.name}.getCreatedAt`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error get createdAt date`,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
  }

  /**
   * Get 'API' value
   */
  static getCurrentAPI() {
    try {
      const currentAPI = getCookies().get('currentApi');
      return currentAPI ? decodeURI(currentAPI) : false;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove 'API' cookie
   */
  static removeCurrentAPI() {
    const updateApiMenu = updateCurrentApi(false);
    store.dispatch(updateApiMenu);
    return getCookies().remove('currentApi', { path: window.location.pathname });
  }

  /**
   * Set a new value to the 'API' cookie
   * @param {*} date
   */
  static setCurrentAPI(API) {
    try {
      const encodedApi = encodeURI(API);
      const exp = new Date();
      exp.setDate(exp.getDate() + 365);
      if (API) {
        getCookies().set('currentApi', encodedApi, {
          expires: exp,
          path: window.location.pathname
        });
        try {
          const updateApiMenu = updateCurrentApi(JSON.parse(API).id);
          store.dispatch(updateApiMenu);
          WzAuthentication.refresh();
        } catch (error) {
          throw error;
        }
      }
    } catch (error) {
      const options = {
        context: `${AppState.name}.setCurrentAPI`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error set current API`,
        },
      };
      getErrorOrchestrator().handleError(options);
      throw error;
    }
  }

  /**
   * Get 'APISelector' value
   */
  static getAPISelector() {
    return getCookies().get('APISelector')
      ? decodeURI(getCookies().get('APISelector')) == 'true'
      : false;
  }

  /**
   * Get 'patternSelector' value
   */
  static getPatternSelector() {
    return getCookies().get('patternSelector')
      ? decodeURI(getCookies().get('patternSelector')) == 'true'
      : false;
  }

  /**
   * Set a new value to the 'patternSelector' cookie
   * @param {*} value
   */
  static setPatternSelector(value) {
    const encodedPattern = encodeURI(value);
    getCookies().set('patternSelector', encodedPattern, {
      path: window.location.pathname
    });
  }

  /**
   * Set a new value to the 'currentPattern' cookie
   * @param {*} newPattern
   */
  static setCurrentPattern(newPattern) {
    const encodedPattern = encodeURI(newPattern);
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    if (newPattern) {
      getCookies().set('currentPattern', encodedPattern, {
        expires: exp,
        path: window.location.pathname
      });
    }
  }

  /**
   * Get 'currentPattern' value
   */
  static getCurrentPattern() {
    const currentPattern = getCookies().get('currentPattern')
      ? decodeURI(getCookies().get('currentPattern'))
      : '';
    // check if the current Cookie has the format of 3.11 and previous versions, in that case we remove the extra " " characters
    if (
      currentPattern &&
      currentPattern[0] === '"' &&
      currentPattern[currentPattern.length - 1] === '"'
    ) {
      const newPattern = currentPattern.substring(1, currentPattern.length - 1);
      this.setCurrentPattern(newPattern);
    }
    return getCookies().get('currentPattern')
      ? decodeURI(getCookies().get('currentPattern'))
      : '';
  }

  /**
   * Remove 'currentPattern' value
   */
  static removeCurrentPattern() {
    return getCookies().remove('currentPattern', { path: window.location.pathname });
  }

  /**
   * Set a new value to the 'currentDevTools' cookie
   * @param {*} current
   **/
  static setCurrentDevTools(current) {
    window.localStorage.setItem('currentDevTools', current);
  }

  /**
   * Get 'currentDevTools' value
   **/
  static getCurrentDevTools() {
    return window.localStorage.getItem('currentDevTools');
  }

  /**
   * Add/Edit an item in the session storage
   * @param {*} key
   * @param {*} value
   */
  static setSessionStorageItem(key, value) {
    window.sessionStorage.setItem(key, value);
  }

  /**
   * Returns session storage item
   * @param {*} key
   */
  static getSessionStorageItem(key) {
    return window.sessionStorage.getItem(key);
  }

  /**
   * Remove an item from the session storage
   * @param {*} key
   */
  static removeSessionStorageItem(key) {
    window.sessionStorage.removeItem(key);
  }

  static setNavigation(params) {
    const decodedNavigation = getCookies().get('navigate')
      ? decodeURI(getCookies().get('navigate'))
      : false;
    var navigate = decodedNavigation ? JSON.parse(decodedNavigation) : {};
    for (var key in params) {
      navigate[key] = params[key];
    }
    if (navigate) {
      const encodedURI = encodeURI(JSON.stringify(navigate));
      getCookies().set('navigate', encodedURI, {
        path: window.location.pathname
      });
    }
  }

  static getNavigation() {
    const decodedNavigation = getCookies().get('navigate')
      ? decodeURI(getCookies().get('navigate'))
      : false;
    const navigation = decodedNavigation ? JSON.parse(decodedNavigation) : {};
    return navigation;
  }

  static removeNavigation() {
    return getCookies().remove('navigate', { path: window.location.pathname });
  }

  static setWzMenu(isVisible = true) {
    const showMenu = updateShowMenu(isVisible);
    store.dispatch(showMenu);
  }


  static async downloadCsv(path, fileName, filters = []) {
    try {
      const csvReq = new CSVRequest();
      getToasts().add({
        color: 'success',
        title: 'CSV',
        text: 'Your download should begin automatically...',
        toastLifeTimeMs: 4000,
      });
      const currentApi = JSON.parse(this.getCurrentAPI()).id;
      const output = await csvReq.fetch(path, currentApi, filters);
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      const options = {
        context: `${AppState.name}.downloadCsv`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `${error.name}: Error generating CSV`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  static checkCookies() {
    getCookies().set('appName', 'wazuh', { path: window.location.pathname });
    return !!getCookies().get('appName')
  }
}
