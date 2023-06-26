/*
 * Wazuh app - Strings tools class
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export class StringsTools {
  constructor() {}
  /**
   * Set the first letter to upper case
   *
   * @param {*} str
   * @returns capitalized str
   * @memberof StringsTools
   */
  capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  /**
   * Remove all white spaces from str
   *
   * @param {*} str
   * @returns striped str
   * @memberof StringsTools
   */
  strip(str) {
    return str.replace(/\s+/g, '');
  }

  toUpperCamelCase(str) {
    const capitalizeStrs = str.split(' ').map((s) => this.capitalize(s));
    return capitalizeStrs.join('');
  }

  /**
   * Returns a version of the string with the first letter capitalized.
   * @param str {string}
   * @returns {string}
   */
  upperFirst(str = '') {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }
}
