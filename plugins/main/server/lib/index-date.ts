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

/**
 * Generates a date suffix for index names.
 * @param interval - 'h' (hourly), 'd' (daily), 'w' (weekly ISO), 'm' (monthly)
 * @returns Formatted date string
 */
export function indexDate(interval: 'h' | 'd' | 'w' | 'm'): string {
  try {
    if (!interval) throw new Error('Creation interval not found');

    const now = new Date();
    const isoString = now
      .toISOString()
      .replace(/T/, '-')
      .replace(/\..+/, '')
      .replace(/-/g, '.')
      .replace(/:/g, '');

    let dateSuffix = '';

    switch (interval) {
      case 'h':
        // YYYY.MM.DD.HHh
        dateSuffix = isoString.slice(0, -4) + 'h';
        break;
      case 'd':
        // YYYY.MM.DD
        dateSuffix = isoString.slice(0, -7);
        break;
      case 'w':
        // YYYY.Ww
        const isoWeekDate = getISOWeekDate(now);
        dateSuffix = `${isoWeekDate.year}.${isoWeekDate.week}w`;
        break;
      case 'm':
        // YYYY.MM
        dateSuffix = isoString.slice(0, -10);
        break;
      default:
        throw new Error('Creation interval not found');
    }

    return dateSuffix;
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

/**
 * Calculates ISO 8601 week date (week year and week number).
 * Week 1 is the first week containing a Thursday.
 */
function getISOWeekDate(date: Date): { year: number; week: number } {
  const MILLISECONDS_PER_DAY = 86400000;
  const THURSDAY = 4;
  const DAYS_IN_WEEK = 7;

  const targetDate = new Date(date.getTime());
  targetDate.setHours(0, 0, 0, 0);

  const dayOfWeek = targetDate.getDay() || DAYS_IN_WEEK;
  targetDate.setDate(targetDate.getDate() + THURSDAY - dayOfWeek);

  const isoYear = targetDate.getFullYear();
  const yearStart = new Date(isoYear, 0, 1);
  const weekNumber = Math.ceil(
    ((targetDate.getTime() - yearStart.getTime()) / MILLISECONDS_PER_DAY + 1) /
      DAYS_IN_WEEK,
  );

  return {
    year: isoYear,
    week: weekNumber,
  };
}
