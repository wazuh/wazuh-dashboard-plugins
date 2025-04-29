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
  WAZUH_SAMPLE_ALERTS_INDEX_SHARDS,
  WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS,
  WAZUH_ALERTS_PREFIX,
  WAZUH_SAMPLE_DATA_CATEGORIES_TYPE_DATA,
  WAZUH_SAMPLE_ALERTS_DEFAULT_NUMBER_DOCUMENTS,
  WAZUH_INDEXER_NAME,
} from '../../common/constants';
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  OpenSearchDashboardsResponseFactory,
} from 'src/core/server';
import { routeDecoratorProtectedAdministrator } from './decorators';
import { generateSampleData } from '../lib/generate-sample-data';

export class WazuhElasticCtrl {
  constructor() {}

  /**
   * This returns the index according the category
   * @param {string} category
   */
  async buildSampleIndexByCategory(
    context: RequestHandlerContext,
    category: string,
  ): Promise<string[]> {
    const settingsIndexPatterns: string[] = [];

    WAZUH_SAMPLE_DATA_CATEGORIES_TYPE_DATA[category].forEach(item => {
      if (settingsIndexPatterns.includes(item.settingIndexPattern)) {
        return;
      }
      settingsIndexPatterns.push(item.settingIndexPattern);
    });

    const indexNames = await Promise.all(
      settingsIndexPatterns.map(async settingsIndexPattern => {
        const configValue = await context.wazuh_core.configuration.get(
          settingsIndexPattern,
        );
        return `${configValue}sample-${category}`;
      }),
    );

    return indexNames;
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
   * This creates sample data in wazuh-sample-data
   * GET /indexer/sampledata/{category}
   * @param {*} context
   * @param {*} request
   * @param {*} response
   * {alerts: [...]} or ErrorResponse
   */
  async haveSampleDataOfCategory(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest<{ category: string }>,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const sampleDataIndex = await this.buildSampleIndexByCategory(
        context,
        request.params.category,
      );
      // Check if wazuh sample data index exists
      const existsSampleIndex = await Promise.all(
        sampleDataIndex.map(async indexName => {
          return await context.core.opensearch.client.asCurrentUser.indices.exists(
            {
              index: indexName,
            },
          );
        }),
      );
      return response.ok({
        body: {
          index: sampleDataIndex,
          exists: existsSampleIndex.some(result => result.body),
        },
      });
    } catch (error) {
      context.wazuh.logger.error(
        `Error checking if there are sample data indices: ${
          error.message || error
        }`,
      );

      const [statusCode, errorMessage] = this.getErrorDetails(error);
      return ErrorResponse(
        `Error checking if there are sample data indices: ${
          errorMessage || error
        }`,
        1000,
        statusCode,
        response,
      );
    }
  }
  /**
   * This creates sample data in wazuh-sample-data
   * POST /indexer/sampledata/{category}
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
   * {index: string, data: [...], count: number} or ErrorResponse
   */
  createSampleData = routeDecoratorProtectedAdministrator(1000)(
    async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest<{ category: string }>,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      const sampleIndexNames = await this.buildSampleIndexByCategory(
        context,
        request.params.category,
      );

      const sampleDocumentsResponse: Array<{
        index: string;
        sampleDataCount: number;
      }> = [];

      try {
        await Promise.all(
          sampleIndexNames.map(async indexName => {
            try {
              const bulkPrefix = JSON.stringify({
                index: {
                  _index: indexName,
                },
              });
              const sampleDataGenerateParams =
                (request.body && request.body.params) || {};

              const mappedData = WAZUH_SAMPLE_DATA_CATEGORIES_TYPE_DATA[
                request.params.category
              ]
                .map((typeSample: { dataSet?: string; count?: number }) => {
                  if (
                    indexName.includes(
                      typeSample?.dataSet || WAZUH_ALERTS_PREFIX,
                    )
                  ) {
                    return generateSampleData(
                      { ...typeSample, ...sampleDataGenerateParams },
                      request.body.count ||
                        typeSample.count ||
                        WAZUH_SAMPLE_ALERTS_DEFAULT_NUMBER_DOCUMENTS,
                      context,
                    );
                  }
                  return;
                })
                .filter(
                  (item: { sampleData: []; template?: string } | undefined) =>
                    item !== undefined,
                )
                .flat();

              let sampleDataAndTemplate: {
                sampleData: [];
                template?: {
                  index_patterns: string;
                  priority: number;
                  template: any;
                };
              } = { sampleData: [] };

              if (mappedData.length > 1) {
                mappedData.forEach((item: { sampleData: [] }) =>
                  sampleDataAndTemplate.sampleData.push(...item.sampleData),
                );
              }

              if (mappedData.length === 1 && mappedData[0].template) {
                sampleDataAndTemplate = mappedData[0];
              }

              const { sampleData } = sampleDataAndTemplate;

              const bulk = sampleData
                .map(document => `${bulkPrefix}\n${JSON.stringify(document)}\n`)
                .join('');

              // Index data

              // Check if wazuh sample data index exists
              const existsSampleIndex =
                await context.core.opensearch.client.asCurrentUser.indices.exists(
                  {
                    index: indexName,
                  },
                );
              if (existsSampleIndex.body === false) {
                // Create wazuh sample data index
                let configuration;

                if (sampleDataAndTemplate?.template) {
                  configuration = sampleDataAndTemplate.template.template;

                  delete configuration.index_patterns;
                  delete configuration.priority;

                  configuration.settings.index.number_of_shards =
                    WAZUH_SAMPLE_ALERTS_INDEX_SHARDS;
                  configuration.settings.index.number_of_replicas =
                    WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS;
                } else {
                  configuration = {
                    settings: {
                      index: {
                        number_of_shards: WAZUH_SAMPLE_ALERTS_INDEX_SHARDS,
                        number_of_replicas: WAZUH_SAMPLE_ALERTS_INDEX_REPLICAS,
                      },
                    },
                  };
                }

                await context.core.opensearch.client.asCurrentUser.indices.create(
                  {
                    index: indexName,
                    body: configuration,
                  },
                );
                context.wazuh.logger.info(`Index ${indexName} created`);
              }

              await context.core.opensearch.client.asCurrentUser.bulk({
                index: indexName,
                body: bulk,
              });

              context.wazuh.logger.info(
                `Added sample data to ${indexName} index`,
              );

              sampleDocumentsResponse.push({
                index: indexName,
                sampleDataCount: sampleData.length,
              });
            } catch (error) {
              context.wazuh.logger.error(
                `Error adding sample data to ${indexName} index: ${
                  error.message || error
                }`,
              );

              const [statusCode, errorMessage] = this.getErrorDetails(error);
              throw { statusCode, errorMessage };
            }
          }),
        );

        // Only return response after all operations are complete
        return response.ok({
          body: { sampleDocumentsResponse },
        });
      } catch (error) {
        const statusCode = error?.statusCode || 500;
        const errorMessage = error?.errorMessage || error.message || error;
        return ErrorResponse(errorMessage, 1000, statusCode, response);
      }
    },
  );
  /**
   * This deletes sample data
   * @param {*} context
   * @param {*} request
   * @param {*} response
   * {result: "deleted", index: string} or ErrorResponse
   */
  deleteSampleData = routeDecoratorProtectedAdministrator(1000)(
    async (
      context: RequestHandlerContext,
      request: OpenSearchDashboardsRequest<{ category: string }>,
      response: OpenSearchDashboardsResponseFactory,
    ) => {
      // Delete Wazuh sample data index
      const sampleDataIndex = await this.buildSampleIndexByCategory(
        context,
        request.params.category,
      );

      try {
        // Check if Wazuh sample data index exists
        const existsSampleIndex =
          await context.core.opensearch.client.asCurrentUser.indices.exists({
            index: sampleDataIndex,
          });
        if (existsSampleIndex.body) {
          // Delete Wazuh sample data index
          await context.core.opensearch.client.asCurrentUser.indices.delete({
            index: sampleDataIndex,
          });
          context.wazuh.logger.info(`Deleted ${sampleDataIndex} index`);
          return response.ok({
            body: { result: 'deleted', index: sampleDataIndex },
          });
        } else {
          return ErrorResponse(
            `${sampleDataIndex} index doesn't exist`,
            1000,
            500,
            response,
          );
        }
      } catch (error) {
        context.wazuh.logger.error(
          `Error deleting sample data of ${sampleDataIndex} index: ${
            error.message || error
          }`,
        );
        const [statusCode, errorMessage] = this.getErrorDetails(error);

        return ErrorResponse(errorMessage || error, 1000, statusCode, response);
      }
    },
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

  getErrorDetails(error) {
    const statusCode = error?.meta?.statusCode || 500;
    let errorMessage = error.message;

    if (statusCode === 403) {
      errorMessage = error?.meta?.body?.error?.reason || 'Permission denied';
    }

    return [statusCode, errorMessage];
  }
}
