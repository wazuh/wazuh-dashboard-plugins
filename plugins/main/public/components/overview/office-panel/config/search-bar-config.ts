/*
 * Wazuh app - Office 365 Custom Search Bar Config.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { getCustomValueSuggestion } from './helpers/helper-value-suggestion';

export const filtersValues: {
  type: string;
  key: string;
  placeholder: string;
  filterByKey?: boolean;
  options?: string[];
}[] = [
  {
    type: 'multiSelect',
    key: 'data.office365.Subscription',
    placeholder: 'Subscription',
  },
  {
    type: 'multiSelect',
    key: 'data.office365.UserType',
    placeholder: 'User Type',
    filterByKey: true,
    options: getCustomValueSuggestion('data.office365.UserType'),
  },
  {
    type: 'multiSelect',
    key: 'data.office365.ResultStatus',
    placeholder: 'Result Status',
  },
];
