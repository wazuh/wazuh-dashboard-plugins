/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { FieldFormat } from 'plugins/kibana/../../../ui/field_formats/field_format.js';

/**
 * Extracts the value from a generated <span> in the Kibana field formatter.
 * @param {*} str 
 * @returns {string|boolean} If something fails, returns false.
 */
const getWazuhURL = str => {
  try {
    const isWazuh = str.includes('/app/wazuh');
    const isSpan = str.includes('<span');
    if (isWazuh && isSpan) {
      const spanContent = str.split('>')[1].split('<')[0];
      return spanContent;
    }
  } catch (error) {}
  return false;
};

/**
 * The function we are overriding from Kibana. Enforcing to use simple links for Wazuh relative URLs.
 */
FieldFormat.prototype.convert = function(value, contentType) {
  const result = this.getConverterFor(contentType)(value);
  const wazuhURL = getWazuhURL(result);

  if (value && contentType === 'html' && wazuhURL) {
    const formattedURL = `<a href="${wazuhURL}" target="_blank" rel="noopener noreferrer">${value}</a>`;
    return formattedURL;
  }

  return result;
};
