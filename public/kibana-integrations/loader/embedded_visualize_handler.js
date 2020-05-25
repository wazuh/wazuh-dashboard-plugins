"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const events_1 = require("events");
const lodash_1 = require("lodash");
const Rx = __importStar(require("rxjs"));
const operators_1 = require("rxjs/operators");
// @ts-ignore
const i18n_1 = require("@kbn/i18n");
// @ts-ignore
const registries_1 = require("plugins/interpreter/registries");
// @ts-ignore
const inspector_1 = require("ui/inspector");
// @ts-ignore
const render_complete_1 = require("ui/render_complete");
// @ts-ignore
const timefilter_1 = require("ui/timefilter");
// @ts-ignore untyped dependency
const vis_filters_1 = require("ui/vis/vis_filters");
// @ts-ignore
const pipeline_data_loader_1 = require("ui/visualize/loader/pipeline_data_loader");
const visualization_loader_1 = require("./visualization_loader");
const visualize_data_loader_1 = require("./visualize_data_loader");
// @ts-ignore
const adapters_1 = require("ui/inspector/adapters");
// @ts-ignore
const utilities_1 = require("ui/visualize/loader/pipeline_helpers/utilities");
// @ts-ignore
const utils_1 = require("ui/visualize/loader/utils");
const RENDER_COMPLETE_EVENT = 'render_complete';
const DATA_SHARED_ITEM = 'data-shared-item';
const LOADING_ATTRIBUTE = 'data-loading';
const RENDERING_COUNT_ATTRIBUTE = 'data-rendering-count';
/**
 * A handler to the embedded visualization. It offers several methods to interact
 * with the visualization.
 */
class EmbeddedVisualizeHandler {
    constructor(element, savedObject, params, injector, errorHandler) {
        this.element = element;
        this.inspectorAdapters = {};
        this.loaded = false;
        this.destroyed = false;
        this.pipelineDataLoader = false;
        this.listeners = new events_1.EventEmitter();
        this.shouldForceNextFetch = false;
        this.debouncedFetchAndRender = lodash_1.debounce(() => {
            if (this.destroyed) {
                return;
            }
            const forceFetch = this.shouldForceNextFetch;
            this.shouldForceNextFetch = false;
            this.fetch(forceFetch).then(this.render);
        }, 100);
        this.actions = {};
        /**
         * renders visualization with provided data
         * @param response: visualization data
         */
        this.render = (response = null) => {
            const executeRenderer = this.rendererProvider(response);
            if (!executeRenderer) {
                return;
            }
            // TODO: we have this weird situation when we need to render first,
            // and then we call fetch and render... we need to get rid of that.
            executeRenderer().then(() => {
                if (!this.loaded) {
                    this.loaded = true;
                    if (this.autoFetch) {
                        this.fetchAndRender();
                    }
                }
            });
        };
        /**
         * Opens the inspector for the embedded visualization. This will return an
         * handler to the inspector to close and interact with it.
         * @return An inspector session to interact with the opened inspector.
         */
        this.openInspector = () => {
            return inspector_1.Inspector.open(this.inspectorAdapters, {
                title: this.vis.title,
            });
        };
        this.hasInspector = () => {
            return inspector_1.Inspector.isAvailable(this.inspectorAdapters);
        };
        /**
         * Force the fetch of new data and renders the chart again.
         */
        this.reload = () => {
            this.fetchAndRender(true);
        };
        this.incrementRenderingCount = () => {
            const renderingCount = Number(this.element.getAttribute(RENDERING_COUNT_ATTRIBUTE) || 0);
            this.element.setAttribute(RENDERING_COUNT_ATTRIBUTE, `${renderingCount + 1}`);
        };
        this.onRenderCompleteListener = () => {
            this.listeners.emit(RENDER_COMPLETE_EVENT);
            this.element.removeAttribute(LOADING_ATTRIBUTE);
            this.incrementRenderingCount();
        };
        this.onUiStateChange = () => {
            this.fetchAndRender();
        };
        /**
         * Returns an object of all inspectors for this vis object.
         * This must only be called after this.type has properly be initialized,
         * since we need to read out data from the the vis type to check which
         * inspectors are available.
         */
        this.getActiveInspectorAdapters = () => {
            const adapters = {};
            const { inspectorAdapters: typeAdapters } = this.vis.type;
            // Add the requests inspector adapters if the vis type explicitly requested it via
            // inspectorAdapters.requests: true in its definition or if it's using the courier
            // request handler, since that will automatically log its requests.
            if ((typeAdapters && typeAdapters.requests) || this.vis.type.requestHandler === 'courier') {
                adapters.requests = new adapters_1.RequestAdapter();
            }
            // Add the data inspector adapter if the vis type requested it or if the
            // vis is using courier, since we know that courier supports logging
            // its data.
            if ((typeAdapters && typeAdapters.data) || this.vis.type.requestHandler === 'courier') {
                adapters.data = new adapters_1.DataAdapter();
            }
            // Add all inspectors, that are explicitly registered with this vis type
            if (typeAdapters && typeAdapters.custom) {
                Object.entries(typeAdapters.custom).forEach(([key, Adapter]) => {
                    adapters[key] = new Adapter();
                });
            }
            return adapters;
        };
        /**
         * Fetches new data and renders the chart. This will happen debounced for a couple
         * of milliseconds, to bundle fast successive calls into one fetch and render,
         * e.g. while resizing the window, this will be triggered constantly on the resize
         * event.
         *
         * @param  forceFetch=false Whether the request handler should be signaled to forceFetch
         *    (i.e. ignore caching in case it supports it). If at least one call to this
         *    passed `true` the debounced fetch and render will be a force fetch.
         */
        this.fetchAndRender = (forceFetch = false) => {
            this.shouldForceNextFetch = forceFetch || this.shouldForceNextFetch;
            this.element.setAttribute(LOADING_ATTRIBUTE, '');
            this.debouncedFetchAndRender();
        };
        this.handleVisUpdate = () => {
            if (this.appState) {
                this.appState.vis = this.vis.getState();
                this.appState.save();
            }
            this.fetchAndRender();
        };
        this.fetch = (forceFetch = false) => {
            this.dataLoaderParams.aggs = this.vis.getAggConfig();
            this.dataLoaderParams.forceFetch = forceFetch;
            this.dataLoaderParams.inspectorAdapters = this.inspectorAdapters;
            this.vis.filters = { timeRange: this.dataLoaderParams.timeRange };
            this.vis.requestError = undefined;
            this.vis.showRequestError = false;
            return this.dataLoader
                .fetch(this.dataLoaderParams)
                .then(data => {
                // Pipeline responses never throw errors, so we need to check for
                // `type: 'error'`, and then throw so it can be caught below.
                // TODO: We should revisit this after we have fully migrated
                // to the new expression pipeline infrastructure.
                if (data && data.type === 'error') {
                    throw data.error;
                }
                if (data && data.value) {
                    this.dataSubject.next(data.value);
                }
                return data;
            })
                .catch(this.handleDataLoaderError);
        };
        /**
         * When dataLoader returns an error, we need to make sure it surfaces in the UI.
         *
         * TODO: Eventually we should add some custom error messages for issues that are
         * frequently encountered by users.
         */
        this.handleDataLoaderError = (error) => {
            // TODO: come up with a general way to cancel execution of pipeline expressions.
            if (this.dataLoaderParams.searchSource && this.dataLoaderParams.searchSource.cancelQueued) {
                this.dataLoaderParams.searchSource.cancelQueued();
            }
            this.vis.requestError = error;
            this.vis.showRequestError =
                error.type && ['NO_OP_SEARCH_STRATEGY', 'UNSUPPORTED_QUERY'].includes(error.type);
            //Do not show notification toast if it's already being shown a similar toast
            this.errorHandler.handle(error.message, i18n_1.i18n.translate('common.ui.visualize.dataLoaderError', {
                defaultMessage: 'Error in visualization',
            }));
        };
        this.rendererProvider = (response) => {
            let renderer = null;
            let args = [];
            if (this.pipelineDataLoader) {
                renderer = registries_1.registries.renderers.get(lodash_1.get(response || {}, 'as', 'visualization'));
                args = [this.element, lodash_1.get(response, 'value', { visType: this.vis.type.name }), this.handlers];
            }
            else {
                renderer = visualization_loader_1.visualizationLoader;
                args = [
                    this.element,
                    this.vis,
                    lodash_1.get(response, 'value.visData', null),
                    lodash_1.get(response, 'value.visConfig', this.vis.params),
                    this.uiState,
                    {
                        listenOnChange: false,
                    },
                ];
            }
            if (!renderer) {
                return null;
            }
            return () => renderer.render(...args);
        };
        const { searchSource, vis } = savedObject;
        const { appState, uiState, queryFilter, timeRange, filters, query, autoFetch = true, pipelineDataLoader = false, Private } = params;
        this.errorHandler = errorHandler;
        this.dataLoaderParams = {
            searchSource,
            timeRange,
            query,
            queryFilter,
            filters,
            uiState,
            aggs: vis.getAggConfig(),
            forceFetch: false,
        };
        this.pipelineDataLoader = pipelineDataLoader;
        // Listen to the first RENDER_COMPLETE_EVENT to resolve this promise
        this.firstRenderComplete = new Promise(resolve => {
            this.listeners.once(RENDER_COMPLETE_EVENT, resolve);
        });
        element.setAttribute(LOADING_ATTRIBUTE, '');
        element.setAttribute(DATA_SHARED_ITEM, '');
        element.setAttribute(RENDERING_COUNT_ATTRIBUTE, '0');
        element.addEventListener('renderComplete', this.onRenderCompleteListener);
        this.autoFetch = autoFetch;
        this.appState = appState;
        this.vis = vis;
        if (uiState) {
            vis._setUiState(uiState);
        }
        this.uiState = this.vis.getUiState();
        this.handlers = {
            vis: this.vis,
            uiState: this.uiState,
            onDestroy: (fn) => (this.handlers.destroyFn = fn),
        };
        this.vis.on('update', this.handleVisUpdate);
        this.vis.on('reload', this.reload);
        this.uiState.on('change', this.onUiStateChange);
        if (autoFetch) {
            timefilter_1.timefilter.on('autoRefreshFetch', this.reload);
        }
        // This is a workaround to give maps visualizations access to data in the
        // globalState, since they can no longer access it via searchSource.
        // TODO: Remove this as a part of elastic/kibana#30593
        this.vis.API.getGeohashBounds = () => {
            return utils_1.queryGeohashBounds(this.vis, {
                filters: this.dataLoaderParams.filters,
                query: this.dataLoaderParams.query,
            });
        };
        this.dataLoader = pipelineDataLoader
            ? new pipeline_data_loader_1.PipelineDataLoader(vis)
            : new visualize_data_loader_1.VisualizeDataLoader(vis, Private);
        const visFilters = Private(vis_filters_1.VisFiltersProvider);
        this.renderCompleteHelper = new render_complete_1.RenderCompleteHelper(element);
        this.inspectorAdapters = this.getActiveInspectorAdapters();
        this.vis.openInspector = this.openInspector;
        this.vis.hasInspector = this.hasInspector;
        // init default actions
        lodash_1.forEach(this.vis.type.events, (event, eventName) => {
            if (event.disabled || !eventName) {
                return;
            }
            else {
                this.actions[eventName] = event.defaultAction;
            }
        });
        this.handlers.eventsSubject = new Rx.Subject();
        this.vis.eventsSubject = this.handlers.eventsSubject;
        this.events$ = this.handlers.eventsSubject.asObservable().pipe(operators_1.share());
        this.events$.subscribe(event => {
            if (this.actions[event.name]) {
                event.data.aggConfigs = utilities_1.getTableAggs(this.vis);
                const newFilters = this.actions[event.name](event.data) || [];
                visFilters.pushFilters(newFilters);
            }
        });
        this.dataSubject = new Rx.Subject();
        this.data$ = this.dataSubject.asObservable().pipe(operators_1.share());
        this.render();
    }
    /**
     * Update properties of the embedded visualization. This method does not allow
     * updating all initial parameters, but only a subset of the ones allowed
     * in {@link VisualizeUpdateParams}.
     *
     * @param params The parameters that should be updated.
     */
    update(params = {}) {
        // Apply data- attributes to the element if specified
        const dataAttrs = params.dataAttrs;
        if (dataAttrs) {
            Object.keys(dataAttrs).forEach(key => {
                if (dataAttrs[key] === null) {
                    this.element.removeAttribute(`data-${key}`);
                    return;
                }
                this.element.setAttribute(`data-${key}`, dataAttrs[key]);
            });
        }
        let fetchRequired = false;
        if (params.hasOwnProperty('timeRange')) {
            fetchRequired = true;
            this.dataLoaderParams.timeRange = params.timeRange;
        }
        if (params.hasOwnProperty('filters')) {
            fetchRequired = true;
            this.dataLoaderParams.filters = params.filters;
        }
        if (params.hasOwnProperty('query')) {
            fetchRequired = true;
            this.dataLoaderParams.query = params.query;
        }
        if (fetchRequired) {
            this.fetchAndRender();
        }
    }
    /**
     * Destroy the underlying Angular scope of the visualization. This should be
     * called whenever you remove the visualization.
     */
    destroy() {
        this.destroyed = true;
        this.debouncedFetchAndRender.cancel();
        if (this.autoFetch) {
            timefilter_1.timefilter.off('autoRefreshFetch', this.reload);
        }
        this.vis.removeListener('reload', this.reload);
        this.vis.removeListener('update', this.handleVisUpdate);
        this.element.removeEventListener('renderComplete', this.onRenderCompleteListener);
        this.uiState.off('change', this.onUiStateChange);
        visualization_loader_1.visualizationLoader.destroy(this.element);
        this.renderCompleteHelper.destroy();
        if (this.handlers.destroyFn) {
            this.handlers.destroyFn();
        }
    }
    /**
     * Return the actual DOM element (wrapped in jQuery) of the rendered visualization.
     * This is especially useful if you used `append: true` in the parameters where
     * the visualization will be appended to the specified container.
     */
    getElement() {
        return this.element;
    }
    /**
     * Returns a promise, that will resolve (without a value) once the first rendering of
     * the visualization has finished. If you want to listen to consecutive rendering
     * events, look into the `addRenderCompleteListener` method.
     *
     * @returns Promise, that resolves as soon as the visualization is done rendering
     *    for the first time.
     */
    whenFirstRenderComplete() {
        return this.firstRenderComplete;
    }
    /**
     * Adds a listener to be called whenever the visualization finished rendering.
     * This can be called multiple times, when the visualization rerenders, e.g. due
     * to new data.
     *
     * @param {function} listener The listener to be notified about complete renders.
     */
    addRenderCompleteListener(listener) {
        this.listeners.addListener(RENDER_COMPLETE_EVENT, listener);
    }
    /**
     * Removes a previously registered render complete listener from this handler.
     * This listener will no longer be called when the visualization finished rendering.
     *
     * @param {function} listener The listener to remove from this handler.
     */
    removeRenderCompleteListener(listener) {
        this.listeners.removeListener(RENDER_COMPLETE_EVENT, listener);
    }
}
exports.EmbeddedVisualizeHandler = EmbeddedVisualizeHandler;
