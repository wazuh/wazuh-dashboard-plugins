/*
 * Wazuh app - Components compatibility operative system
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const UnsupportedComponents = {
  linux: [],
  windows: ['audit', 'oscap', 'docker'],
  darwin: ['audit', 'oscap', 'vuls', 'docker'],
  other: ['audit', 'oscap', 'vuls', 'docker']
};
