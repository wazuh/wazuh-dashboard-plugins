/*
 * Wazuh app - XML utils.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const parser = new DOMParser();

/**
 * Validate XML
 * @param {string} xml
 * @returns {string|boolean}
 */
export const validateXML = xml => {
  const xmlReplaced = replaceIllegalXML(xml)
    .replace(/..xml.+\?>/, '')
    .replace(/\\</gm, '');
  const xmlDoc = parser.parseFromString(
    `<file>${xmlReplaced}</file>`,
    'text/xml'
  );
  const parsererror = xmlDoc.getElementsByTagName('parsererror');
  if (parsererror.length) {
    const xmlFullError = parsererror[0].textContent;
    return (
      (xmlFullError.match('error\\s.+\n') || [])[0] || 'Error validating XML'
    );
  }
  return false;
};

/**
 * Replace illegal XML
 * @param {string} text
 * @returns {string}
 */
export const replaceIllegalXML = text => {
  const oDOM = parser.parseFromString(text, 'text/html');
  const lines = oDOM.documentElement.textContent.split('\n');

  for (const line of lines) {
    const sanitized = replaceXML(line.trim(), '&', '&amp;');

    /**
     * Do not remove this condition. We don't want to replace
     * non-sanitized lines.
     */
    if (!line.includes(sanitized)) {
      text = replaceXML(text, line.trim(), sanitized);
    }
  }
  return text;
};

/**
 * Replace string in a XML
 * @param {string} str
 * @param {string} split
 * @param {string} newstr
 * @returns {string}
 */
export const replaceXML = function(str, split, newstr) {
  return str.split(split).join(newstr);
};
