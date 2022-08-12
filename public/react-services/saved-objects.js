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
import { KnownFields } from '../utils/known-fields';
import { FieldsStatistics } from '../utils/statistics-fields';
import { FieldsMonitoring } from '../utils/monitoring-fields';
import {
  HEALTH_CHECK,
  PLUGIN_PLATFORM_NAME,
  WAZUH_INDEX_TYPE_ALERTS,
  WAZUH_INDEX_TYPE_MONITORING,
  WAZUH_INDEX_TYPE_STATISTICS,
} from '../../common/constants';
import { satisfyPluginPlatformVersion } from '../../common/semver';
import { getSavedObjects } from '../kibana-services';
import { webDocumentationLink } from '../../common/services/web_documentation';

export class SavedObject {
  /**
   *
   * Returns the full list of index patterns
   */
  static async getListOfIndexPatterns() {
    const savedObjects = await GenericRequest.request(
      'GET',
      `/api/saved_objects/_find?type=index-pattern&fields=title&fields=fields&per_page=9999`
      );
      let indexPatterns = ((savedObjects || {}).data || {}).saved_objects || [];

    let indexPatternsFields;
    if(satisfyPluginPlatformVersion('<7.11')){
      indexPatternsFields = indexPatterns.map(indexPattern => indexPattern?.attributes?.fields ? JSON.parse(indexPattern.attributes.fields) : []);
    }else if(satisfyPluginPlatformVersion('>=7.11')){
      indexPatternsFields = await Promise.all(indexPatterns.map(async indexPattern => {
        try{
          const {data: {fields}} = await GenericRequest.request(
            'GET',
            `/api/index_patterns/_fields_for_wildcard?pattern=${indexPattern.attributes.title}`,
            {}
          );
          return fields;
        }catch(error){
          return [];
        }
      }));
    }
    return indexPatterns.map((indexPattern, idx) => ({...indexPattern, _fields: indexPatternsFields[idx]}));
  }

  /**
   *
   * Returns the full list of index patterns that are valid
   * An index is valid if its fields contain at least these 4 fields: 'timestamp', 'rule.groups', 'agent.id' and 'manager.name'
   */
  static async getListOfWazuhValidIndexPatterns(defaultIndexPatterns, where) {
    let result = [];
    if (where === HEALTH_CHECK) {
      const list = await Promise.all(
        defaultIndexPatterns.map(
          async (pattern) => await SavedObject.getExistingIndexPattern(pattern)
        )
      );
      result = this.validateIndexPatterns(list);
    }

    if (!result.length) {
      const list = await this.getListOfIndexPatterns();
      result = this.validateIndexPatterns(list);
    }

    return result.map((item) => {
      return { id: item.id, title: item.attributes.title };
    });
  }

  static validateIndexPatterns(list) {
    const requiredFields = [
      'timestamp',
      'rule.groups',
      'manager.name',
      'agent.id',
    ];
    return list.filter(item => item && item._fields && requiredFields.every((reqField => item._fields.some(field => field.name === reqField))));
  }

  static async existsOrCreateIndexPattern(patternID) {
    const result = await SavedObject.existsIndexPattern(patternID);
    if (!result.data) {
      let fields = '';
      if (satisfyPluginPlatformVersion('<7.11')) {
        fields = await SavedObject.getIndicesFields(patternID, WAZUH_INDEX_TYPE_ALERTS);
      }
      await this.createSavedObject(
        'index-pattern',
        patternID,
        {
          attributes: {
            title: patternID,
            timeFieldName: 'timestamp',
          },
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
      const indexPatternData = await GenericRequest.request(
        'GET',
        `/api/saved_objects/index-pattern/${patternID}?fields=title&fields=fields`
      );

      const title = (((indexPatternData || {}).data || {}).attributes || {}).title;
      const id = ((indexPatternData || {}).data || {}).id;

      if (title) {
        return {
          data: 'Index pattern found',
          status: true,
          statusCode: 200,
          title,
          id,
        };
      }
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  /**
   *
   * Given an index pattern ID, checks if it exists
   */
  static async getExistingIndexPattern(patternID) {
    try {
      const indexPatternData = await GenericRequest.request(
        'GET',
        `/api/saved_objects/index-pattern/${patternID}?fields=title&fields=fields`,
        null,
        true
      );
      let indexPatternFields;
      if(satisfyPluginPlatformVersion('<7.11')){
        indexPatternFields = indexPatternData?.data?.attributes?.fields ? JSON.parse(indexPatternData.data.attributes.fields) : [];
      }else if(satisfyPluginPlatformVersion('>=7.11')){
        try{
          const {data: {fields}} = await GenericRequest.request(
            'GET',
            `/api/index_patterns/_fields_for_wildcard?pattern=${indexPatternData.data.attributes.title}`,
            {}
          );
          indexPatternFields = fields;
        } catch (error) {
          indexPatternFields = [];
        }
      }
      return { ...indexPatternData.data, ...{ _fields: indexPatternFields } };
    } catch (error) {
      if (error && error.response && error.response.status == 404) return false;
      return Promise.reject(
        ((error || {}).data || {}).message || false
          ? error.data.message
          : error.message || `Error getting the '${patternID}' index pattern`
      );
    }
  }

  static async createSavedObject(type, id, params, fields = '') {
    try {
      const result = await GenericRequest.request(
        'POST',
        `/api/saved_objects/${type}/${id}`,
        params
      );

      if (satisfyPluginPlatformVersion('<7.11') && type === 'index-pattern') {
        await this.refreshFieldsOfIndexPattern(id, params.attributes.title, fields);
      }

      return result;
    } catch (error) {
      throw ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  static async refreshFieldsOfIndexPattern(id, title, fields) {
    try {
      // same logic as plugin platform when a new index is created, you need to refresh it to see its fields
      // we force the refresh of the index by requesting its fields and the assign these fields
      await GenericRequest.request(
        'PUT',
        `/api/saved_objects/index-pattern/${id}`,
        {
          attributes: {
            fields: JSON.stringify(fields),
            timeFieldName: 'timestamp',
            title: title
          },
        }
      );
    } catch (error) {
      throw ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  /**
   * Refresh an index pattern
   * Optionally force a new field
   */
  static async refreshIndexPattern(pattern, newFields = null) {
    try {
      const fields = await SavedObject.getIndicesFields(pattern.title, WAZUH_INDEX_TYPE_ALERTS);

      if (newFields && typeof newFields == 'object')
        Object.keys(newFields).forEach((fieldName) => {
          if (this.isValidField(newFields[fieldName])) fields.push(newFields[fieldName]);
        });

      await this.refreshFieldsOfIndexPattern(pattern.id, pattern.title, fields);
    } catch (error) {
      return ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  /**
   * Checks the field has a proper structure
   * @param {index-pattern-field} field
   */
  static isValidField(field) {
    if (field == null || typeof field != 'object') return false;

    const isValid = [
      'name',
      'type',
      'esTypes',
      'searchable',
      'aggregatable',
      'readFromDocValues',
    ].reduce((ok, prop) => {
      return ok && Object.keys(field).includes(prop);
    }, true);
    return isValid;
  }

  /**
   * Creates the 'wazuh-alerts-*'  index pattern
   */
  static async createWazuhIndexPattern(pattern) {
    try {
      const fields = satisfyPluginPlatformVersion('<7.11')
        ? await SavedObject.getIndicesFields(pattern, WAZUH_INDEX_TYPE_ALERTS)
        : '';
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
            fields: '[]',
            sourceFilters: '[{"value":"@timestamp"}]',
          },
        },
        fields
      );
      return;
    } catch (error) {
      throw ((error || {}).data || {}).message || false
        ? error.data.message
        : error.message || error;
    }
  }

  static getIndicesFields = async (pattern, indexType) => {
    try {
      const response = await GenericRequest.request(
        //we check if indices exist before creating the index pattern
        'GET',
        `/api/index_patterns/_fields_for_wildcard?pattern=${pattern}&meta_fields=_source&meta_fields=_id&meta_fields=_type&meta_fields=_index&meta_fields=_score`,
        {}
      );
      return response.data.fields;
    } catch {
      switch (indexType) {
        case WAZUH_INDEX_TYPE_MONITORING:
          return FieldsMonitoring;
        case WAZUH_INDEX_TYPE_STATISTICS:
          return FieldsStatistics;
        case WAZUH_INDEX_TYPE_ALERTS:
          return KnownFields;
      }
    }
  };

  /**
   * Check if it exists the index pattern saved objects using the `GET /api/saved_objects/_find` endpoint.
   * It is usefull to validate if the endpoint works as expected. Related issue: https://github.com/wazuh/wazuh-kibana-app/issues/4293
   * @param {string[]} indexPatternIDs 
   */
  static async validateIndexPatternSavedObjectCanBeFound(indexPatternIDs){
    const indexPatternsSavedObjects = await getSavedObjects().client.find({
      type: 'index-pattern',
      fields: ['title'],
      perPage: 10000
    });
    const indexPatternsSavedObjectsCanBeFound = indexPatternIDs
      .every(indexPatternID => indexPatternsSavedObjects.savedObjects.some(savedObject => savedObject.id === indexPatternID));

    if (!indexPatternsSavedObjectsCanBeFound) {
      throw new Error(`Saved object for index pattern not found.
Restart the ${PLUGIN_PLATFORM_NAME} service to initialize the index. More information in <a href="${webDocumentationLink('user-manual/wazuh-dashboard/troubleshooting.html#saved-object-for-index-pattern-not-found')}" target="_blank">troubleshooting</a>.`
)};
  }
}