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

import _ from 'lodash';
import { Filter } from '@kbn/es-query';

const isEnabled = function(filter: Filter) {
  return filter && filter.meta && !filter.meta.disabled;
};
/**
 * Checks to see if only disabled filters have been changed
 * @returns {bool} Only disabled filters
 */
export function onlyDisabledFiltersChanged(newFilters: Filter[], oldFilters: Filter[]) {
  // If it's the same - compare only enabled filters
  const newEnabledFilters = _.filter(newFilters, isEnabled);
  const oldEnabledFilters = _.filter(oldFilters, isEnabled);

  return _.isEqual(oldEnabledFilters, newEnabledFilters);
}