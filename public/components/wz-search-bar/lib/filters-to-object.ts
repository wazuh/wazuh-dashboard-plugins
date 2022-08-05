/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export interface IFilter {
  field: string | 'q';
  value: any;
}
import { QInterpreter } from './q-interpreter';

/**
 * Concatenate string filters to one and only query string
 *
 * @param oldQ
 * @param newQ
 * @returns string
 */
function buildQFilter(oldQ, newQ) {
  const queryString = new QInterpreter(newQ).queriesToString();
  let parsedNewQ = '';
  if (queryString) {
    parsedNewQ = oldQ ? `(${queryString})` : queryString;
  }
  return `${!!oldQ ? `${oldQ};` : ''}${parsedNewQ}`;
}

/**
 * Receives a list of filters and return a query string translated
 *
 * @param filters
 * @returns object with query string and filters
 */
export function filtersToObject(filters: IFilter[]) {
  return filters.reduce((acc, filter) => {
    const { field, value } = filter;
    if (field === 'q') {
      return {
        ...acc,
        q: buildQFilter(acc['q'], value),
      };
    }
    const newAcc = {
      ...acc,
      [field]: value,
    };
    return newAcc;
  }, {});
}
