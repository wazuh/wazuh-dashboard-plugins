/*
 * Wazuh app - Time and date functions
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import chrome from 'ui/chrome';
import moment from 'moment-timezone';

export class TimeService {
  /**
   * Returns given date adding the timezone offset
   * @param {string} date Date
   */
  static offset(d) {
    try {
      const dateUTC = moment.utc(d);
      const kibanaTz = chrome.getUiSettingsClient().get('dateFormat:tz');
      const dateLocate =
        kibanaTz === 'Browser'
          ? moment(dateUTC).local()
          : moment(dateUTC).tz(kibanaTz);
      return dateLocate.format('YYYY/MM/DD HH:mm:ss');
    } catch (error) {
      throw new Error(error);
    }
  }
}
