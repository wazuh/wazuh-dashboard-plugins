/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { AppState } from './app-state';

import { Query, TimeRange, Filter } from '../../../../src/plugins/data/common';
import { getDataPlugin } from '../kibana-services';

export interface IFilterParams {
  filters: Filter[];
  query: Query;
  time: TimeRange;
}

export async function getIndexPattern() {
  const idIndexPattern = AppState.getCurrentPattern();
  const indexPattern = await getDataPlugin().indexPatterns.get(idIndexPattern);
  return indexPattern;
}
