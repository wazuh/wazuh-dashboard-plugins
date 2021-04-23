/*
 * Wazuh app - Check Pattern Service
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import { AppState, SavedObject, PatternHandler } from '../../../react-services';
import { getDataPlugin } from '../../../kibana-services';
import { HEALTH_CHECK } from '../../../../common/constants';

export const checkPatternService = async (appConfig): Promise<{ errors: string[] }> => {
  const patternId = AppState.getCurrentPattern();
  let errors: string[] = [];
  const existsDefaultPattern = await SavedObject.existsIndexPattern(appConfig.data['pattern']);    
  existsDefaultPattern.status && getDataPlugin().indexPatterns.setDefault(appConfig.data['pattern'], true);
  let patternData = patternId ? await SavedObject.existsIndexPattern(patternId) : false;
  if (!patternData) patternData = {};

  if (!patternData.status) {
    const patternList = await PatternHandler.getPatternList(HEALTH_CHECK);
    if (patternList.length) {
      const indexPatternDefault = patternList.find((indexPattern) => indexPattern.title === appConfig.data['pattern']);
      indexPatternDefault && AppState.setCurrentPattern(indexPatternDefault.id);
      return await checkPatternService(appConfig);
    } else {
      errors.push('The selected index-pattern is not present.');
    }
  }
  return { errors };
};
