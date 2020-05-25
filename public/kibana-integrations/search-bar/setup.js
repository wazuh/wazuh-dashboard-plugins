"use strict";
/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// TODO these are imports from the old plugin world.
// Once the new platform is ready, they can get removed
// and handled by the platform itself in the setup method
// of the ExpressionExectorService
// @ts-ignore
const registries_1 = require("plugins/interpreter/registries");
const expressions_1 = require("plugins/data/expressions");
const query_1 = require("plugins/data/query");
const filter_1 = require("plugins/data/filter");
const index_patterns_1 = require("plugins/data/index_patterns");
class DataPlugin {
    constructor() {
        this.indexPatterns = new index_patterns_1.IndexPatternsService();
        this.filter = new filter_1.FilterService();
        this.query = new query_1.QueryService();
        this.expressions = new expressions_1.ExpressionsService();
    }
    setup() {
        // TODO: this is imported here to avoid circular imports.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getInterpreter } = require('plugins/interpreter/interpreter');
        const indexPatternsService = this.indexPatterns.setup();
        return {
            expressions: this.expressions.setup({
                interpreter: {
                    getInterpreter,
                    renderersRegistry: registries_1.renderersRegistry,
                },
            }),
            indexPatterns: indexPatternsService,
            filter: this.filter.setup({
                indexPatterns: indexPatternsService.indexPatterns,
            }),
            query: this.query.setup(),
        };
    }
    stop() {
        this.expressions.stop();
        this.indexPatterns.stop();
        this.filter.stop();
        this.query.stop();
    }
}
exports.DataPlugin = DataPlugin;
/** @public types */
var expressions_2 = require("plugins/data/expressions");
exports.ExpressionRenderer = expressions_2.ExpressionRenderer;
exports.ExpressionRendererProps = expressions_2.ExpressionRendererProps;
exports.ExpressionRunner = expressions_2.ExpressionRunner;
/** @public types */
var index_patterns_2 = require("plugins/data/index_patterns");
exports.IndexPattern = index_patterns_2.IndexPattern;
exports.StaticIndexPattern = index_patterns_2.StaticIndexPattern;
exports.StaticIndexPatternField = index_patterns_2.StaticIndexPatternField;
exports.Field = index_patterns_2.Field;
var query_2 = require("plugins/data/query");
exports.Query = query_2.Query;
exports.QueryBar = query_2.QueryBar;
var filter_2 = require("plugins/data/filter");
exports.FilterBar = filter_2.FilterBar;
var filter_manager_1 = require("./filter-manager");
exports.FilterManager = filter_manager_1.FilterManager;
exports.FilterStateManager = filter_manager_1.FilterStateManager;
exports.uniqFilters = filter_manager_1.uniqFilters;
exports.onlyDisabledFiltersChanged = filter_manager_1.onlyDisabledFiltersChanged;
/** @public static code */
var date_histogram_interval_1 = require("plugins/data/filter/../../common/date_histogram_interval");
exports.dateHistogramInterval = date_histogram_interval_1.dateHistogramInterval;
/** @public static code */
var parse_es_interval_1 = require("plugins/data/filter/../../common/parse_es_interval");
exports.isValidEsInterval = parse_es_interval_1.isValidEsInterval;
exports.InvalidEsCalendarIntervalError = parse_es_interval_1.InvalidEsCalendarIntervalError;
exports.InvalidEsIntervalFormatError = parse_es_interval_1.InvalidEsIntervalFormatError;
exports.parseEsInterval = parse_es_interval_1.parseEsInterval;
exports.ParsedInterval = parse_es_interval_1.ParsedInterval;
