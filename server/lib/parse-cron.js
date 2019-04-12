/*
 * Wazuh app - Module to transform seconds interval to cron readable format
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { log } from '../logger';
import cron from 'node-cron';

export function parseCron(interval) {
  try {
    if (!interval) throw new Error('Interval not found');

    const parsed = parseInt(interval);

    if (!parsed || typeof parsed !== 'number')
      throw new Error('Interval not valid');
    if (parsed < 60) throw new Error('Interval too low');
    if (parsed >= 84600) throw new Error('Interval too high');

    const minutes = parseInt(parsed / 60);

    const cronstr = `0 */${minutes} * * * *`;

    if (!cron.validate(cronstr))
      throw new Error(
        'Generated cron expression not valid for node-cron module'
      );

    return cronstr;
  } catch (error) {
    log(
      'cron:parse-interval',
      `Using default value due to: ${error.message || error}`
    );
    return '0 1 * * * *';
  }
}
