/*
 * Wazuh app - Module to transform seconds interval to cron readable format
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import cron from 'node-cron';
import { WAZUH_MONITORING_DEFAULT_CRON_FREQ } from '../../common/constants';

export function parseCron(interval: string) {
  try {
    if (!interval) throw new Error('Interval not found');

    const intervalToNumber: number = parseInt(interval);

    if (!intervalToNumber || typeof intervalToNumber !== 'number') {
      throw new Error('Interval not valid');
    }
    if (intervalToNumber < 60) {
      // 60 seconds / 1 minute
      throw new Error('Interval too low');
    }
    if (intervalToNumber >= 86400) {
      throw new Error('Interval too high');
    }

    const minutes = parseInt(intervalToNumber / 60);

    const cronstr = `0 */${minutes} * * * *`;

    if (!cron.validate(cronstr)) {
      throw new Error(
        'Generated cron expression not valid for node-cron module',
      );
    }
    return cronstr;
  } catch (error) {
    return WAZUH_MONITORING_DEFAULT_CRON_FREQ;
  }
}
