/*
 * Wazuh app - Builders used in configuration.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { isString } from './utils';

/**
 * Build a object for settings list
 * @param {[]} items
 * @param {string} label
 */
export const settingsListBuilder = (items, label) =>
  items.map((item, key) => ({
    data: item,
    label: Array.isArray(label)
      ? label.reduce((sum, tag) => {
          if (sum) {
            return sum;
          }
          return typeof tag === 'string' && item[tag]
            ? item[tag]
            : typeof tag === 'function'
            ? tag(item)
            : sum;
        }, '')
      : typeof label === 'function'
      ? label(item)
      : item[label],
  }));

/**
 * Build a object for settings items used in WzConfigurationSettings
 * @param {*} items
 */
export const settingsBuilder = items =>
  items.map((item, key) => ({
    field: item[0],
    label: item[1],
  }));

/**
 * Build a object for help links
 * @param {*} items
 */
export const helpLinksBuilder = items =>
  items.map((item, key) => ({
    text: item[0],
    href: item[1],
  }));

/**
 * Build a object for current configuration with wodle inserted
 *
 * Resolves a wodle from either shape `currentConfig` can take:
 *
 *  - Manager: the Server API returns every wodle inside a single
 *    `wmodules-wmodules` section, as an array of one-key objects.
 *  - Agent: the reported configuration is keyed by module name, so a wodle is
 *    a top level key of its own.
 *
 * @param {*} currentConfig
 * @param {array|string} wodles
 */
export const wodleBuilder = (currentConfig, wodles) => {
  const result = {};
  const managerWodles = currentConfig['wmodules-wmodules'];
  const hasManagerWodles =
    managerWodles && !isString(managerWodles) && managerWodles.wmodules;

  wodles = typeof wodles === 'string' ? [wodles] : wodles;
  wodles.forEach(wodle => {
    if (hasManagerWodles) {
      const entry = managerWodles.wmodules.find(item => item[wodle]);
      result[wodle] = entry ? entry[wodle] : undefined;
    } else {
      result[wodle] = currentConfig[wodle];
    }
  });
  return result;
};
