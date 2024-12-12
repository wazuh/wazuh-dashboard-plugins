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
} from '../redux/actions/appStateActions';
import { CSVRequest } from '../services/csv-request';
import { getToasts, getCookies } from '../kibana-services';
import * as FileSaver from '../services/file-saver';
import { UI_LOGGER_LEVELS } from '../../common/constants';
import { WzAuthentication } from './wz-authentication';
import { UI_ERROR_SEVERITIES } from './error-orchestrator/types';
import { getErrorOrchestrator } from './common-services';

// eslint-disable-next-line unicorn/no-static-only-class
export class AppState {
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
   * @param {*} clusterInfo
   */
  static setClusterInfo(clusterInfo) {
    try {
      const encodedClusterInfo = encodeURI(JSON.stringify(clusterInfo));
      const exp = new Date();

      exp.setDate(exp.getDate() + 365);

      if (clusterInfo) {
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
   * Get 'API' value
   */
  static getCurrentAPI() {
    const currentAPI = getCookies().get('currentApi');

    return currentAPI ? decodeURI(currentAPI) : false;
  }

  /**
   * Remove 'API' cookie
   */
  static removeCurrentAPI() {
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

        const updateApiMenu = updateCurrentApi(JSON.parse(API).id);

        store.dispatch(updateApiMenu);
        WzAuthentication.refresh();
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
      currentPattern.at(-1) === '"'
    ) {
      const newPattern = currentPattern.slice(1, -1);

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
    return getCookies().remove('currentPattern');
  }

  /**
   * Set a new value to the 'currentDevTools' cookie
   * @param {*} current
   **/
  static setCurrentDevTools(current) {
    globalThis.localStorage.setItem('currentDevTools', current);
  }

  /**
   * Get 'currentDevTools' value
   **/
  static getCurrentDevTools() {
    return globalThis.localStorage.getItem('currentDevTools');
  }

  /**
   * Add/Edit an item in the session storage
   * @param {*} key
   * @param {*} value
   */
  static setSessionStorageItem(key, value) {
    globalThis.sessionStorage.setItem(key, value);
  }

  /**
   * Returns session storage item
   * @param {*} key
   */
  static getSessionStorageItem(key) {
    return globalThis.sessionStorage.getItem(key);
  }

  /**
   * Remove an item from the session storage
   * @param {*} key
   */
  static removeSessionStorageItem(key) {
    globalThis.sessionStorage.removeItem(key);
  }

  static setNavigation(params) {
    const decodedNavigation = getCookies().get('navigate')
      ? decodeURI(getCookies().get('navigate'))
      : false;
    let navigate = decodedNavigation ? JSON.parse(decodedNavigation) : {};

    for (let key in params) {
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
      const blob = new Blob([output], { type: 'text/csv' });

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
