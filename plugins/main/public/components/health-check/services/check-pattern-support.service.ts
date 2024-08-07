/*
 * Wazuh app - Check index pattern support service
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
import { SavedObject } from '../../../react-services';
import { WarningError } from '../../../react-services/error-management/error-factory/errors/WarningError';
import { CheckLogger } from '../types/check_logger';

export const checkPatternSupportService =
  (pattern: string, indexType: string, timeFieldName?: string) =>
  async (checkLogger: CheckLogger) => {
    checkLogger.info(`Checking index pattern id [${pattern}] exists...`);
    const result = await SavedObject.existsIndexPattern(pattern);
    checkLogger.info(
      `Exist index pattern id [${pattern}]: ${result.data ? 'yes' : 'no'}`,
    );

    if (!result.data) {
      try {
        checkLogger.info(
          `Getting indices fields for the index pattern id [${pattern}]...`,
        );
        const fields = await SavedObject.getIndicesFields(pattern, indexType);
        checkLogger.info(
          `Fields for index pattern id [${pattern}] found: ${fields.length}`,
        );
        checkLogger.info(`Creating saved object for the index pattern with id [${pattern}].
  title: ${pattern}
  id: ${pattern}
  timeFieldName: ${timeFieldName}
  ${fields ? `fields: ${fields.length}` : ''}`);
        await SavedObject.createSavedObjectIndexPattern(
          'index-pattern',
          pattern,
          {
            attributes: {
              title: pattern,
              timeFieldName,
            },
          },
          fields,
        );
        checkLogger.action(
          `Created the saved object for the index pattern id [${pattern}]`,
        );
        const indexPatternSavedObjectIDs = [pattern];
        // Check the index pattern saved objects can be found using `GET /api/saved_objects/_find` endpoint.
        // Related issue: https://github.com/wazuh/wazuh-dashboard-plugins/issues/4293
        checkLogger.info(
          `Checking the integrity of saved objects. Validating ${indexPatternSavedObjectIDs.join(
            ',',
          )} can be found...`,
        );
        await SavedObject.validateIndexPatternSavedObjectCanBeFound(
          indexPatternSavedObjectIDs,
        );
        checkLogger.info('Integrity of saved objects: [ok]');
      } catch (error) {
        if (error instanceof WarningError) {
          checkLogger.warning(error.message);
        } else {
          checkLogger.error(
            `Error creating index pattern id [${pattern}]: ${
              error.message || error
            }`,
          );
        }
      }
    }
  };
