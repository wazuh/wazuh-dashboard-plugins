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
import { updateCurrentApi } from '../redux/actions/appStateActions';
import { CSVRequest } from '../services/csv-request';
import { getToasts, getCookies, setCookies } from '../kibana-services';
import * as FileSaver from '../services/file-saver';
import { WzAuthentication } from './wz-authentication';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { UI_LOGGER_LEVELS, WAZUH_EVENTS_PATTERN } from '../../common/constants';
import { getErrorOrchestrator } from './common-services';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { Cookies } from 'react-cookie';
import { isEqual } from 'lodash';

/* WORKAROUND: this defines the cookies object in case it doesn't exist that is used by
the selectedServerAPI$ observable */
try {
  getCookies();
} catch {
  setCookies(new Cookies());
}

export class AppState {
  static selectedServerAPI$ = new BehaviorSubject(
    getCookies().get('currentApi')
      ? decodeURI(getCookies().get('currentApi'))
      : false,
  );
  static selectedServerAPIChanged$ = this.selectedServerAPI$.pipe(
    distinctUntilChanged(isEqual),
  );
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
      const value = currentAPI ? decodeURI(currentAPI) : false;
      this.selectedServerAPI$.next(value ? JSON.parse(value) : false);
      return value;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove 'API' cookie
   */
  static removeCurrentAPI() {
    this.selectedServerAPI$.next(false);
    const updateApiMenu = updateCurrentApi(false);
    store.dispatch(updateApiMenu);
    return getCookies().remove('currentApi');
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
        });
        try {
          const parsedApi = JSON.parse(API);
          this.selectedServerAPI$.next(parsedApi);
          const updateApiMenu = updateCurrentApi(parsedApi.id);
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
    getCookies().set('patternSelector', encodedPattern, {});
  }

  /**
   * Get current index pattern
   * @returns {Promise<string>} The current index pattern ID
   * TODO: This function should be removed in order to use the data source service
   */
  static getCurrentPattern() {
    return WAZUH_EVENTS_PATTERN;
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
      getCookies().set('navigate', encodedURI);
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
    return getCookies().remove('navigate');
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
    getCookies().set('appName', 'wazuh');
    return !!getCookies().get('appName');
  }
}
