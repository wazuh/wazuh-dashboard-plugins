/*
 * Wazuh app - Module to parse the configuration file
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import path from 'path';
let cachedConfiguration = null;
let lastAssign = new Date().getTime();
export function getConfiguration(isUpdating = false) {
  try {
    const now = new Date().getTime();
    const dateDiffer = now - lastAssign;
    if (!cachedConfiguration || dateDiffer >= 10000 || isUpdating) {
      const customPath = path.join(
        __dirname,
        '../../../../optimize/wazuh/config/wazuh.yml'
      );
      const raw = fs.readFileSync(customPath, { encoding: 'utf-8' });
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
