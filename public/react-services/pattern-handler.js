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

export class PatternHandler {
  /**
   * Get the available pattern list
   */
  static async getPatternList() {
    try {
      const patternList = await GenericRequest.request(
        'GET',
        '/elastic/index-patterns',
        {}
      );

      if (!patternList.data.data.length) {
        AppState.removeCurrentPattern();

        this.wzMisc = new WzMisc();
        this.wzMisc.setBlankScr('Sorry but no valid index patterns were found');
        if (
          !window.location.hash.includes('#/settings') &&
          !window.location.hash.includes('#/blank-screen')
        ) {
          window.location.href = '/app/wazuh#/blank-screen/';
        }
        return;
      }

      if (AppState.getCurrentPattern()) {
        let filtered = patternList.data.data.filter(
          item => item.id === AppState.getCurrentPattern()
        );
        if (!filtered.length)
          AppState.setCurrentPattern(patternList.data.data[0].id);
      }

      return patternList.data.data;
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
