/*
 * Wazuh app - Saved Objects management service
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { GenericRequest } from './generic-request';
import { KnownFields } from '../utils/known-fields';
import { FieldsStatistics } from '../utils/statistics-fields';
import { FieldsMonitoring } from '../utils/monitoring-fields';
import { WAZUH_INDEX_TYPE_MONITORING, WAZUH_INDEX_TYPE_STATISTICS, WAZUH_INDEX_TYPE_ALERTS} from '../../common/constants';

export class SavedObject {
  /**
   *
   * Returns the full list of index patterns
   */
  static async getListOfIndexPatterns() {
    try {
      const result = await GenericRequest.request(
        'GET',
        `/api/saved_objects/_find?type=index-pattern&search_fields=title`
      );
      const indexPatterns = ((result || {}).data || {}).saved_objects || [];

      return indexPatterns;
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  /**
   *
   * Returns the full list of index patterns that are valid
   * An index is valid if its fields contain at least these 4 fields: 'timestamp', 'rule.groups', 'agent.id' and 'manager.name'
   */
  static async getListOfWazuhValidIndexPatterns() {
    try {
      const list = await this.getListOfIndexPatterns();
      const result = list.filter(item => {
        if (item.attributes && item.attributes.fields) {
          const fields = JSON.parse(item.attributes.fields);
          const minimum = {
            timestamp: true,
            'rule.groups': true,
            'manager.name': true,
            'agent.id': true
          };
          let validCount = 0;

          fields.map(currentField => {
            if (minimum[currentField.name]) {
              validCount++;
            }
          });

          if (validCount === 4) {
            return true;
          }
        }
        return false;
      });

      const validIndexPatterns = result.map(item => {
        return { id: item.id, title: item.attributes.title };
      });
      return validIndexPatterns;
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  static async existsOrCreateIndexPattern(patternID) {
    const result = await SavedObject.existsIndexPattern(patternID);
    if (!result.data) {
      const fields = await SavedObject.getIndicesFields(patternID, WAZUH_INDEX_TYPE_ALERTS);
      await this.createSavedObject(
        'index-pattern',
        patternID,
        {
          attributes: {
            title: patternID,
            timeFieldName: 'timestamp'
          }
        },
        fields
      );
    }
  }


  /**
   *
   * Given an index pattern ID, checks if it exists
   */
  static async existsIndexPattern(patternID) {
    try {
      const result = await GenericRequest.request(
        'GET',
        `/api/saved_objects/index-pattern/${patternID}`
      );

      const title = (((result || {}).data || {}).attributes || {}).title;
      if (title) {
        return {
          data: 'Index pattern found',
          status: true,
          statusCode: 200,
          title: title
        };
      }
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  static async createSavedObject(type, id, params, fields = '') {
    try {
      const result = await GenericRequest.request(
        'POST',
        `/api/saved_objects/${type}/${id}`,
        params
      );

      if (type === 'index-pattern')
        await this.refreshFieldsOfIndexPattern(id, params.attributes.title, fields);

      return result;
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  static async refreshFieldsOfIndexPattern(id, title, fields) {
    try {
      // same logic as Kibana when a new index is created, you need to refresh it to see its fields
      // we force the refresh of the index by requesting its fields and the assign these fields
      await GenericRequest.request(
        'PUT',
        `/api/saved_objects/index-pattern/${id}`,
        {
          attributes: {
            fields: JSON.stringify(fields),
            timeFieldName: 'timestamp',
            title: title,
            retry_on_conflict: 4,
          },
        }
      );
      return;
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  /**
   * Refresh an index pattern
   */
  static async refreshIndexPattern(pattern) {
    try {
      const fields = await SavedObject.getIndicesFields(pattern.title, WAZUH_INDEX_TYPE_ALERTS);
      await this.refreshFieldsOfIndexPattern(pattern.id, pattern.title, fields);

      return;
    } catch (error) {
      console.log(error)
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  /**
   * Creates the 'wazuh-alerts-*'  index pattern
   */
  static async createWazuhIndexPattern(pattern) {
    try {
      const fields = await SavedObject.getIndicesFields(pattern, WAZUH_INDEX_TYPE_ALERTS);
      await this.createSavedObject(
        'index-pattern',
        pattern,
        {
          attributes: {
            title: pattern,
            timeFieldName: 'timestamp',
            fieldFormatMap: `{
              "data.virustotal.permalink":{"id":"url"},
              "data.vulnerability.reference":{"id":"url"},
              "data.url":{"id":"url"}
            }`,
            sourceFilters: '[{"value":"@timestamp"}]'
          }
        },
        fields
      );
      return;
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  static getIndicesFields = async (pattern, indexType) => GenericRequest.request(
    //we check if indices exist before creating the index pattern
    'GET',
    `/api/index_patterns/_fields_for_wildcard?pattern=${pattern}&meta_fields=_source&meta_fields=_id&meta_fields=_type&meta_fields=_index&meta_fields=_score`,
    {}
  ).then(response => response.data.fields).catch(() => {
    switch (indexType) {
      case WAZUH_INDEX_TYPE_MONITORING:
        return FieldsMonitoring;
      case WAZUH_INDEX_TYPE_STATISTICS:
        return FieldsStatistics;
      case WAZUH_INDEX_TYPE_ALERTS:
        return KnownFields
    }
  })
}
