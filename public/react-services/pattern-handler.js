/*
 * Wazuh app - Pattern Handler service
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from './app-state';
import { SavedObject } from './saved-objects';
import { getDataPlugin, getToasts, getHttp } from '../kibana-services';
import { WazuhConfig } from '../react-services/wazuh-config';
import { HEALTH_CHECK } from '../../common/constants';
import store from '../redux/store';
import { updateIndexPatterns } from '../redux/actions/appStateActions';
import _ from 'lodash';

export class PatternHandler {
  /**
   * Get the available pattern list
   */
  static async getPatternList(origin) {
    try {
      const wazuhConfig = new WazuhConfig();
      const { pattern } = wazuhConfig.getConfig();

      const defaultPatterns = [pattern];
      const selectedPattern = AppState.getCurrentPattern();
      if (selectedPattern && selectedPattern !== pattern) defaultPatterns.push(selectedPattern);
      let patternList = await SavedObject.getListOfWazuhValidIndexPatterns(defaultPatterns, origin);

      if (!_.isEqual(patternList, store.getState().appStateReducers.indexPatterns)) {
        store.dispatch(updateIndexPatterns(patternList));
      }
      return patternList;
    } catch (error) {
      console.error('getPatternList', error);
      throw new Error('Error Pattern Handler (getPatternList)');
    }
  }

  /**
   * Change current pattern for the given pattern
   * @param {String} selectedPattern
   */
  static async changePattern(selectedPattern) {
    try {
      AppState.setCurrentPattern(selectedPattern);
      await this.refreshIndexPattern();
      return AppState.getCurrentPattern();
    } catch (error) {
      throw new Error('Error Pattern Handler (changePattern)');
    }
  }

  /**
   * Refresh current pattern for the given pattern
   * @param newFields
   */
  static async refreshIndexPattern(newFields = null) {
    try {
      const currentPattern = AppState.getCurrentPattern();
      const pattern = await getDataPlugin().indexPatterns.get(currentPattern);
      await SavedObject.refreshIndexPattern(pattern, newFields);
    } catch (error) {
      throw new Error(error);
    }
  }
}
