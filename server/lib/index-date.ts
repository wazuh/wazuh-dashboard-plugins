/*
 * Wazuh app - Module to get the index name according to date interval
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export function indexDate(interval: 'h' | 'd' | 'w' | 'm'): string {
  try {
    if (!interval) throw new Error('Creation interval not found');
    const d = new Date()
      .toISOString()
      .replace(/T/, '-')
      .replace(/\..+/, '')
      .replace(/-/g, '.')
      .replace(/:/g, '');
    let date = '';
    switch (interval) {
      case 'h':
        date = d.slice(0, -4) + 'h';
        break;
      case 'd':
        date = d.slice(0, -7);
        break;
      case 'w':
        date = d.slice(0, -12) + weekOfYear() + 'w';
        break;
      case 'm':
        date = d.slice(0, -10);
        break;
      default:
        throw new Error('Creation interval not found');
    }
    return date;
  } catch (error) {
    return new Date()
      .toISOString()
      .replace(/T/, '-')
      .replace(/\..+/, '')
      .replace(/-/g, '.')
      .replace(/:/g, '')
      .slice(0, -7);
  }
}

function weekOfYear(): number {
  var d = new Date();
  d.setHours(0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7 + 1) / 7);
};
