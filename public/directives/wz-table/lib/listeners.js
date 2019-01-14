/*
 * Wazuh app - Wazuh table directive event listeners
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export function wazuhUpdateInstancePath(parameters, instance, init) {
  instance.filters = [];
  instance.path = parameters.path;
  return init();
}

export function wazuhFilter(parameters, filter) {
  return filter(parameters.filter);
}

export function wazuhQuery(parameters, query) {
  return query(parameters.query, parameters.search);
}

export function wazuhSearch(parameters, instance, search) {
  try {
    const matchesSpecificPath =
      parameters &&
      parameters.specificPath &&
      !instance.path.includes(parameters.specificPath);
    const matchesSpecificFilter =
      parameters &&
      parameters.specificFilter &&
      !instance.filters.filter(
        filter =>
          filter.name === parameters.specificFilter.name &&
          filter.value === parameters.specificFilter.value
      ).length;

    if (matchesSpecificPath || matchesSpecificFilter) {
      return;
    }
    return search(parameters.term, parameters.removeFilters);
  } catch (error) {
    return;
  }
}

export function wazuhRemoveFilter(parameters, instance, wzTableFilter, init) {
  instance.filters = instance.filters.filter(
    item => item.name !== parameters.filterName
  );
  wzTableFilter.set(instance.filters);
  return init();
}
