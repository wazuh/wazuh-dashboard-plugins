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

// TODO these are imports from the old plugin world.
// Once the new platform is ready, they can get removed
// and handled by the platform itself in the setup method
// of the ExpressionExectorService
// @ts-ignore
import { renderersRegistry } from 'plugins/interpreter/registries';
import { ExpressionsService, ExpressionsSetup } from 'plugins/data/expressions';
import { QueryService, QuerySetup } from 'plugins/data/query';
import { FilterService, FilterSetup } from 'plugins/data/filter';
import { IndexPatternsService, IndexPatternsSetup } from 'plugins/data/index_patterns';

export class DataPlugin {
    // Exposed services, sorted alphabetically
    private readonly expressions: ExpressionsService;
    private readonly filter: FilterService;
    private readonly indexPatterns: IndexPatternsService;
    private readonly query: QueryService;

    constructor() {
        this.indexPatterns = new IndexPatternsService();
        this.filter = new FilterService();
        this.query = new QueryService();
        this.expressions = new ExpressionsService();
    }

    public setup(): DataSetup {
        // TODO: this is imported here to avoid circular imports.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { getInterpreter } = require('plugins/interpreter/interpreter');
        const indexPatternsService = this.indexPatterns.setup();
        return {
            expressions: this.expressions.setup({
                interpreter: {
                    getInterpreter,
                    renderersRegistry,
                },
            }),
            indexPatterns: indexPatternsService,
            filter: this.filter.setup({
                indexPatterns: indexPatternsService.indexPatterns,
            }),
            query: this.query.setup(),
        };
    }

    public stop() {
        this.expressions.stop();
        this.indexPatterns.stop();
        this.filter.stop();
        this.query.stop();
    }
}

/** @public */
export interface DataSetup {
    expressions: ExpressionsSetup;
    indexPatterns: IndexPatternsSetup;
    filter: FilterSetup;
    query: QuerySetup;
}

/** @public types */
export { ExpressionRenderer, ExpressionRendererProps, ExpressionRunner } from 'plugins/data/expressions';

/** @public types */
export { IndexPattern, StaticIndexPattern, StaticIndexPatternField, Field } from 'plugins/data/index_patterns';
export { Query, QueryBar } from 'plugins/data/query';
export { FilterBar } from 'plugins/data/filter';
export {
    FilterManager,
    FilterStateManager,
    uniqFilters,
    onlyDisabledFiltersChanged,
} from './filter-manager';

/** @public static code */
export { dateHistogramInterval } from 'plugins/data/filter/../../common/date_histogram_interval';
/** @public static code */
export {
    isValidEsInterval,
    InvalidEsCalendarIntervalError,
    InvalidEsIntervalFormatError,
    parseEsInterval,
    ParsedInterval,
} from 'plugins/data/filter/../../common/parse_es_interval';