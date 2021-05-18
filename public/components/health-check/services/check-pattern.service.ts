/*
 * Wazuh app - Check alerts index pattern service
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
import { AppState, SavedObject } from '../../../react-services';
import { getDataPlugin } from '../../../kibana-services';
import { HEALTH_CHECK } from '../../../../common/constants';
import { CheckLogger } from '../types/check_logger';

export const checkPatternService = (appConfig) => async (checkLogger: CheckLogger) => await checkEventsPattern(appConfig, checkLogger);

const checkEventsPattern = async (appConfig, checkLogger) => {
  const patternId: string = AppState.getCurrentPattern();
  const defaultPatternId: string = appConfig.data['pattern'];
  checkLogger.info(`Index pattern id in cookie: ${patternId ? `yes [${patternId}]` : 'no'}`);

  const defaultIndexPatterns: string[] = [
    defaultPatternId,
    ...(patternId && patternId !== defaultPatternId ? [patternId] : [])
  ];
  checkLogger.info(`Getting list of valid index patterns...`);
  let listValidIndexPatterns = await SavedObject.getListOfWazuhValidIndexPatterns(defaultIndexPatterns, HEALTH_CHECK);
  checkLogger.info(`Valid index patterns found: ${listValidIndexPatterns.length || 0}`);

  const indexPatternDefaultFound = listValidIndexPatterns.find((indexPattern) => indexPattern.title === defaultPatternId);
  checkLogger.info(`Found default index pattern with title [${defaultPatternId}]: ${indexPatternDefaultFound ? 'yes' : 'no'}`);

  if (!indexPatternDefaultFound && defaultPatternId) {
    // if no valid index patterns are found we try to create the wazuh-alerts-*
    try {
      
      checkLogger.info(`Checking if index pattern [${defaultPatternId}] exists...`);
      const existDefaultIndexPattern = await SavedObject.getExistingIndexPattern(defaultPatternId);
      checkLogger.info(`Index pattern id [${defaultPatternId}] exists: ${existDefaultIndexPattern ? 'yes' : 'no'}`);
      if (existDefaultIndexPattern) {
        checkLogger.info(`Refreshing index pattern fields [${defaultPatternId}]...`);
        await SavedObject.refreshIndexPattern(defaultPatternId);
        checkLogger.action(`Refreshed index pattern fields [${defaultPatternId}]`);
      } else {
        checkLogger.info(`Creating index pattern [${defaultPatternId}]...`);
        await SavedObject.createWazuhIndexPattern(defaultPatternId);
        checkLogger.action(`Created index pattern [${defaultPatternId}]`);
      }
      checkLogger.info(`Getting list of valid index patterns [${patternId}]...`);
      listValidIndexPatterns = await SavedObject.getListOfWazuhValidIndexPatterns(defaultIndexPatterns, HEALTH_CHECK);
      checkLogger.info(`Valid index patterns found: ${listValidIndexPatterns.length || 0}`);
      if(!AppState.getCurrentPattern()){
        AppState.setCurrentPattern(defaultPatternId);
        checkLogger.info(`Index pattern set in cookie: [${defaultPatternId}]`);
      }
    } catch (error) {
      AppState.removeCurrentPattern();
      checkLogger.info(`Removed current pattern from cookie: [${patternId}]`);

      throw error;
    }
  }

  if (AppState.getCurrentPattern() && listValidIndexPatterns.length) {
    const indexPatternToSelect = listValidIndexPatterns.find(item => item.id === AppState.getCurrentPattern());
    if (!indexPatternToSelect){
      AppState.setCurrentPattern(indexPatternToSelect.id);
      checkLogger.action(`Set index pattern id in cookie: [${indexPatternToSelect.id}]`);
    };
  }
  
  checkLogger.info(`Checking the app default pattern exists: id [${defaultPatternId}]...`); 
  const existsDefaultPattern = await SavedObject.existsIndexPattern(defaultPatternId);
  checkLogger.info(`Default pattern with id [${defaultPatternId}] exists: ${existsDefaultPattern.status ? 'yes' : 'no'}`); 
  
  existsDefaultPattern.status
    && getDataPlugin().indexPatterns.setDefault(defaultPatternId, true)
    && checkLogger.action(`Default pattern id [${defaultPatternId}] set as default index pattern`);

  patternId && checkLogger.info(`Checking the index pattern id [${patternId}] exists...`);
  const patternData = patternId ? (await SavedObject.existsIndexPattern(patternId)) || {} : {} ;
  patternId && checkLogger.info(`Index pattern id exists [${patternId}]: ${patternData.status ? 'yes': 'no'}`);

  if (!patternData.status) {
    if (listValidIndexPatterns.length) {
      const indexPatternDefaultFound = listValidIndexPatterns.find((indexPattern) => indexPattern.title === defaultPatternId);
      checkLogger.info(`Index pattern id exists [${defaultPatternId}]: ${indexPatternDefaultFound ? 'yes': 'no'}`);
      if(indexPatternDefaultFound){
        AppState.setCurrentPattern(indexPatternDefaultFound.id);
        checkLogger.action(`Index pattern set in cookie: [${indexPatternDefaultFound.id}]`);
      }
      checkLogger.info('Retring the check...');
      return await checkEventsPattern(appConfig, checkLogger);
    } else {
      checkLogger.error('The selected index-pattern is not present');
    }
  }
};
