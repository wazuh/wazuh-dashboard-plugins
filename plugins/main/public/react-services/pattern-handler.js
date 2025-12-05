/*
 * Wazuh app - Pattern Handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { SavedObject } from './saved-objects';
import { getDataPlugin } from '../kibana-services';
import { AppState } from './app-state';

export class PatternHandler {
  /**
   * Get the available pattern list
   */
  static async getPatternList(origin) {
    try {
      const pattern = await AppState.getCurrentPattern();

      const defaultPatterns = [pattern];
      let patternList = await SavedObject.getListOfWazuhValidIndexPatterns(
        defaultPatterns,
        origin,
      );

      return patternList;
    } catch (error) {
      console.error('getPatternList', error);
      throw new Error('Error Pattern Handler (getPatternList)');
    }
  }

  /**
   * Refresh current pattern for the given pattern
   * @param newFields
   */
  static async refreshIndexPattern() {
    try {
      const currentPattern = await AppState.getCurrentPattern();
      const pattern = await getDataPlugin().indexPatterns.get(currentPattern);
      await SavedObject.refreshIndexPattern(pattern);
    } catch (error) {
      throw new Error(error);
    }
  }
}
