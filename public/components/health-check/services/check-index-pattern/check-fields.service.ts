/*
 * Wazuh app - Check index pattern fields service
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

import { AppState, SavedObject } from '../../../../react-services';
import { getDataPlugin } from '../../../../kibana-services';
import { CheckLogger } from '../../types/check_logger';

export const checkFieldsService = async (appConfig, checkLogger: CheckLogger) => {
  const patternId = AppState.getCurrentPattern();
  checkLogger.info(`Index pattern id in cookie: [${patternId}]`);
  
  checkLogger.info(`Getting index pattern data [${patternId}]...`);
  const pattern = await getDataPlugin().indexPatterns.get(patternId);
  checkLogger.info(`Index pattern data found: [${pattern ? 'yes' : 'no'}]`);
  
  checkLogger.info(`Refreshing index pattern fields: title [${pattern.title}], id [${pattern.id}]...`);
  await SavedObject.refreshIndexPattern(pattern, null);
  checkLogger.action(`Refreshed index pattern fields: title [${pattern.title}], id [${pattern.id}]`);
};
