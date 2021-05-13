/*
 * Wazuh app - Check Pattern Support Service
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
import { getToasts } from '../../../kibana-services';

export const checkPatternSupportService = async (pattern: string, indexType : string): Promise<{ errors: string[] }> => {
  const errors: string[] = [];
  const result = await SavedObject.existsIndexPattern(pattern);
  if (!result.data) {
    const toast = getToasts().addWarning(`${pattern} index pattern was not found and it will be created`);
    const fields = await SavedObject.getIndicesFields(pattern, indexType);
    try {
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
      getToasts().remove(toast.id);
      getToasts().addSuccess(`${pattern} index pattern created successfully`);
    } catch (error) {
      getToasts().remove(toast.id);
      errors.push(`Error trying to create ${pattern} index pattern: ${error.message}`);
    }
  };
  return { errors };
}
