/*
 * Wazuh app - Resolve function to parse configuration file
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { getWazuhCorePlugin } from '../../kibana-services';

export async function getWzConfig(wazuhConfig) {
  try {
    const defaultConfig = await getWazuhCorePlugin().configuration.getAll();
    wazuhConfig.setConfig(defaultConfig);
    return defaultConfig;
  } catch (error) {
    console.error(error);
  }
}
