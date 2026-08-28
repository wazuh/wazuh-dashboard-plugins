/*
 * Wazuh app - Shared table sorting formatter
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export interface SortField {
  field?: string;
  direction?: 'asc' | 'desc';
}

/**
 * Formats a table sort descriptor using the Wazuh Server API convention:
 * `+field` for ascending order and `-field` for descending order.
 *
 * @param sorting - Sort descriptor coming from the table state.
 * @returns The formatted sort value, or an empty string when incomplete.
 */
export const formatSorting = (sorting?: SortField): string => {
  if (!sorting?.field || !sorting?.direction) {
    return '';
  }
  return `${sorting.direction === 'asc' ? '+' : '-'}${sorting.field}`;
};
