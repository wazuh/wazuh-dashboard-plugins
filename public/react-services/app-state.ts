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
  updateShowMenu,
  updateExtensions,
} from '../redux/actions/appStateActions';
import GenericRequest from './generic-request';
import { CSVRequest } from '../services/csv-request';
import * as FileSaver from '../services/file-saver';
import WzAuthentication from './wz-authentication';
import { AppConfigState } from '../redux/types';
import { getToasts } from '../kibana-services';

const getCachedExtensions = (id) => {
  const extensions = ((store.getState() || {}).appStateReducers || {}).extensions;
  if (Object.keys(extensions).length && extensions[id]) {
    return extensions[id];
  }
  return false;
};

/**
 * Returns if the extension 'id' is enabled
 * @param {id} id
 */
const getExtensions = async (id) => {
  try {
    const cachedExtensions = getCachedExtensions(id);
    if (cachedExtensions) {
      return cachedExtensions;
    } else {
      const data = await GenericRequest.request('GET', `/api/extensions/${id}`);

      const extensions = data.data.extensions;
      if (Object.keys(extensions).length) {
        setExtensions(id, extensions);
        return extensions;
      } else {
        const config = store.getState().appConfigReducer as AppConfigState;
        if (!config.isReady) return;
        const extensions = {
          audit: config.data['extensions.audit'],
          pci: config.data['extensions.pci'],
          gdpr: config.data['extensions.gdpr'],
          hipaa: config.data['extensions.hipaa'],
          nist: config.data['extensions.nist'],
          tsc: config.data['extensions.tsc'],
          oscap: config.data['extensions.oscap'],
          ciscat: config.data['extensions.ciscat'],
          aws: config.data['extensions.aws'],
          gcp: config.data['extensions.gcp'],
          virustotal: config.data['extensions.virustotal'],
          osquery: config.data['extensions.osquery'],
          docker: config.data['extensions.docker'],
        };
        setExtensions(id, extensions);
        return extensions;
      }
    }
  } catch (err) {
    console.log('Error get extensions');
    console.log(err);
    throw err;
  }
};

/**
 *  Sets a new value for the cookie 'currentExtensions' object
 * @param {*} id
 * @param {*} extensions
 */
const setExtensions = async (id, extensions) => {
  try {
    await GenericRequest.request('POST', '/api/extensions', {
      id,
      extensions,
    });
    const updateExtension = updateExtensions(id, extensions);
    store.dispatch(updateExtension);
  } catch (err) {
    console.log('Error set extensions');
    console.log(err);
    throw err;
  }
};

/**
 * Cluster setters and getters
 **/
const getClusterInfo = () => {
  try {
    const clusterInfo = Cookies.get('clusterInfo') ? decodeURI(Cookies.get('clusterInfo')) : false;
    return clusterInfo ? JSON.parse(clusterInfo) : {};
  } catch (err) {
    console.log('Error get cluster info');
    console.log(err);
    throw err;
  }
};

/**
 * Sets a new value to the cookie 'clusterInfo' object
 * @param {*} cluster_info
 */
const setClusterInfo = (cluster_info) => {
  try {
    const encodedClusterInfo = encodeURI(JSON.stringify(cluster_info));
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    if (cluster_info) {
      Cookies.set('clusterInfo', encodedClusterInfo, {
        expires: exp,
        path: window.location.pathname,
      });
    }
  } catch (err) {
    console.log('Error set cluster info');
    console.log(err);
    throw err;
  }
};

/**
 * Set a new value to the 'createdAt' cookie
 * @param {*} date
 */
const setCreatedAt = (date) => {
  try {
    const createdAt = encodeURI(date);
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    Cookies.set('createdAt', createdAt, {
      expires: exp,
      path: window.location.pathname,
    });
  } catch (err) {
    console.log('Error set createdAt date');
    console.log(err);
    throw err;
  }
};

/**
 * Get 'createdAt' value
 */
const getCreatedAt = () => {
  try {
    const createdAt = Cookies.get('createdAt') ? decodeURI(Cookies.get('createdAt')) : false;
    return createdAt ? createdAt : false;
  } catch (err) {
    console.log('Error get createdAt date');
    console.log(err);
    throw err;
  }
};

/**
 * Get 'API' value
 */
const getCurrentAPI = () => {
  try {
    const currentAPI = Cookies.get('currentApi');
    return currentAPI ? decodeURI(currentAPI) : false;
  } catch (err) {
    console.log('Error get current Api');
    console.log(err);
    throw err;
  }
};

/**
 * Remove 'API' cookie
 */
const removeCurrentAPI = () => {
  const updateApiMenu = updateCurrentApi(false);
  store.dispatch(updateApiMenu);
  return Cookies.remove('currentApi', { path: window.location.pathname });
};

/**
 * Set a new value to the 'API' cookie
 * @param {*} date
 */
const setCurrentAPI = (API) => {
  try {
    const encodedApi = encodeURI(API);
    const exp = new Date();
    exp.setDate(exp.getDate() + 365);
    if (API) {
      Cookies.set('currentApi', encodedApi, {
        expires: exp,
        path: window.location.pathname,
      });
      try {
        const updateApiMenu = updateCurrentApi(JSON.parse(API).id);
        store.dispatch(updateApiMenu);
        WzAuthentication.refresh();
      } catch (err) {}
    }
  } catch (err) {
    console.log('Error set current API');
    console.log(err);
    throw err;
  }
};

/**
 * Get 'APISelector' value
 */
const getAPISelector = () => {
  return Cookies.get('APISelector') ? decodeURI(Cookies.get('APISelector')) == 'true' : false;
};

/**
 * Set a new value to the 'patternSelector' cookie
 * @param {*} value
 */
const setAPISelector = (value) => {
  const encodedPattern = encodeURI(value);
  Cookies.set('APISelector', encodedPattern, {
    path: window.location.pathname,
  });
};

/**
 * Get 'patternSelector' value
 */
const getPatternSelector = () => {
  return Cookies.get('patternSelector')
    ? decodeURI(Cookies.get('patternSelector')) == 'true'
    : false;
};

/**
 * Set a new value to the 'patternSelector' cookie
 * @param {*} value
 */
const setPatternSelector = (value) => {
  const encodedPattern = encodeURI(value);
  Cookies.set('patternSelector', encodedPattern, {
    path: window.location.pathname,
  });
};

/**
 * Set a new value to the 'currentPattern' cookie
 * @param {*} newPattern
 */
const setCurrentPattern = (newPattern) => {
  const encodedPattern = encodeURI(newPattern);
  const exp = new Date();
  exp.setDate(exp.getDate() + 365);
  if (newPattern) {
    Cookies.set('currentPattern', encodedPattern, {
      expires: exp,
      path: window.location.pathname,
    });
  }
};

/**
 * Get 'currentPattern' value
 */
const getCurrentPattern = () => {
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
    setCurrentPattern(newPattern);
  }
  return Cookies.get('currentPattern') ? decodeURI(Cookies.get('currentPattern')) : '';
};

/**
 * Remove 'currentPattern' value
 */
const removeCurrentPattern = () => {
  return Cookies.remove('currentPattern', { path: window.location.pathname });
};

/**
 * Set a new value to the 'currentDevTools' cookie
 * @param {*} current
 **/
const setCurrentDevTools = (current) => {
  window.localStorage.setItem('currentDevTools', current);
};

/**
 * Get 'currentDevTools' value
 **/
const getCurrentDevTools = () => {
  return window.localStorage.getItem('currentDevTools');
};

/**
 * Add/Edit an item in the session storage
 * @param {*} key
 * @param {*} value
 */
const setSessionStorageItem = (key, value) => {
  window.sessionStorage.setItem(key, value);
};

/**
 * Returns session storage item
 * @param {*} key
 */
const getSessionStorageItem = (key) => {
  return window.sessionStorage.getItem(key);
};

/**
 * Remove an item from the session storage
 * @param {*} key
 */
const removeSessionStorageItem = (key) => {
  window.sessionStorage.removeItem(key);
};

const setNavigation = (params) => {
  const decodedNavigation = Cookies.get('navigate') ? decodeURI(Cookies.get('navigate')) : false;
  var navigate = decodedNavigation ? JSON.parse(decodedNavigation) : {};
  for (var key in params) {
    navigate[key] = params[key];
  }
  if (navigate) {
    const encodedURI = encodeURI(JSON.stringify(navigate));
    Cookies.set('navigate', encodedURI, { path: window.location.pathname });
  }
};

const getNavigation = () => {
  const decodedNavigation = Cookies.get('navigate') ? decodeURI(Cookies.get('navigate')) : false;
  const navigation = decodedNavigation ? JSON.parse(decodedNavigation) : {};
  return navigation;
};

const removeNavigation = () => {
  return Cookies.remove('navigate', { path: window.location.pathname });
};

const setWzMenu = (isVisible = true) => {
  const showMenu = updateShowMenu(isVisible);
  store.dispatch(showMenu);
};

const downloadCsv = async (path, fileName, filters = []) => {
  const toasts = getToasts();
  try {
    const csvReq = new CSVRequest();
    toasts.add({
      color: 'success',
      title: 'CSV',
      text: 'Your download should begin automatically...',
      toastLifeTimeMs: 4000,
    });
    const currentApi = JSON.parse(getCurrentAPI() || '{}').id;
    const output = await csvReq.fetch(path, currentApi, filters);
    const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

    FileSaver.saveAs(blob, fileName);
  } catch (error) {
    toasts.add({
      color: 'success',
      title: 'CSV',
      text: 'Error generating CSV',
      toastLifeTimeMs: 4000,
    });
  }
  return;
};

export default {
  getCachedExtensions,
  getExtensions,
  setExtensions,
  getClusterInfo,
  setClusterInfo,
  setCreatedAt,
  getCreatedAt,
  getCurrentAPI,
  removeCurrentAPI,
  setCurrentAPI,
  getAPISelector,
  setAPISelector,
  getPatternSelector,
  setPatternSelector,
  setCurrentPattern,
  getCurrentPattern,
  removeCurrentPattern,
  setCurrentDevTools,
  getCurrentDevTools,
  setSessionStorageItem,
  getSessionStorageItem,
  removeSessionStorageItem,
  setNavigation,
  getNavigation,
  removeNavigation,
  setWzMenu,
  downloadCsv,
};
