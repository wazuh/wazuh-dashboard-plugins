/*
 * Wazuh app - APP state service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import Cookies from '../utils/js-cookie';
import store from '../redux/store';
import {
  updateCurrentApi,
  updateShowMenu
} from '../redux/actions/appStateActions';

export class AppState {
  /**
   * Returns if the extension 'id' is enabled
   * @param {id} id
   */
  static getExtensions(id) {
    try {
      const extensions = Cookies.get('currentExtensions')
        ? decodeURI(Cookies.get('currentExtensions'))
        : false;
      const parsedExtensions = extensions ? JSON.parse(extensions) : false;
      return parsedExtensions ? parsedExtensions[id] : false;
    } catch (err) {
      console.log('Error get extensions');
      console.log(err);
      throw err;
    }
  }

  /**
   *  Sets a new value for the cookie 'currentExtensions' object
   * @param {*} id
   * @param {*} extensions
   */
  static setExtensions(id, extensions) {
    try {
      const decodedExtensions = Cookies.get('currentExtensions')
        ? decodeURI(Cookies.get('currentExtensions'))
        : false;
      const current = decodedExtensions ? JSON.parse(decodedExtensions) : {};
      current[id] = extensions;
      const exp = new Date();
      exp.setDate(exp.getDate() + 365);
      if (extensions) {
        const encodedExtensions = encodeURI(JSON.stringify(current));
        Cookies.set('currentExtensions', encodedExtensions, {
          expires: exp,
          path: window.location.pathname
        });
      }
    } catch (err) {
      console.log('Error set extensions');
      console.log(err);
      throw err;
    }
  }

  /**
   * Cluster setters and getters
   **/
  static getClusterInfo() {
    try {
      const clusterInfo = Cookies.get('clusterInfo')
        ? decodeURI(Cookies.get('clusterInfo'))
        : false;
      return clusterInfo ? JSON.parse(clusterInfo) : {};
    } catch (err) {
      console.log('Error get cluster info');
      console.log(err);
      throw err;
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
        Cookies.set('clusterInfo', encodedClusterInfo, {
          expires: exp,
          path: window.location.pathname
        });
      }
    } catch (err) {
      console.log('Error set cluster info');
      console.log(err);
      throw err;
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
      Cookies.set('createdAt', createdAt, {
        expires: exp,
        path: window.location.pathname
      });
    } catch (err) {
      console.log('Error set createdAt date');
      console.log(err);
      throw err;
    }
  }

  /**
   * Get 'createdAt' value
   */
  static getCreatedAt() {
    try {
      const createdAt = Cookies.get('createdAt')
        ? decodeURI(Cookies.get('createdAt'))
        : false;
      return createdAt ? createdAt : false;
    } catch (err) {
      console.log('Error get createdAt date');
      console.log(err);
      throw err;
    }
  }

  /**
   * Get 'API' value
   */
  static getCurrentAPI() {
    try {
      const currentAPI = Cookies.get('currentApi');
      return currentAPI ? decodeURI(currentAPI) : false;
    } catch (err) {
      console.log('Error get current Api');
      console.log(err);
      throw err;
    }
  }

  /**
   * Remove 'API' cookie
   */
  static removeCurrentAPI() {
    const updateApiMenu = updateCurrentApi(false);
    store.dispatch(updateApiMenu);
    return Cookies.remove('currentApi', { path: window.location.pathname });
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
        Cookies.set('currentApi', encodedApi, {
          expires: exp,
          path: window.location.pathname
        });
        try {
          const updateApiMenu = updateCurrentApi(JSON.parse(API).id);
          store.dispatch(updateApiMenu);
        } catch (err) {}
      }
    } catch (err) {
      console.log('Error set current API');
      console.log(err);
      throw err;
    }
  }

  /**
   * Get 'APISelector' value
   */
  static getAPISelector() {
    return Cookies.get('APISelector')
      ? decodeURI(Cookies.get('APISelector')) == 'true'
      : false;
  }

  /**
   * Set a new value to the 'patternSelector' cookie
   * @param {*} value
   */
  static setAPISelector(value) {
    const encodedPattern = encodeURI(value);
    Cookies.set('APISelector', encodedPattern, {
      path: window.location.pathname
    });
  }

  /**
   * Get 'patternSelector' value
   */
  static getPatternSelector() {
    return Cookies.get('patternSelector')
      ? decodeURI(Cookies.get('patternSelector')) == 'true'
      : false;
  }

  /**
   * Set a new value to the 'patternSelector' cookie
   * @param {*} value
   */
  static setPatternSelector(value) {
    const encodedPattern = encodeURI(value);
    Cookies.set('patternSelector', encodedPattern, {
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
      Cookies.set('currentPattern', encodedPattern, {
        expires: exp,
        path: window.location.pathname
      });
    }
  }

  /**
   * Get 'currentPattern' value
   */
  static getCurrentPattern() {
    const currentPattern = Cookies.get('currentPattern')
      ? decodeURI(Cookies.get('currentPattern'))
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
    return Cookies.get('currentPattern')
      ? decodeURI(Cookies.get('currentPattern'))
      : '';
  }

  /**
   * Remove 'currentPattern' value
   */
  static removeCurrentPattern() {
    return Cookies.remove('currentPattern', { path: window.location.pathname });
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
    const decodedNavigation = Cookies.get('navigate')
      ? decodeURI(Cookies.get('navigate'))
      : false;
    var navigate = decodedNavigation ? JSON.parse(decodedNavigation) : {};
    for (var key in params) {
      navigate[key] = params[key];
    }
    if (navigate) {
      const encodedURI = encodeURI(JSON.stringify(navigate));
      Cookies.set('navigate', encodedURI, { path: window.location.pathname });
    }
  }

  static getNavigation() {
    const decodedNavigation = Cookies.get('navigate')
      ? decodeURI(Cookies.get('navigate'))
      : false;
    const navigation = decodedNavigation ? JSON.parse(decodedNavigation) : {};
    return navigation;
  }

  static removeNavigation() {
    return Cookies.remove('navigate', { path: window.location.pathname });
  }

  static setWzMenu(isVisible = true) {
    const showMenu = updateShowMenu(isVisible);
    store.dispatch(showMenu);
  }
}
