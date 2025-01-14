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

export function formatUINumber(number: number) {
  if (typeof number !== 'number') {
    return '-';
  }
  return Number(number).toLocaleString('en-US');
}

export function formatUIStringWithNumbers(value: string) {
  if (typeof value !== 'string') {
    return '-';
  }

  return value.replace(/\d+/g, match => {
    return Number(match).toLocaleString('en-US');
  });
}
