/*
 * Wazuh app - Wazuh table directive helper
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import ProcessEquivalence from '../../../../util/process-state-equivalence';

const splitArray = array => {
  if (Array.isArray(array)) {
    if (!array.length) return false;
    let str = '';
    for (const item of array) str += `${item}, `;
    str = str.substring(0, str.length - 2);
    return str;
  }
  return array;
};

const checkIfArray = item => {
  return typeof item === 'object' ? splitArray(item) : item === 0 ? '0' : item;
};

export function parseValue(key, item, instancePath, $sce = null) {
  if (
    (key === 'event' || (key.value && key.value === 'event')) && instancePath.includes('rootcheck') && $sce
  ) {

    if(typeof (item || {}).event === 'string') {
      const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/,'g');

      const matched = item.event.match(urlRegex)
      if(matched) {
        item.event = item.event.replace(matched,`<a href="${matched}">${matched}</a>`);
        item.event = $sce.trustAsHtml(item.event)
      }
    }
  }
  if (key === 'state' && instancePath.includes('processes')) {
    return ProcessEquivalence[item.state] || 'Unknown';
  }
  if (
    (key === 'description' || (key.value && key.value === 'description')) &&
    !item.description
  ) {
    return '-';
  }
  const isComposedString = typeof key === 'string' && key.includes('.');
  const isComposedObject =
    typeof key === 'object' && key.value && key.value.includes('.');
  if (isComposedString || isComposedObject) {
    const split = isComposedString ? key.split('.') : key.value.split('.');
    const [first, second] = split;
    return item[first] && item[first][second] ? item[first][second] : '-';
  } else {
    return checkIfArray(item[key.value || key]) || '-';
  }
}
