/*
 * Wazuh app - Pattern Handler service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import GenericRequest from './generic-request';
import AppState from './app-state';
import SavedObject from './saved-objects';
import store from '../redux/store';
import { updateBlankScreenError } from '../redux/actions/appStateActions';
import { AppConfigState } from '../redux/types';
import { getDataPlugin, getToasts } from '../kibana-services';

/**
 * Get the available pattern list
 */
const getPatternList = async (where) => {
  const toasts = getToasts();
  try {
    var patternList = await SavedObject.getListOfWazuhValidIndexPatterns();

    if (where === 'healthcheck') {
      function getIndexPatterns() {
        return new Promise(function (resolve, reject) {
          setTimeout(async function () {
            var patternList = await SavedObject.getListOfWazuhValidIndexPatterns();
            resolve(patternList);
          }, 500);
        });
      }
      var i = 0;
      // if the index pattern doesn't exist yet, we check 5 more times with a delay of 500ms
      while (i < 5 && !patternList.length) {
        i++;
        patternList = await getIndexPatterns().then(function (result) {
          return result;
        });
      }
    }
    if (!patternList.length) {
      // if no valid index patterns are found we try to create the wazuh-alerts-*
      try {
        const { pattern } = (store.getState().appConfigReducer as AppConfigState).data;
        if (!pattern) return;

        toasts.add({
          color: 'warning',
          title: `No valid index patterns were found, proceeding to create default ${pattern} index pattern`,
          toastLifeTimeMs: 5000,
        });

        await SavedObject.createWazuhIndexPattern(pattern);
      } catch (err) {
        toasts.add({
          color: 'danger',
          title: 'Error creating the index pattern.',
          text: err.message || err,
          toastLifeTimeMs: 3000,
        });
        AppState.removeCurrentPattern();

        store.dispatch(
          updateBlankScreenError(
            'Sorry but no valid index patterns were found and creation was unsuccessful'
          )
        );
        if (
          !window.location.hash.includes('#/settings') &&
          !window.location.hash.includes('#/blank-screen')
        ) {
          window.location.href = '/app/wazuh#/blank-screen/';
        }
        return;
      }
      // retry again with the newly created index pattern
      if (
        !window.location.hash.includes('#/settings') &&
        !window.location.hash.includes('#/health-check')
      ) {
        window.location.href = '/app/wazuh#/health-check/';
      }
      patternList = await SavedObject.getListOfWazuhValidIndexPatterns();
    }
    if (AppState.getCurrentPattern() && patternList.length) {
      let filtered = patternList.filter((item) => item.id === AppState.getCurrentPattern());
      if (!filtered.length) AppState.setCurrentPattern(patternList[0].id);
    }

    return patternList;
  } catch (error) {
    console.error('getPatternList', error);
    throw new Error('Error Pattern Handler (getPatternList)');
  }
  return;
};

/**
 * Change current pattern for the given pattern
 * @param {String} selectedPattern
 */
const changePattern = async (selectedPattern) => {
  try {
    AppState.setCurrentPattern(selectedPattern);
    await GenericRequest.request('GET', `/elastic/known-fields/${selectedPattern}`, {});
    return AppState.getCurrentPattern();
  } catch (error) {
    throw new Error('Error Pattern Handler (changePattern)');
  }
  return;
};

/**
 * Refresh current pattern for the given pattern
 * @param {String} pattern
 */
const refreshIndexPattern = async () => {
  try {
    const currentPattern = AppState.getCurrentPattern();
    const courierData = await getDataPlugin().indexPatterns.get(currentPattern);
    await SavedObject.refreshIndexPattern(currentPattern);
    const fields = await courierData.fieldsFetcher.fetch({});
    await courierData.initFields(fields);
  } catch (error) {
    throw new Error(error);
  }
};

export default {
  getPatternList,
  changePattern,
  refreshIndexPattern,
};
