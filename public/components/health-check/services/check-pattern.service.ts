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
import { CheckLogger } from '../types/check_logger';

import {
  checkAlerts,
  checkFieldsService,
  checkTemplateService
} from './index';

export const checkPatternService = (appConfig) => async (checkLogger: CheckLogger) =>  await checkPattern(appConfig, checkLogger);

const checkPattern = async (appConfig, checkLogger: CheckLogger) =>  {
  if(!appConfig.data['check.pattern']){
    checkLogger.info('Index pattern check Disabled');
    await checkAlerts(appConfig, checkLogger);
  }else{
    await checkAlerts(appConfig, checkLogger);
    await checkTemplateService(appConfig);
    await checkFieldsService(appConfig); 
  }
  return;
};
