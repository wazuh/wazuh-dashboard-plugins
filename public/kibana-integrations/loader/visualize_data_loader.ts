/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// @ts-ignore
import { isEqual } from 'lodash';
// @ts-ignore
import { VisRequestHandlersRegistryProvider as RequestHandlersProvider } from 'ui/registry/vis_request_handlers';
// @ts-ignore
import { VisResponseHandlersRegistryProvider as ResponseHandlerProvider } from 'ui/registry/vis_response_handlers';
// @ts-ignore
import { IPrivate } from 'ui/private';
// @ts-ignore
import {
  RequestHandler,
  RequestHandlerDescription,
  RequestHandlerParams,
  ResponseHandler,
  ResponseHandlerDescription,
  Vis,
  // @ts-ignore
} from 'ui/vis';

// @ts-ignore No typing present
import { isTermSizeZeroError } from 'ui/elasticsearch_errors';
// @ts-ignore
import { toastNotifications } from 'ui/notify';
// @ts-ignore
import { timezoneProvider } from 'ui/vis/lib/timezone';
// @ts-ignore
import { timefilter } from 'ui/timefilter';
// @ts-ignore
import { BuildESQueryProvider } from '@kbn/es-query';

// @ts-ignore
import { validateInterval } from './validate_interval';

function getHandler<T extends RequestHandler | ResponseHandler>(
  from: Array<{ name: string; handler: T }>,
  type: string | T
): T {
  if (typeof type === 'function') {
    return type;
  }
  const handlerDesc = from.find(handler => handler.name === type);
  if (!handlerDesc) {
    throw new Error(`Could not find handler "${type}".`);
  }
  return handlerDesc.handler;
}

export class VisualizeDataLoader {
  private requestHandler: RequestHandler;
  private responseHandler: ResponseHandler;

  private visData: any;
  private previousVisState: any;
  private previousRequestHandlerResponse: any;

  constructor(private readonly vis: Vis, Private: IPrivate, $injector) {
    const { requestHandler, responseHandler } = vis.type;

    const requestHandlers: RequestHandlerDescription[] = Private(RequestHandlersProvider);
    const responseHandlers: ResponseHandlerDescription[] = Private(ResponseHandlerProvider);

    if (((vis || {}).type || {}).title === 'Visual Builder') {
      const config = $injector.get('config');
      const discoverPendingUpdates = $injector.get('discoverPendingUpdates')
      const $http = $injector.get('$http')
      const buildEsQuery = Private(BuildESQueryProvider);
      this.requestHandler = ({ uiState, timeRange, filters, query, visParams }) => {
        const timezone = Private(timezoneProvider)();
        return new Promise((resolve) => {
          const discoverList = discoverPendingUpdates.getList();
          try {
            if ((discoverList || []).length >= 2) {
              const implicitFilter = (discoverList || []).length ? discoverList[0].query : '';
              const parsedQuery = {
                language: discoverList[0].language || 'lucene',
                query: implicitFilter
              };
              const parsedFilters = discoverList[1];
              query = parsedQuery;
              filters = parsedFilters;
            }
          } catch (error) { }

          const panel = visParams;
          const uiStateObj = {};
          const parsedTimeRange = timefilter.calculateBounds(timeRange);
          const scaledDataFormat = config.get('dateFormat:scaled');
          const dateFormat = config.get('dateFormat');
          if (panel && panel.id) {
            const params = {
              timerange: { timezone, ...parsedTimeRange },
              filters: [buildEsQuery(undefined, [query], filters)],
              panels: [panel],
              state: uiStateObj
            };

            try {
              const maxBuckets = config.get('metrics:max_buckets');
              validateInterval(parsedTimeRange, panel, maxBuckets);
              const httpResult = $http.post('../api/metrics/vis/data', params)
                .then(resp => ({ dateFormat, scaledDataFormat, timezone, ...resp.data }))
                .catch(resp => { throw resp.data; });

              return httpResult
                .then(resolve)
                .catch(resp => {
                  resolve({});
                  const err = new Error(resp.message);
                  err.stack = resp.stack;
                });
            } catch (e) {
              return resolve();
            }
          }
        });

      }

    } else {
      this.requestHandler = getHandler(requestHandlers, requestHandler);
    }
    this.responseHandler = getHandler(responseHandlers, responseHandler);
  }

  public async fetch(params: RequestHandlerParams): Promise<any> {
    this.vis.filters = { timeRange: params.timeRange };
    this.vis.requestError = undefined;
    this.vis.showRequestError = false;

    try {
      // Vis types that have a `showMetricsAtAllLevels` param (e.g. data table) should tell
      // tabify whether to return columns for each bucket based on the param value. Vis types
      // without this param should default to returning all columns if they are hierarchical.
      const minimalColumns =
        typeof this.vis.params.showMetricsAtAllLevels !== 'undefined'
          ? !this.vis.params.showMetricsAtAllLevels
          : !this.vis.isHierarchical();

      let requestHandlerResponse;

      // searchSource is only there for courier request handler
      try {
        requestHandlerResponse = await this.requestHandler({
          partialRows: this.vis.type.requiresPartialRows || this.vis.params.showPartialRows,
          minimalColumns,
          metricsAtAllLevels: this.vis.isHierarchical(),
          visParams: this.vis.params,
          ...params,
          filters: params.filters
            ? params.filters.filter(filter => !filter.meta.disabled)
            : undefined,
        });
      } catch (error) {
        if (!this.vis || !this.vis.searchSource) {
          return;
        }
        throw error;
      }

      // No need to call the response handler when there have been no data nor has been there changes
      // in the vis-state (response handler does not depend on uiStat
      const canSkipResponseHandler =
        this.previousRequestHandlerResponse &&
        this.previousRequestHandlerResponse === requestHandlerResponse &&
        this.previousVisState &&
        isEqual(this.previousVisState, this.vis.getState());

      this.previousVisState = this.vis.getState();
      this.previousRequestHandlerResponse = requestHandlerResponse;

      if (!canSkipResponseHandler) {
        this.visData = await Promise.resolve(this.responseHandler(requestHandlerResponse));
      }

      return this.visData;
    } catch (error) {
      if (typeof ((params || {}).searchSource || {}).cancelQueued === 'function') {
        params.searchSource.cancelQueued();
      }

      this.vis.requestError = error;
      this.vis.showRequestError =
        error.type && ['NO_OP_SEARCH_STRATEGY', 'UNSUPPORTED_QUERY'].includes(error.type);

      if (isTermSizeZeroError(error)) {
        return toastNotifications.addDanger(
          `Your visualization ('${this.vis.title}') has an error: it has a term ` +
          `aggregation with a size of 0. Please set it to a number greater than 0 to resolve ` +
          `the error.`
        );
      }

      toastNotifications.addDanger({
        title: 'Error in visualization',
        text: error.message,
      });
    }
  }
}
