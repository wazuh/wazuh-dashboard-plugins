"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const lodash_1 = require("lodash");
// @ts-ignore
const build_pipeline_1 = require("ui/visualize/loader/pipeline_helpers/build_pipeline");
// @ts-ignore
const vis_request_handlers_1 = require("ui/registry/vis_request_handlers");
// @ts-ignore
const vis_response_handlers_1 = require("ui/registry/vis_response_handlers");
function getHandler(from, type) {
    if (typeof type === 'function') {
        return type;
    }
    const handlerDesc = from.find(handler => handler.name === type);
    if (!handlerDesc) {
        throw new Error(`Could not find handler "${type}".`);
    }
    return handlerDesc.handler;
}
class VisualizeDataLoader {
    constructor(vis, Private) {
        this.vis = vis;
        const { requestHandler, responseHandler } = vis.type;
        const requestHandlers = Private(vis_request_handlers_1.VisRequestHandlersRegistryProvider);
        const responseHandlers = Private(vis_response_handlers_1.VisResponseHandlersRegistryProvider);
        this.requestHandler = getHandler(requestHandlers, requestHandler);
        this.responseHandler = getHandler(responseHandlers, responseHandler);
    }
    async fetch(params) {
        // add necessary params to vis object (dimensions, bucket, metric, etc)
        const visParams = await build_pipeline_1.getVisParams(this.vis, {
            searchSource: params.searchSource,
            timeRange: params.timeRange,
        });
        const filters = params.filters || [];
        const savedFilters = params.searchSource.getField('filter') || [];
        const query = params.query || params.searchSource.getField('query');
        // searchSource is only there for courier request handler
        const requestHandlerResponse = await this.requestHandler({
            partialRows: this.vis.params.partialRows || this.vis.type.requiresPartialRows,
            metricsAtAllLevels: this.vis.isHierarchical(),
            visParams,
            ...params,
            query,
            filters: filters.concat(savedFilters).filter(f => !f.meta.disabled),
        });
        // No need to call the response handler when there have been no data nor has there been changes
        // in the vis-state (response handler does not depend on uiState)
        const canSkipResponseHandler = this.previousRequestHandlerResponse &&
            this.previousRequestHandlerResponse === requestHandlerResponse &&
            this.previousVisState &&
            lodash_1.isEqual(this.previousVisState, this.vis.getState());
        this.previousVisState = this.vis.getState();
        this.previousRequestHandlerResponse = requestHandlerResponse;
        if (!canSkipResponseHandler) {
            this.visData = await Promise.resolve(this.responseHandler(requestHandlerResponse, visParams.dimensions));
        }
        const valueAxes = (visParams || {}).valueAxes || false;
        const hasSeries = ((this.visData || {}).series || []).length;
        if (valueAxes && hasSeries) {
            if (visParams.type !== 'area') {
                visParams.valueAxes.forEach((axis, idx) => {
                    const maxValue = Math.max.apply(Math, this.visData.series[idx].values.map((x) => { return x.y; }));
                    const lengthMaxValue = maxValue.toString().length;
                    const addTo = parseInt('1' + '0'.repeat(lengthMaxValue - 1));
                    axis.scale.max = maxValue + (addTo / 2);
                });
            }
        }
        return {
            as: 'visualization',
            value: {
                visType: this.vis.type.name,
                visData: this.visData,
                visConfig: visParams,
                params: {},
            },
        };
    }
}
exports.VisualizeDataLoader = VisualizeDataLoader;
