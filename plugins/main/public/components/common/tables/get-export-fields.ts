/*
 * Wazuh app - Fields of the visible table columns to export
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export interface ExportableColumn {
  field?: string;
  composeField?: string[];
  actions?: unknown;
}

/**
 * Returns the data fields behind the given table columns, in the same order,
 * so an export writes the columns the table shows. A column that composes
 * several fields (for example the operating system, built from `os.name` and
 * `os.version`) contributes each of them, and action columns, which hold no
 * data, are left out.
 *
 * @param columns - The visible table columns, in display order.
 * @returns The fields to export, without duplicates.
 */
export const getExportFields = (columns: ExportableColumn[]): string[] => {
  const fields = columns
    .filter(({ field, actions }) => field && !actions)
    .flatMap(({ field, composeField }) =>
      composeField?.length ? composeField : [field as string],
    );

  return [...new Set(fields)];
};
