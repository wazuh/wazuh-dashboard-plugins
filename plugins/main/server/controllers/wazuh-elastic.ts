/*
 * Wazuh app - Class for Wazuh-Elastic functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ErrorResponse } from '../lib/error-response';
import {
  AgentsVisualizations,
  OverviewVisualizations,
  ClusterVisualizations,
} from '../integration-files/visualizations';

import { generateAlerts } from '../lib/generate-alerts/generate-alerts-script';
import {
  WAZUH_SAMPLE_ALERTS_INDEX_SHARDS,
  WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS,
} from '../../common/constants';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  OpenSearchDashboardsResponseFactory,
} from 'src/core/server';
import {
  WAZUH_SAMPLE_ALERTS_CATEGORIES_TYPE_ALERTS,
  WAZUH_SAMPLE_ALERTS_DEFAULT_NUMBER_ALERTS,
} from '../../common/constants';
import { WAZUH_INDEXER_NAME } from '../../common/constants';
import { routeDecoratorProtectedAdministrator } from './decorators';

export class WazuhElasticCtrl {
  constructor() {}

  /**
   * This returns the index according the category
   * @param {string} category
   */
  async buildSampleIndexByCategory(
    context: RequestHandlerContext,
    category: string,
  ): Promise<string> {
    return `${await context.wazuh_core.configuration.get(
      'alerts.sample.prefix',
    )}sample-${category}`;
  }

  /**
   * This retrieves a template from Elasticsearch
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} template or ErrorResponse
   */
  async getTemplate(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<{ pattern: string }>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const data =
        await context.core.opensearch.client.asInternalUser.cat.templates();

      const templates = data.body;
      if (!templates || typeof templates !== 'string') {
        throw new Error(
          `An unknown error occurred when fetching templates from ${WAZUH_INDEXER_NAME}`,
        );
      }

      const lastChar =
        request.params.pattern[request.params.pattern.length - 1];

      // Split into separate patterns
      const tmpdata = templates.match(/\[.*\]/g);
      const tmparray = [];
      for (let item of tmpdata) {
        // A template might use more than one pattern
        if (item.includes(',')) {
          item = item.substr(1).slice(0, -1);
          const subItems = item.split(',');
          for (const subitem of subItems) {
            tmparray.push(`[${subitem.trim()}]`);
          }
        } else {
          tmparray.push(item);
        }
      }

      // Ensure we are handling just patterns
      const array = tmparray.filter(
        item => item.includes('[') && item.includes(']'),
      );

      const pattern =
        lastChar === '*'
          ? request.params.pattern.slice(0, -1)
          : request.params.pattern;
      const isIncluded = array.filter(item => {
        item = item.slice(1, -1);
        const lastChar = item[item.length - 1];
        item = lastChar === '*' ? item.slice(0, -1) : item;
        return item.includes(pattern) || pattern.includes(item);
      });
      context.wazuh.logger.debug(
        `Template is valid: ${
          isIncluded && Array.isArray(isIncluded) && isIncluded.length
            ? 'yes'
            : 'no'
        }`,
      );
      return isIncluded && Array.isArray(isIncluded) && isIncluded.length
        ? response.ok({
            body: {
              statusCode: 200,
              status: true,
              data: `Template found for ${request.params.pattern}`,
            },
          })
        : response.ok({
            body: {
              statusCode: 200,
              status: false,
              data: `No template found for ${request.params.pattern}`,
            },
          });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(
        `Could not retrieve templates from ${WAZUH_INDEXER_NAME} due to ${
          error.message || error
        }`,
        4002,
        500,
        response,
      );
    }
  }

  /**
   * This check index-pattern
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} status obj or ErrorResponse
   */

  /**
   * This get the fields keys
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Array<Object>} fields or ErrorResponse
   */
  async getFieldTop(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<
      { mode: string; cluster: string; field: string; pattern: string },
      { agentsList: string }
    >,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      // Top field payload
      let payload = {
        size: 1,
        query: {
          bool: {
            must: [],
            must_not: {
              term: {
                'agent.id': '000',
              },
            },
            filter: [
              {
                range: { timestamp: {} },
              },
            ],
          },
        },
        aggs: {
          '2': {
            terms: {
              field: '',
              size: 1,
              order: { _count: 'desc' },
            },
          },
        },
      };

      // Set up time interval, default to Last 24h
      const timeGTE = 'now-1d';
      const timeLT = 'now';
      payload.query.bool.filter[0].range['timestamp']['gte'] = timeGTE;
      payload.query.bool.filter[0].range['timestamp']['lt'] = timeLT;

      // Set up match for default cluster name
      payload.query.bool.must.push(
        request.params.mode === 'cluster'
          ? { match: { 'cluster.name': request.params.cluster } }
          : { match: { 'manager.name': request.params.cluster } },
      );

      if (request.query.agentsList)
        payload.query.bool.filter.push({
          terms: {
            'agent.id': request.query.agentsList.split(','),
          },
        });
      payload.aggs['2'].terms.field = request.params.field;

      const data = await context.core.opensearch.client.asCurrentUser.search({
        size: 1,
        index: request.params.pattern,
        body: payload,
      });

      return data.body.hits.total.value === 0 ||
        typeof data.body.aggregations['2'].buckets[0] === 'undefined'
        ? response.ok({
            body: { statusCode: 200, data: '' },
          })
        : response.ok({
            body: {
              statusCode: 200,
              data: data.body.aggregations['2'].buckets[0].key,
            },
          });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(error.message || error, 4004, 500, response);
    }
  }

  /**
   * Checks for minimum index pattern fields in a list of index patterns.
   * @param {Array<Object>} indexPatternList List of index patterns
   */
  validateIndexPattern(indexPatternList) {
    const minimum = ['timestamp', 'rule.groups', 'manager.name', 'agent.id'];
    let list = [];
    for (const index of indexPatternList) {
      let valid, parsed;
      try {
        parsed = JSON.parse(index.attributes.fields);
      } catch (error) {
        continue;
      }

      valid = parsed.filter(item => minimum.includes(item.name));
      if (valid.length === 4) {
        list.push({
          id: index.id,
          title: index.attributes.title,
        });
      }
    }
    return list;
  }

  /**
   * Returns current security platform
   * @param {Object} req
   * @param {Object} reply
   * @returns {String}
   */
  async getCurrentPlatform(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<{ user: string }>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      return response.ok({
        body: {
          platform: context.wazuh.security.platform,
        },
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(error.message || error, 4011, 500, response);
    }
  }

  /**
   * Replaces visualizations main fields to fit a certain pattern.
   * @param {Array<Object>} app_objects Object containing raw visualizations.
   * @param {String} id Index-pattern id to use in the visualizations. Eg: 'wazuh-alerts'
   */
  async buildVisualizationsRaw(context, app_objects, id, namespace = false) {
    const config = await context.wazuh_core.configuration.get();
    let monitoringPattern = `${config['wazuh.monitoring.pattern']}`;
    context.wazuh.logger.debug(`Building ${app_objects.length} visualizations`);
    context.wazuh.logger.debug(`Index pattern ID: ${id}`);
    const visArray = [];
    let aux_source, bulk_content;
    for (let element of app_objects) {
      aux_source = JSON.parse(JSON.stringify(element._source));

      // Replace index-pattern for visualizations
      if (
        aux_source &&
        aux_source.kibanaSavedObjectMeta &&
        aux_source.kibanaSavedObjectMeta.searchSourceJSON &&
        typeof aux_source.kibanaSavedObjectMeta.searchSourceJSON === 'string'
      ) {
        const defaultStr = aux_source.kibanaSavedObjectMeta.searchSourceJSON;

        const isMonitoring = defaultStr.includes('wazuh-monitoring');
        if (isMonitoring) {
          if (namespace && namespace !== 'default') {
            if (
              monitoringPattern.includes(namespace) &&
              monitoringPattern.includes('index-pattern:')
            ) {
              monitoringPattern = monitoringPattern.split('index-pattern:')[1];
            }
          }
          aux_source.kibanaSavedObjectMeta.searchSourceJSON =
            defaultStr.replace(
              /wazuh-monitoring/g,
              monitoringPattern[monitoringPattern.length - 1] === '*' ||
                (namespace && namespace !== 'default')
                ? monitoringPattern
                : monitoringPattern + '*',
            );
        } else {
          aux_source.kibanaSavedObjectMeta.searchSourceJSON =
            defaultStr.replace(/wazuh-alerts/g, id);
        }
      }

      // Replace index-pattern for selector visualizations
      if (typeof (aux_source || {}).visState === 'string') {
        aux_source.visState = aux_source.visState.replace(/wazuh-alerts/g, id);
      }

      // Bulk source
      bulk_content = {};
      bulk_content[element._type] = aux_source;

      visArray.push({
        attributes: bulk_content.visualization,
        type: element._type,
        id: element._id,
        _version: bulk_content.visualization.version,
      });
    }
    return visArray;
  }

  /**
   * Replaces cluster visualizations main fields.
   * @param {Array<Object>} app_objects Object containing raw visualizations.
   * @param {String} id Index-pattern id to use in the visualizations. Eg: 'wazuh-alerts'
   * @param {Array<String>} nodes Array of node names. Eg: ['node01', 'node02']
   * @param {String} name Cluster name. Eg: 'wazuh'
   * @param {String} master_node Master node name. Eg: 'node01'
   */
  buildClusterVisualizationsRaw(
    context,
    app_objects,
    id,
    nodes = [],
    name,
    master_node,
    pattern_name = '*',
  ) {
    try {
      const visArray = [];
      let aux_source, bulk_content;

      for (const element of app_objects) {
        // Stringify and replace index-pattern for visualizations
        aux_source = JSON.stringify(element._source);
        aux_source = aux_source.replace(/wazuh-alerts/g, id);
        aux_source = JSON.parse(aux_source);

        // Bulk source
        bulk_content = {};
        bulk_content[element._type] = aux_source;

        const visState = JSON.parse(bulk_content.visualization.visState);
        const title = visState.title;

        if (title.startsWith('Wazuh App Statistics')) {
          const filter =
            bulk_content.visualization.kibanaSavedObjectMeta.searchSourceJSON.replace(
              '"filter":[]',
              `"filter":[{"bool":{"must":[{"match":{"apiName":"'${master_node}'"}}${
                name && name !== 'all'
                  ? `,{"match":{"nodeName":"'${name}'"}}`
                  : ''
              }]}}]`,
            );

          bulk_content.visualization.kibanaSavedObjectMeta.searchSourceJSON =
            filter;
        }

        if (visState.type && visState.type === 'timelion') {
          let query = '';
          if (title === 'Wazuh App Cluster Overview') {
            for (const node of nodes) {
              query += `.es(index=${pattern_name},q="cluster.name: ${name} AND cluster.node: ${node.name}").label("${node.name}"),`;
            }
            query = query.substring(0, query.length - 1);
          } else if (title === 'Wazuh App Cluster Overview Manager') {
            query += `.es(index=${pattern_name},q="cluster.name: ${name}").label("${name} cluster")`;
          }

          visState.params.expression = query.replace(/'/g, '"');
          bulk_content.visualization.visState = JSON.stringify(visState);
        }

        visArray.push({
          attributes: bulk_content.visualization,
          type: element._type,
          id: element._id,
          _version: bulk_content.visualization.version,
        });
      }

      return visArray;
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * This creates a visualization of data in req
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} vis obj or ErrorResponse
   */
  async createVis(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<{ pattern: string; tab: string }>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      if (
        !request.params.tab.includes('overview-') &&
        !request.params.tab.includes('agents-')
      ) {
        throw new Error('Missing parameters creating visualizations');
      }

      const tabPrefix = request.params.tab.includes('overview')
        ? 'overview'
        : 'agents';

      const tabSplit = request.params.tab.split('-');
      const tabSufix = tabSplit[1];

      const file =
        tabPrefix === 'overview'
          ? OverviewVisualizations[tabSufix]
          : AgentsVisualizations[tabSufix];
      if (!file) {
        return response.notFound({
          body: {
            message: `Visualizations not found for ${request.params.tab}`,
          },
        });
      }
      context.wazuh.logger.debug(
        `${tabPrefix}[${tabSufix}] with index pattern ${request.params.pattern}`,
      );
      const raw = await this.buildVisualizationsRaw(
        context,
        file,
        request.params.pattern,
      );
      return response.ok({
        body: { acknowledge: true, raw: raw },
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(error.message || error, 4007, 500, response);
    }
  }

  /**
   * This creates a visualization of cluster
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} vis obj or ErrorResponse
   */
  async createClusterVis(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<
      { pattern: string; tab: string },
      unknown,
      any
    >,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      if (
        !request.params.pattern ||
        !request.params.tab ||
        !request.body ||
        !request.body.nodes ||
        !request.body.nodes.affected_items ||
        !request.body.nodes.name ||
        (request.params.tab && !request.params.tab.includes('cluster-'))
      ) {
        throw new Error('Missing parameters creating visualizations');
      }

      const type = request.params.tab.split('-')[1];

      const file = ClusterVisualizations[type];
      const nodes = request.body.nodes.affected_items;
      const name = request.body.nodes.name;
      const masterNode = request.body.nodes.master_node;

      const { id: patternID, title: patternName } = request.body.pattern;

      const raw = await this.buildClusterVisualizationsRaw(
        context,
        file,
        patternID,
        nodes,
        name,
        masterNode,
        patternName,
      );

      return response.ok({
        body: { acknowledge: true, raw: raw },
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(error.message || error, 4009, 500, response);
    }
  }

  /**
   * This checks if there is sample alerts
   * GET /elastic/samplealerts
   * @param {*} context
   * @param {*} request
   * @param {*} response
   * {alerts: [...]} or ErrorResponse
   */
  async haveSampleAlerts(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      // Check if wazuh sample alerts index exists
      const results = await Promise.all(
        Object.keys(WAZUH_SAMPLE_ALERTS_CATEGORIES_TYPE_ALERTS).map(
          async category =>
            context.core.opensearch.client.asCurrentUser.indices.exists({
              index: await this.buildSampleIndexByCategory(context, category),
            }),
        ),
      );
      return response.ok({
        body: { sampleAlertsInstalled: results.some(result => result.body) },
      });
    } catch (error) {
      return ErrorResponse(
        'Sample Alerts category not valid',
        1000,
        500,
        response,
      );
    }
  }
  /**
   * This creates sample alerts in wazuh-sample-alerts
   * GET /elastic/samplealerts/{category}
   * @param {*} context
   * @param {*} request
   * @param {*} response
   * {alerts: [...]} or ErrorResponse
   */
  async haveSampleAlertsOfCategory(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<{ category: string }>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const sampleAlertsIndex = await this.buildSampleIndexByCategory(
        context,
        request.params.category,
      );
      // Check if wazuh sample alerts index exists
      const existsSampleIndex =
        await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: sampleAlertsIndex,
        });
      return response.ok({
        body: { index: sampleAlertsIndex, exists: existsSampleIndex.body },
      });
    } catch (error) {
      context.wazuh.logger.error(
        `Error checking if there are sample alerts indices: ${
          error.message || error
        }`,
      );

      const [statusCode, errorMessage] = this.getErrorDetails(error);
      return ErrorResponse(
        `Error checking if there are sample alerts indices: ${
          errorMessage || error
        }`,
        1000,
        statusCode,
        response,
      );
    }
  }
  /**
   * This creates sample alerts in wazuh-sample-alerts
   * POST /elastic/samplealerts/{category}
   * {
   *   "manager": {
   *      "name": "manager_name"
   *    },
   *    cluster: {
   *      name: "mycluster",
   *      node: "mynode"
   *    }
   * }
   * @param {*} context
   * @param {*} request
   * @param {*} response
   * {index: string, alerts: [...], count: number} or ErrorResponse
   */
  createSampleAlerts = routeDecoratorProtectedAdministrator(
    async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest<{ category: string }>,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      const sampleAlertsIndex = await this.buildSampleIndexByCategory(
        context,
        request.params.category,
      );

      try {
        const bulkPrefix = JSON.stringify({
          index: {
            _index: sampleAlertsIndex,
          },
        });
        const alertGenerateParams = (request.body && request.body.params) || {};

        const sampleAlerts = WAZUH_SAMPLE_ALERTS_CATEGORIES_TYPE_ALERTS[
          request.params.category
        ]
          .map(typeAlert =>
            generateAlerts(
              { ...typeAlert, ...alertGenerateParams },
              request.body.alerts ||
                typeAlert.alerts ||
                WAZUH_SAMPLE_ALERTS_DEFAULT_NUMBER_ALERTS,
            ),
          )
          .flat();
        const bulk = sampleAlerts
          .map(sampleAlert => `${bulkPrefix}\n${JSON.stringify(sampleAlert)}\n`)
          .join('');

        // Index alerts

        // Check if wazuh sample alerts index exists
        const existsSampleIndex =
          await context.core.opensearch.client.asCurrentUser.indices.exists({
            index: sampleAlertsIndex,
          });
        if (!existsSampleIndex.body) {
          // Create wazuh sample alerts index

          const configuration = {
            settings: {
              index: {
                number_of_shards: WAZUH_SAMPLE_ALERTS_INDEX_SHARDS,
                number_of_replicas: WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS,
              },
            },
          };

          await context.core.opensearch.client.asCurrentUser.indices.create({
            index: sampleAlertsIndex,
            body: configuration,
          });
          context.wazuh.logger.info(`Index ${sampleAlertsIndex} created`);
        }

        await context.core.opensearch.client.asCurrentUser.bulk({
          index: sampleAlertsIndex,
          body: bulk,
        });
        context.wazuh.logger.info(
          `Added sample alerts to ${sampleAlertsIndex} index`,
        );
        return response.ok({
          body: { index: sampleAlertsIndex, alertCount: sampleAlerts.length },
        });
      } catch (error) {
        context.wazuh.logger.error(
          `Error adding sample alerts to ${sampleAlertsIndex} index: ${
            error.message || error
          }`,
        );

        const [statusCode, errorMessage] = this.getErrorDetails(error);

        return ErrorResponse(errorMessage || error, 1000, statusCode, response);
      }
    },
    1000,
  );
  /**
   * This deletes sample alerts
   * @param {*} context
   * @param {*} request
   * @param {*} response
   * {result: "deleted", index: string} or ErrorResponse
   */
  deleteSampleAlerts = routeDecoratorProtectedAdministrator(
    async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest<{ category: string }>,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      // Delete Wazuh sample alert index
      const sampleAlertsIndex = await this.buildSampleIndexByCategory(
        context,
        request.params.category,
      );

      try {
        // Check if Wazuh sample alerts index exists
        const existsSampleIndex =
          await context.core.opensearch.client.asCurrentUser.indices.exists({
            index: sampleAlertsIndex,
          });
        if (existsSampleIndex.body) {
          // Delete Wazuh sample alerts index
          await context.core.opensearch.client.asCurrentUser.indices.delete({
            index: sampleAlertsIndex,
          });
          context.wazuh.logger.info(`Deleted ${sampleAlertsIndex} index`);
          return response.ok({
            body: { result: 'deleted', index: sampleAlertsIndex },
          });
        } else {
          return ErrorResponse(
            `${sampleAlertsIndex} index doesn't exist`,
            1000,
            500,
            response,
          );
        }
      } catch (error) {
        context.wazuh.logger.error(
          `Error deleting sample alerts of ${sampleAlertsIndex} index: ${
            error.message || error
          }`,
        );
        const [statusCode, errorMessage] = this.getErrorDetails(error);

        return ErrorResponse(errorMessage || error, 1000, statusCode, response);
      }
    },
    1000,
  );

  async alerts(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const data = await context.core.opensearch.client.asCurrentUser.search(
        request.body,
      );
      return response.ok({
        body: data.body,
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(error.message || error, 4010, 500, response);
    }
  }

  // Check if there are indices for Statistics
  async existStatisticsIndices(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const config = await context.wazuh_core.configuration.get();
      const statisticsPattern = `${config['cron.prefix']}-${config['cron.statistics.index.name']}*`;
      const existIndex =
        await context.core.opensearch.client.asCurrentUser.indices.exists({
          index: statisticsPattern,
          allow_no_indices: false,
        });
      return response.ok({
        body: existIndex.body,
      });
    } catch (error) {
      context.wazuh.logger.error(error.message || error);
      return ErrorResponse(error.message || error, 1000, 500, response);
    }
  }

  getErrorDetails(error) {
    const statusCode = error?.meta?.statusCode || 500;
    let errorMessage = error.message;

    if (statusCode === 403) {
      errorMessage = error?.meta?.body?.error?.reason || 'Permission denied';
    }

    return [statusCode, errorMessage];
  }
}
