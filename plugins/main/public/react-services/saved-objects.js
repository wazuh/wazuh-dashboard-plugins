/*
 * Wazuh app - Saved Objects management service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { GenericRequest } from './generic-request';
import { getKnownFieldsByIndexType } from '../utils/known-fields-loader';
import {
  HEALTH_CHECK,
  NOT_TIME_FIELD_NAME_INDEX_PATTERN,
  PLUGIN_PLATFORM_NAME,
  WAZUH_INDEX_TYPE_EVENTS,
} from '../../common/constants';
import { getDataPlugin, getSavedObjects } from '../kibana-services';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { ErrorFactory } from './error-management';
import { WarningError } from './error-management/error-factory/errors/WarningError';

export class SavedObject {
  // Fetch a dashboard saved object by id using SavedObjects client and filter by id client-side
  static async getDashboardById(dashboardID) {
    try {
      // Request dashboards via SavedObjects client; include common fields to avoid a second fetch
      return await getSavedObjects().client.get('dashboard', dashboardID);
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  static async refreshFieldsOfIndexPattern(
    id,
    title,
    fields,
    timeFieldName = 'timestamp',
  ) {
    try {
      // same logic as plugin platform when a new index is created, you need to refresh it to see its fields
      // we force the refresh of the index by requesting its fields and the assign these fields
      await GenericRequest.request(
        'PUT',
        `/api/saved_objects/index-pattern/${id}`,
        {
          attributes: {
            fields: JSON.stringify(fields),
            timeFieldName:
              timeFieldName !== NOT_TIME_FIELD_NAME_INDEX_PATTERN
                ? timeFieldName
                : undefined,
            title: title,
          },
        },
      );
    } catch (error) {
      throw error?.data?.message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  static getIndicesFields = async (pattern, indexType) => {
    try {
      const response = await GenericRequest.request(
        //we check if indices exist before creating the index pattern
        'GET',
        `/api/index_patterns/_fields_for_wildcard?pattern=${pattern}&meta_fields=_source&meta_fields=_id&meta_fields=_type&meta_fields=_index&meta_fields=_score`,
        {},
      );
      return response.data.fields;
    } catch (error) {
      if (indexType) {
        const statesFields = getKnownFieldsByIndexType(indexType);
        if (statesFields) {
          return statesFields;
        }
      }
      const statesError = ErrorFactory.create(WarningError, {
        error,
        message: `No known fields defined for index type: ${indexType}`,
      });
      throw statesError;
    }
  };
}
