/*
 * Wazuh app - Module to parse the configuration file
 * Copyright (C) 2018 Wazuh, Inc.
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

export function getConfiguration() {
  try {
    const customPath = path.join(__dirname, '../../config.yml');
    const raw = fs.readFileSync(customPath, { encoding: 'utf-8' });
    const file = yml.load(raw);
    return file;
  } catch (error) {
    return false;
  }
}
