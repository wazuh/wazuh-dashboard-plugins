/*
 * Wazuh app - Check alerts index pattern service
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import { CheckLogger } from '../../types/check_logger';
import { checkFieldsService } from './check-fields.service';
import { checkIndexPatternObjectService } from './check-index-pattern-object.service';
import { checkTemplateService } from './check-template.service';
import { satisfyPluginPlatformVersion } from '../../../../../common/semver';

export const checkIndexPatternService = (appConfig) => async (checkLogger: CheckLogger) =>  await checkPattern(appConfig, checkLogger);

const checkPattern = async (appConfig, checkLogger: CheckLogger) =>  {
  if(!appConfig.data['checks.pattern']){
    checkLogger.info('Check [pattern]: disabled. Some minimal tasks will be done.');
  };
  await checkIndexPatternObjectService(appConfig, checkLogger);
  await checkTemplate(appConfig, checkLogger);
  if(satisfyPluginPlatformVersion('<7.11')){
    await checkFields(appConfig, checkLogger);
  };
};

const decoratorHealthCheckRunCheckEnabled = (checkKey, fn) => {
  return async (appConfig: any, checkLogger: CheckLogger) => {
    if(appConfig.data[`checks.${checkKey}`]){
      await fn(appConfig, checkLogger);
    }else{
      checkLogger.info(`Check [${checkKey}]: disabled. Skipped.`);
    };
  }
};

const checkTemplate = decoratorHealthCheckRunCheckEnabled('template', checkTemplateService);
const checkFields = decoratorHealthCheckRunCheckEnabled('fields', checkFieldsService);
