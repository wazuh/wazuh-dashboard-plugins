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

      if (origin === HEALTH_CHECK) {
        const indexPatternFound = patternList.find((indexPattern) => indexPattern.title === pattern);

        if (!indexPatternFound && pattern) {
          // if no valid index patterns are found we try to create the wazuh-alerts-*
          try {
            getToasts().add({
              color: 'warning',
              title:
                `No ${pattern} index pattern was found, proceeding to create it.`,
              toastLifeTimeMs: 5000
            });

            if (await SavedObject.getExistingIndexPattern(pattern)) {
              await SavedObject.refreshIndexPattern(pattern);
              getToasts().addSuccess(`${pattern} index pattern updated successfully`);
            } else {
              await SavedObject.createWazuhIndexPattern(pattern);
              getToasts().addSuccess(`${pattern} index pattern created successfully`);
            }

            patternList = await SavedObject.getListOfWazuhValidIndexPatterns(defaultPatterns, origin);
            !AppState.getCurrentPattern() && AppState.setCurrentPattern(pattern);
          } catch (err) {
            getToasts().addDanger({
              title: 'Error creating the index pattern.',
              text: err.message || err,
              toastLifeTimeMs: 3000
            });
            AppState.removeCurrentPattern();

            return;
          }
        }
      }
      if (AppState.getCurrentPattern() && patternList.length) {
        let filtered = patternList.filter(
          item => item.id === AppState.getCurrentPattern()
        );
        if (!filtered.length) AppState.setCurrentPattern(patternList[0].id);
      }

      return patternList;
    } catch (error) {
      console.error("getPatternList", error)
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
    return;
  }

  /**
 * Refresh current pattern for the given pattern
 * @param {String} pattern
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
