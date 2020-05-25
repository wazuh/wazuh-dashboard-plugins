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
const isEnabled = function (filter) {
    return filter && filter.meta && !filter.meta.disabled;
};
/**
 * Checks to see if only disabled filters have been changed
 * @returns {bool} Only disabled filters
 */
function onlyDisabledFiltersChanged(newFilters, oldFilters) {
    // If it's the same - compare only enabled filters
    const newEnabledFilters = lodash_1.default.filter(newFilters, isEnabled);
    const oldEnabledFilters = lodash_1.default.filter(oldFilters, isEnabled);
    return lodash_1.default.isEqual(oldEnabledFilters, newEnabledFilters);
}
exports.onlyDisabledFiltersChanged = onlyDisabledFiltersChanged;
