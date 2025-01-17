/*
 * Wazuh app - Time and date functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export function formatUINumber(value) {
  if (Number.isNaN(Number(value))) {
    return value;
  }
  return Number(value).toLocaleString('en-US');
}
