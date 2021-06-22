/*
 * Wazuh app - Check index pattern support service
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
import { SavedObject } from '../../../react-services';
import { CheckLogger } from '../types/check_logger';

export const checkPatternSupportService = (pattern: string, indexType : string) => async (checkLogger: CheckLogger) => {
  checkLogger.info(`Checking index pattern id [${pattern}] exists...`);
  const result = await SavedObject.existsIndexPattern(pattern);
  checkLogger.info(`Exist index pattern id [${pattern}]: ${result.data ? 'yes' : 'no'}`);
  
  if (!result.data) {
    checkLogger.info(`Getting indices fields for the index pattern id [${pattern}]...`);
    const fields = await SavedObject.getIndicesFields(pattern, indexType);
    checkLogger.info(`Fields for index pattern id [${pattern}] found: ${fields.length}`);
  
    try {
      checkLogger.info(`Creating saved object for the index pattern with id [${pattern}].
  title: ${pattern}
  id: ${pattern}
  timeFieldName: timestamp
  fields: ${fields.length}`);
      await SavedObject.createSavedObject(
        'index-pattern',
        pattern,
        {
          attributes: {
            title: pattern,
            timeFieldName: 'timestamp'
          }
        },
        fields
      );
      checkLogger.action(`Created the saved object for the index pattern id [${pattern}]`);
    } catch (error) {
      checkLogger.error(`Error creating index pattern id [${pattern}]: ${error.message || error}`);
    }
  };
}
