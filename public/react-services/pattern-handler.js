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
import { GenericRequest } from './generic-request';
import { AppState } from './app-state';
import { WzMisc } from '../factories/misc';
import { SavedObject } from './saved-objects';
import { toastNotifications } from 'ui/notify';

export class PatternHandler {
  /**
   * Get the available pattern list
   */
  static async getPatternList() {
    try {
      var patternList = await SavedObject.getListOfWazuhValidIndexPatterns();
      if (!patternList.length) {
        // if no valid index patterns are found we try to create the wazuh-alerts-3.x-*
        try {
          toastNotifications.add({
            color: 'warning',
            title:
              'No valid index patterns were found, proceeding to create default wazuh-alerts-3.x-* index pattern',
            toastLifeTimeMs: 5000
          });

          await SavedObject.createWazuhIndexPattern();
        } catch (err) {
          toastNotifications.add({
            color: 'error',
            title: 'Error creating the index pattern.',
            toastLifeTimeMs: 3000
          });
          AppState.removeCurrentPattern();

          this.wzMisc = new WzMisc();
          this.wzMisc.setBlankScr(
            'Sorry but no valid index patterns were found and creation was unsuccessful'
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

      if (AppState.getCurrentPattern()) {
        let filtered = patternList.filter(
          item => item.id === AppState.getCurrentPattern()
        );
        if (!filtered.length) AppState.setCurrentPattern(patternList[0].id);
      }

      return patternList;
    } catch (error) {
      throw new Error('Error Pattern Handler (getPatternList)');
    }
    return;
  }

  /**
   * Change current pattern for the given pattern
   * @param {String} selectedPattern
   */
  static async changePattern(selectedPattern) {
    try {
      AppState.setCurrentPattern(selectedPattern);
      await GenericRequest.request(
        'GET',
        `/elastic/known-fields/${selectedPattern}`,
        {}
      );
      return AppState.getCurrentPattern();
    } catch (error) {
      throw new Error('Error Pattern Handler (changePattern)');
    }
    return;
  }
}
