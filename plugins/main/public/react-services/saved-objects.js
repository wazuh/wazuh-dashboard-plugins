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
  NOT_TIME_FIELD_NAME_INDEX_PATTERN,
  PLUGIN_PLATFORM_NAME,
  WAZUH_INDEX_TYPE_ALERTS,
  WAZUH_INDEX_TYPE_MONITORING,
  WAZUH_INDEX_TYPE_STATISTICS,
} from '../../common/constants';
import { getDataPlugin, getSavedObjects } from '../kibana-services';
import { webDocumentationLink } from '../../common/services/web_documentation';
import { ErrorFactory } from './error-management';
import { WarningError } from './error-management/error-factory/errors/WarningError';

export class SavedObject {
  /**
   *
   * Returns the full list of index patterns
   */
  static async getListOfIndexPatterns() {
    const savedObjects = await GenericRequest.request(
      'GET',
      `/api/saved_objects/_find?type=index-pattern&fields=title&fields=fields&per_page=9999`,
    );
    const indexPatterns = ((savedObjects || {}).data || {}).saved_objects || [];

    return indexPatterns.map(indexPattern => ({
      ...indexPattern,
      _fields: indexPattern?.attributes?.fields
        ? JSON.parse(indexPattern.attributes.fields)
        : [],
    }));
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
          async pattern => await SavedObject.getExistingIndexPattern(pattern),
        ),
      );
      result = this.validateIndexPatterns(list);
    }

    if (!result.length) {
      const list = await this.getListOfIndexPatterns();
      result = this.validateIndexPatterns(list);
    }

    return result.map(item => {
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
    return list.filter(
      item =>
        item &&
        item._fields &&
        requiredFields.every(reqField =>
          item._fields.some(field => field.name === reqField),
        ),
    );
  }

  static async existsOrCreateIndexPattern(patternID) {
    const result = await SavedObject.existsIndexPattern(patternID);
    if (!result.data) {
      const fields = await SavedObject.getIndicesFields(
        patternID,
        WAZUH_INDEX_TYPE_ALERTS,
      );
      await this.createSavedObjectIndexPattern(
        'index-pattern',
        patternID,
        {
          attributes: {
            title: patternID,
            timeFieldName: 'timestamp',
          },
        },
        fields,
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
        `/api/saved_objects/index-pattern/${patternID}?fields=title&fields=fields`,
      );

      const title = (((indexPatternData || {}).data || {}).attributes || {})
        .title;
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
        true,
      );
      const indexPatternFields = indexPatternData?.data?.attributes?.fields
        ? JSON.parse(indexPatternData.data.attributes.fields)
        : [];
      return { ...indexPatternData.data, ...{ _fields: indexPatternFields } };
    } catch (error) {
      if (error && error.response && error.response.status == 404) return false;
      return Promise.reject(
        ((error || {}).data || {}).message || false
          ? new Error(error.data.message)
          : new Error(
              error.message || `Error getting the '${patternID}' index pattern`,
            ),
      );
    }
  }

  /**
   * Given a dashboard ID, checks if it exists
   */
  static async existsDashboard(dashboardID) {
    try {
      const dashboardData = await GenericRequest.request(
        'GET',
        `/api/saved_objects/dashboard/${dashboardID}`,
        null,
        true,
      );

      const title = dashboardData?.data?.attributes?.title;
      const id = dashboardData?.data?.id;

      if (title) {
        return {
          data: 'Dashboard found',
          status: true,
          statusCode: 200,
          title,
          id,
        };
      }
    } catch (error) {
      if (error && error.response && error.response.status == 404) return false;
      return ((error || {}).data || {}).message || false
        ? new Error(error.data.message)
        : new Error(
            error.message || `Error getting the '${dashboardID}' dashboard`,
          );
    }
  }

  /**
   * Create index-pattern */
  static async createSavedObjectIndexPattern(type, id, params, fields = '') {
    try {
      const result = await GenericRequest.request(
        'POST',
        `/api/saved_objects/${type}/${id}`,
        {
          ...params,
          attributes: {
            ...params?.attributes,
            timeFieldName:
              params?.attributes?.timeFieldName !==
              NOT_TIME_FIELD_NAME_INDEX_PATTERN
                ? params?.attributes?.timeFieldName
                : undefined,
          },
        },
      );

      if (type === 'index-pattern') {
        await this.refreshFieldsOfIndexPattern(
          id,
          params.attributes.title,
          fields,
          params?.attributes?.timeFieldName,
        );
      }

      return result;
    } catch (error) {
      throw ((error || {}).data || {}).message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  /**
   * Create dashboard */
  static async createSavedObjectDashboard(type, id, params, fields = '') {
    try {
      const result = await GenericRequest.request(
        'POST',
        `/api/saved_objects/${type}/${id}`,
        {
          attributes: {
            title: params.title,
            description: params.description,
            panelsJSON: params.panelsJSON,
            optionsJSON: params.optionsJSON,
            version: params.version,
            timeRestore: params.timeRestore,
            kibanaSavedObjectMeta: params.kibanaSavedObjectMeta,
          },
          references: params.references || [],
        },
      );
      const dashboardExists = await this.existsDashboard(id);
      if (dashboardExists) {
        console.log(`Dashboard with ID ${id} already exists.`);
        return dashboardExists;
      } else return result;
    } catch (error) {
      throw ((error || {}).data || {}).message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  /**
   * Create visualization */
  static async createSavedObjectVisualization(type, id, params, fields = '') {
    try {
      const result = await GenericRequest.request(
        'POST',
        `/api/saved_objects/${type}/${id}`,
        {
          attributes: {
            title: 'my-vega-visualization',
            visState: JSON.stringify({
              title: 'vuls',
              type: 'area',
              aggs: [
                {
                  id: '1',
                  enabled: true,
                  type: 'count',
                  params: {},
                  schema: 'metric',
                },
                {
                  id: '2',
                  enabled: true,
                  type: 'terms',
                  params: {
                    field: 'vulnerability.score.temporal',
                    orderBy: '1',
                    order: 'desc',
                    size: 5,
                    otherBucket: false,
                    otherBucketLabel: 'Other',
                    missingBucket: false,
                    missingBucketLabel: 'Missing',
                  },
                  schema: 'segment',
                },
              ],
              params: {
                type: 'area',
                grid: {
                  categoryLines: false,
                },
                categoryAxes: [
                  {
                    id: 'CategoryAxis-1',
                    type: 'category',
                    position: 'bottom',
                    show: true,
                    style: {},
                    scale: {
                      type: 'linear',
                    },
                    labels: {
                      show: true,
                      filter: true,
                      truncate: 100,
                    },
                    title: {},
                  },
                ],
                valueAxes: [
                  {
                    id: 'ValueAxis-1',
                    name: 'LeftAxis-1',
                    type: 'value',
                    position: 'left',
                    show: true,
                    style: {},
                    scale: {
                      type: 'linear',
                      mode: 'normal',
                    },
                    labels: {
                      show: true,
                      rotate: 0,
                      filter: false,
                      truncate: 100,
                    },
                    title: {
                      text: 'Count',
                    },
                  },
                ],
                seriesParams: [
                  {
                    show: true,
                    type: 'area',
                    mode: 'stacked',
                    data: {
                      label: 'Count',
                      id: '1',
                    },
                    drawLinesBetweenPoints: true,
                    lineWidth: 2,
                    showCircles: true,
                    interpolate: 'linear',
                    valueAxis: 'ValueAxis-1',
                  },
                ],
                addTooltip: true,
                addLegend: true,
                legendPosition: 'right',
                times: [],
                addTimeMarker: false,
                thresholdLine: {
                  show: false,
                  value: 10,
                  width: 1,
                  style: 'full',
                  color: '#E7664C',
                },
                labels: {},
              },
            }),
            uiStateJSON: '{}',
            description: '',
            version: 1,
            kibanaSavedObjectMeta: {
              searchSourceJSON: JSON.stringify({
                query: {
                  query: '',
                  language: 'kuery',
                },
                filter: [],
                indexRefName: 'kibanaSavedObjectMeta.searchSourceJSON.index',
              }),
            },
          },
          references: [
            {
              name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
              type: 'index-pattern',
              id: 'wazuh-states-vulnerabilities-*',
            },
          ],
        },
      );
      console.log('visualizacion creada');

      return result;
    } catch (error) {
      throw ((error || {}).data || {}).message || false
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
      throw ((error || {}).data || {}).message || false
        ? new Error(error.data.message)
        : error;
    }
  }

  /**
   * Refresh an index pattern
   * Optionally force a new field
   */
  static async refreshIndexPattern(pattern) {
    /* Refresh fields using the same way that the Dashboards Management/Index patterns
        https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.11.0/src/plugins/index_pattern_management/public/components/edit_index_pattern/edit_index_pattern.tsx#L136-L137

        This approach takes the definition of indexPatterns.refreshFields instead of using it due to
        the error management that causes that unwanted toasts are displayed when there are no
        indices for the index pattern
      */
    const fields = await getDataPlugin().indexPatterns.getFieldsForIndexPattern(
      pattern,
    );
    const scripted = pattern.getScriptedFields().map(field => field.spec);
    pattern.fields.replaceAll([...fields, ...scripted]);
    await getDataPlugin().indexPatterns.updateSavedObject(pattern);
  }

  /**
   * Creates the 'wazuh-alerts-*'  index pattern
   */
  static async createWazuhIndexPattern(pattern) {
    try {
      const fields = await SavedObject.getIndicesFields(
        pattern,
        WAZUH_INDEX_TYPE_ALERTS,
      );
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
        fields,
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
        {},
      );
      return response.data.fields;
    } catch (error) {
      switch (indexType) {
        case WAZUH_INDEX_TYPE_MONITORING:
          return FieldsMonitoring;
        case WAZUH_INDEX_TYPE_STATISTICS:
          return FieldsStatistics;
        case WAZUH_INDEX_TYPE_ALERTS:
          return KnownFields;
        default:
          const warningError = ErrorFactory.create(WarningError, {
            error,
            message: error.message,
          });
          throw warningError;
      }
    }
  };

  /**
   * Check if it exists the index pattern saved objects using the `GET /api/saved_objects/_find` endpoint.
   * It is usefull to validate if the endpoint works as expected. Related issue: https://github.com/wazuh/wazuh-dashboard-plugins/issues/4293
   * @param {string[]} indexPatternIDs
   */
  static async validateIndexPatternSavedObjectCanBeFound(indexPatternIDs) {
    const indexPatternsSavedObjects = await getSavedObjects().client.find({
      type: 'index-pattern',
      fields: ['title'],
      perPage: 10000,
    });
    const indexPatternsSavedObjectsCanBeFound = indexPatternIDs.every(
      indexPatternID =>
        indexPatternsSavedObjects.savedObjects.some(
          savedObject => savedObject.id === indexPatternID,
        ),
    );

    if (!indexPatternsSavedObjectsCanBeFound) {
      throw new Error(`Saved object for index pattern not found.
Restart the ${PLUGIN_PLATFORM_NAME} service to initialize the index. More information in troubleshooting guide: ${webDocumentationLink(
        'user-manual/wazuh-dashboard/troubleshooting.html#saved-object-for-index-pattern-not-found',
      )}.`);
    }
  }
}
