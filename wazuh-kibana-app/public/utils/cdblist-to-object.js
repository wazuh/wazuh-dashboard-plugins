/*
 * Wazuh app - CDB lists strings to object
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export function stringToObj(str) {
  const result = {};
  if (!str || typeof str !== 'string' || !str.length) {
    return result;
  }
  const splitted = str.split('\n');
  splitted.forEach(function(element) {
    const keyValue = element.split(':');
    if (keyValue[0]) result[keyValue[0]] = keyValue[1];
  });
  return result;
}
