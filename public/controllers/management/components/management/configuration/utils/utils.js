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

import js2xmlparser from 'js2xmlparser';
import XMLBeautifier from './xml-beautifier';

/**
 * Capitalize a string
 * @param {string} str String to capitalize
 * @returns {string}
 */
export const capitalize = str => str[0].toUpperCase() + str.slice(1);

/**
 * Get XML from a JSON adapting to Wazuh view of current configuration
 * @param {object} currentConfig Current config in JSON
 * @returns {string}
 */
export const getXML = currentConfig => {
  const config = {};
  Object.assign(config, currentConfig);
  const cleaned = objectWithoutProperties(config);
  const XMLContent = XMLBeautifier(
    js2xmlparser.parse('configuration', cleaned)
  );
  return XMLContent;
};

/**
 * Get JSON stringified of current configuration
 * @param {object} currentConfig Current config in JSON
 * @returns {string}
 */
export const getJSON = currentConfig => {
  const config = {};
  Object.assign(config, currentConfig);
  const cleaned = objectWithoutProperties(config);
  const JSONContent = JSON.stringify(cleaned, null, 2);
  return JSONContent;
};

/**
 * Check if a value is a string
 * @param {string} value Value to check
 * @returns {boolean}
 */
export const isString = value => typeof value === 'string';

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
      })
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
export const renderValueOrDefault = defaultValue => value =>
  typeof value !== 'undefined' ? value : defaultValue;

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
  value === 'no' ? 'enabled' : 'disabled';

/**
 * Return 'enabled' if value = 'yes', or 'disabled'
 * @param {value} value Value
 */
export const renderValueYesThenEnabled = value =>
  value === 'yes' ? 'enabled' : 'disabled';

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
