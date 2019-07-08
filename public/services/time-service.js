/*
 * Wazuh app - Time and date functions
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export class TimeService {
  /**
   * Returns given date adding the timezone offset
   * @param {string} date Date
   */
  offset(d) {
    try {
      const [day, time] = d.indexOf('T') !== -1 ? d.split('T') : d.split(' ');
      const [year, month, monthDay] =
        d.indexOf('-') !== -1 ? day.split('-') : day.split('/');
      const [hour, minute, seconds] = time.split(':');
      const date = new Date(
        year,
        parseInt(month) - 1,
        monthDay,
        hour,
        minute,
        seconds.split('.')[0]
      );
      const offset = new Date().getTimezoneOffset();
      const offsetTime = new Date(date.getTime() - offset * 60000);
      return offsetTime.toLocaleString('en-ZA').replace(',', '');
    } catch (error) {
      throw new Error(error);
    }
  }
}
