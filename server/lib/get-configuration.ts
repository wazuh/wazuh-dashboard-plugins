/*
 * Wazuh app - Module to parse the configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import yml from 'js-yaml';
import { WAZUH_DATA_CONFIG_APP_PATH, WAZUH_CONFIGURATION_CACHE_TIME } from '../../common/constants';

let cachedConfiguration: any = null;
let lastAssign: number = new Date().getTime();

export function getConfiguration(isUpdating: boolean = false) {
  try {
    const now = new Date().getTime();
    const dateDiffer = now - lastAssign;
    if (!cachedConfiguration || dateDiffer >= WAZUH_CONFIGURATION_CACHE_TIME || isUpdating) {
      const raw = fs.readFileSync(WAZUH_DATA_CONFIG_APP_PATH, { encoding: 'utf-8' });
      const file = yml.load(raw);

      for (const host of file.hosts) {
        Object.keys(host).forEach((k) => {
          host[k].password = '*****';
        });
      }
      cachedConfiguration = { ...file };
      lastAssign = now;
    }
    return cachedConfiguration;
  } catch (error) {
    return false;
  }
}
