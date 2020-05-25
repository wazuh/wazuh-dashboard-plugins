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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
const es_query_1 = require("@kbn/es-query");
// Adds a filter to a passed state
function getFilterGenerator(queryFilter) {
    const filterGen = {};
    filterGen.generate = (field, values, operation, index) => {
        values = Array.isArray(values) ? values : [values];
        const fieldName = lodash_1.default.isObject(field) ? field.name : field;
        const filters = lodash_1.default.flatten([queryFilter.getAppFilters()]);
        const newFilters = [];
        const negate = (operation === '-');
        // TODO: On array fields, negating does not negate the combination, rather all terms
        lodash_1.default.each(values, function (value) {
            let filter;
            const existing = lodash_1.default.find(filters, function (filter) {
                if (!filter)
                    return;
                if (fieldName === '_exists_' && filter.exists) {
                    return filter.exists.field === value;
                }
                if (lodash_1.default.has(filter, 'query.match')) {
                    return filter.query.match[fieldName] && filter.query.match[fieldName].query === value;
                }
                if (filter.script) {
                    return filter.meta.field === fieldName && filter.script.script.params.value === value;
                }
            });
            if (existing) {
                existing.meta.disabled = false;
                if (existing.meta.negate !== negate) {
                    existing.meta.negate = !existing.meta.negate;
                }
                newFilters.push(existing);
                return;
            }
            switch (fieldName) {
                case '_exists_':
                    filter = {
                        meta: { negate, index },
                        exists: {
                            field: value
                        }
                    };
                    break;
                default:
                    if (field.scripted) {
                        filter = {
                            meta: { negate, index, field: fieldName },
                            script: es_query_1.getPhraseScript(field, value)
                        };
                    }
                    else {
                        filter = { meta: { negate, index }, query: { match: {} } };
                        filter.query.match[fieldName] = { query: value, type: 'phrase' };
                    }
                    break;
            }
            newFilters.push(filter);
        });
        return newFilters;
    };
    filterGen.add = function (field, values, operation, index) {
        const newFilters = this.generate(field, values, operation, index);
        return queryFilter.addFilters(newFilters);
    };
    return filterGen;
}
exports.getFilterGenerator = getFilterGenerator;
