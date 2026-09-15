/*
 * Wazuh app - Reading configuration values reported by the server and the
 * agents.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/* Since 5.0.0 the server reports the settings covered by its schema as native
booleans. Its other modules, and everything agents report, still use the
'yes'/'no' strings, and both dialects can appear in the same response. */

export type ConfigurationBoolean = boolean | 'yes' | 'no';

/** Reads both dialects. Anything that is not a boolean gives `undefined`. */
export const normalizeConfigBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  return undefined;
};

/** Whether the setting is on. A missing or wrong-typed value is not. */
export const isConfigEnabled = (value: unknown): boolean =>
  normalizeConfigBoolean(value) === true;
