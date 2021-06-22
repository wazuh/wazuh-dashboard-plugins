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
import { CheckLogger } from '../../types/check_logger';
import { checkFieldsService } from './check-fields.service';
import { checkIndexPatternObjectService } from './check-index-pattern-object.service';
import { checkTemplateService } from './check-template.service';

export const checkIndexPatternService = (appConfig) => async (checkLogger: CheckLogger) =>  await checkPattern(appConfig, checkLogger);

const checkPattern = async (appConfig, checkLogger: CheckLogger) =>  {
  if(appConfig.data['check.pattern'] === 'false'){
    checkLogger.info('Index pattern check Disabled');
    await checkIndexPatternObjectService(appConfig, checkLogger);
  }else{
    await checkIndexPatternObjectService(appConfig, checkLogger);
    await checkTemplateService(appConfig, checkLogger);
    await checkFieldsService(appConfig, checkLogger); 
  }
  return;
};
