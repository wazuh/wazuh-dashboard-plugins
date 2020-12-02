/*
 * Wazuh app - Check Pattern Service
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import { SavedObject } from '../../../react-services/saved-objects';
import { AppState } from '../../../react-services/app-state';
import { PatternHandler } from '../../../react-services/pattern-handler';
import { WAZUH_MONITORING_PATTERN } from '../../../../util/constants';

const validateDefaultPattern = async () => {
  /* This extra check will work as long as Wazuh monitoring index ID is wazuh-monitoring-*.
           Currently is not possible to change that index pattern as it has always been created on our backend.
           This extra check checks if the index pattern exists for the current logged in user
           in case it doesn't exist, the index pattern is automatically created. This is necessary to make it work with Opendistro multinenancy
           as every index pattern is stored in its current tenant .kibana-tenant-XX index. 
           */
  try {
    await SavedObject.existsMonitoringIndexPattern(WAZUH_MONITORING_PATTERN); //this checks if it exists, if not it automatically creates the index pattern
  } catch (err) {}
};

export const checkPatternService = async (): Promise<{ errors: string[] }> => {
  const patternId = AppState.getCurrentPattern();
  let errors: string[] = [];
  let patternData = patternId ? await SavedObject.existsIndexPattern(patternId) : false;
  if (!patternData) patternData = {};

  await validateDefaultPattern();

  if (!patternData.status) {
    const patternList = await PatternHandler.getPatternList('healthcheck');
    if (patternList.length) {
      const currentPattern = patternList[0].id;
      AppState.setCurrentPattern(currentPattern);
      return await checkPatternService();
    } else {
      errors.push('The selected index-pattern is not present.');
    }
  }
  return { errors };
};
