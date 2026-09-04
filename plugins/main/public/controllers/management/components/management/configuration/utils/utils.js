/*
 * Wazuh app - Utils used in configuration.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Capitalize a string
 * @param {string} str String to capitalize
 * @returns {string}
 */
export const capitalize = str => str[0].toUpperCase() + str.slice(1);

/**
 * Check if a value is a string
 * @param {string} value Value to check
 * @returns {boolean}
 */
export const isString = value => typeof value === 'string';

/**
 * Normalize a manager configuration boolean field into a real boolean.
 * Accepts either the legacy 'yes'/'no' string dialect (agent reports, older
 * agent fields) or a native boolean (manager fields).
 * Anything else is not a boolean value at all and resolves to `undefined`,
 * so callers keep their existing wrong-type/missing-value fallback.
 * @param {*} value Value to normalize
 * @returns {boolean|undefined}
 */
export const normalizeConfigBoolean = value =>
  typeof value === 'boolean'
    ? value
    : value === 'yes'
    ? true
    : value === 'no'
    ? false
    : undefined;

export const reportedEnabled = (value, enabledValue) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (
    typeof value === 'boolean' &&
    (enabledValue === 'yes' || enabledValue === 'no')
  ) {
    return (
      normalizeConfigBoolean(value) === normalizeConfigBoolean(enabledValue)
    );
  }
  return value === enabledValue;
};

/**
 * Check if a value is an array
 * @param {*} value Value to check
 * @returns {boolean}
 */
export const isArray = value => Array.isArray(value);

/**
 * Check if a value is a function
 * @param {any} value
 * @returns {boolean}
 */
export const isFunction = value => typeof value === 'function';

/**
 * Check if a JS object has more than 0 keys
 * @param {object} obj Object to check
 * @returns {undefined|boolean|number}
 */
export const hasSize = obj =>
  obj && typeof obj === 'object' && Object.keys(obj).length;

/**
 * Remove $$hashKey key from an object
 * @param {object} obj Object
 * @returns {object}
 */
export const objectWithoutProperties = obj => {
  try {
    const result = JSON.parse(
      JSON.stringify(obj, (key, val) => {
        if (key == '$$hashKey') {
          return undefined;
        }
        return val;
      }),
    );
    return result;
  } catch (error) {
    return {};
  }
};

/**
 * Create a function that returns a value if this isn't falsy or a default value instead
 * @param {any} defaultValue
 * @returns {function}
 */
export const renderValueOrDefault = defaultValue => value => {
  if (typeof value !== 'undefined') {
    if (isArray(value)) {
      return value.join(', ');
    }
    return value;
  }
  return defaultValue;
};

/**
 * Return value if isn't falsy or '-'
 * @param {value} value Value to return if it isn't falsy
 */
export const renderValueOrNoValue = renderValueOrDefault('-');

/**
 * Return value if isn't falsy or 'no'
 * @param {value} value Value to return if it isn't falsy
 */
export const renderValueOrNo = renderValueOrDefault('no');

/**
 * Return value if isn't falsy or 'yes'
 * @param {value} value Value to return if it isn't falsy
 */
export const renderValueOrYes = renderValueOrDefault('yes');

/**
 * Return 'enabled' if value = 'no', or 'disabled'
 * @param {value} value Value
 */
export const renderValueNoThenEnabled = value =>
  normalizeConfigBoolean(value) === false ? 'enabled' : 'disabled';

/**
 * Return 'enabled' if value = 'yes', or 'disabled'
 * @param {value} value Value
 */
export const renderValueYesThenEnabled = value =>
  normalizeConfigBoolean(value) === true ? 'enabled' : 'disabled';

/**
 * Render a boolean-ish configuration value as the UI's 'yes'/'no' vocabulary.
 * Accepts a native boolean or the legacy 'yes'/'no' string dialect; anything
 * else falls back to the default placeholder.
 * @param {*} value Value to render
 */
export const renderValueBooleanYesNo = value => {
  const normalized = normalizeConfigBoolean(value);
  return normalized === undefined
    ? renderValueOrNoValue(value)
    : normalized
    ? 'yes'
    : 'no';
};

/**
 * Return value if isn't falsy or 'all'
 * @param {value} value Value to return if it isn't falsy
 */
export const renderValueOrAll = value => value || 'all';

/**
 * Time delay
 * @param {number} timeMs
 * @returns {Promise}
 */
export const delay = timeMs =>
  new Promise((resolve, reject) => setTimeout(resolve, timeMs));
