/*
 * Wazuh app - Check template for alerts index pattern service
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

import { AppState, GenericRequest, SavedObject } from '../../../../react-services';
import { CheckLogger } from '../../types/check_logger';

export const checkTemplateService = async (appConfig, checkLogger: CheckLogger) => {
  const patternId = AppState.getCurrentPattern();
  checkLogger.info(`Index pattern id in cookie: ${patternId ? `yes [${patternId}]` : 'no'}`);

  checkLogger.info(`Checking if the index pattern id [${patternId}] exists...`);
  const patternData = patternId ? (await SavedObject.existsIndexPattern(patternId)) : null;
  checkLogger.info(`Index pattern id [${patternId}] found: ${patternData.title ? `yes title [${patternData.title}]`: 'no'}`);

  if (patternData.title){
    checkLogger.info(`Checking if exists a template compatible with the index pattern title [${patternData.title}]`);
    const templateData = await GenericRequest.request('GET', `/elastic/template/${patternData.title}`);
    checkLogger.info(`Template found for the selected index-pattern title [${patternData.title}]: ${templateData.data.status ? 'yes': 'no'}`);
    if (!templateData.data.status) {
      checkLogger.error(`No template found for the selected index-pattern title [${patternData.title}]`);
    };
  }else{
    checkLogger.error(`Index pattern id [${patternId}] found: no`);
  };
};
