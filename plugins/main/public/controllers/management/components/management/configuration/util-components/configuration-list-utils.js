/*
 * Wazuh app - Shared helpers for rendering a dynamic list of configured items.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { get } from 'lodash';

/** `field: ''` is the bare-scalar-list convention (e.g. a list of plain
 * path strings) -- the item itself is the value, there is nothing to
 * `get()` into. */
export const readItemField = (item, field) =>
  field === '' ? item : get(item, field);

export const itemMatchesQuery = (list, item, index, q) => {
  if (!q) {
    return true;
  }
  const label = list.itemLabel(item, index);
  const fieldTexts = list.itemFields.flatMap(f => {
    const raw = readItemField(item, f.field);
    const effective = f.render ? f.render(raw) : raw;
    return [f.label, effective];
  });
  return [label, ...fieldTexts]
    .filter(v => v !== undefined && v !== null)
    .some(v => String(v).toLowerCase().includes(q));
};
