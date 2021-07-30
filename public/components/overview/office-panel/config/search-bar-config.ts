/*
 * Wazuh app - Office 365 Custom Search Bar Config.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const filtersValues: { type: string; key: string }[] = [
  {
    type: 'combobox',
    key: 'agent.id',
  },
  {
    type: 'combobox',
    key: 'agent.name',
  },
  {
    type: 'combobox',
    key: 'agent.ip',
  },
];
