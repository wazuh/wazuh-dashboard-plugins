/* eslint-disable */
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
import { i18n } from '@osd/i18n';
import { readErrorPosition } from './xml-manager';

const parser = new DOMParser();

/**
 * Replace string in a XML
 * @param {string} str
 * @param {string} split
 * @param {string} newstr
 * @returns {string}
 */
export const replaceXML = function (str, split, newstr) {
  return str.split(split).join(newstr);
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
    let sanitized = replaceXML(line.trim(), '&', '&amp;');

    /*
      This lines escapes the backslashes to avoid code editor
      error validation. The case is when a windows path is used inside a XML tag
      or as an attribute value.
    */
    if (sanitized.includes('\\') && !sanitized.includes('&amp;#92;')) {
      sanitized = replaceXML(sanitized, '\\', '&amp;#92;');
    }

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
 * Normalize escaped closing angle brackets inside <query> tags.
 * Only targets \> that closes an escaped tag opened with \<
 * (e.g. \<QueryList\> → \<QueryList>), leaving everything else untouched.
 * @param {string} xml
 * @returns {string}
 */
export const normalizeQueryEscapes = xml =>
  xml.replace(
    /(<query>)([\s\S]*?)(<\/query>)/gm,
    (_, open, content, close) =>
      open + content.replace(/\\<([^<]*?)\\>/g, '\\<$1>') + close,
  );

const WRAPPER_OPEN_TAG = '<file>';

/**
 * Check the agent group configuration XML. The content is normalized
 * (EventChannel query escapes, illegal characters, XML declaration) and wrapped
 * in a single root before parsing, so several root elements are accepted.
 *
 * The reported line matches the edited text. The column is shifted back by the
 * wrapper on the first line, and stays approximate on lines the normalization
 * rewrites.
 *
 * @param {string} xml
 * @returns {false | { message: string, line?: number, column?: number }} The
 * error and where the parser stopped, or `false` when well-formed.
 */
export const readXMLError = xml => {
  const xmlNormalized = normalizeQueryEscapes(xml);
  const xmlReplaced = replaceIllegalXML(xmlNormalized)
    .replace(/..xml.+\?>/, '')
    .replace(/\\</gm, '');
  const xmlDoc = parser.parseFromString(
    `${WRAPPER_OPEN_TAG}${xmlReplaced}</file>`,
    'text/xml',
  );
  const parsererror = xmlDoc.getElementsByTagName('parsererror');
  if (!parsererror.length) {
    return false;
  }
  const position = readErrorPosition(parsererror[0].textContent);
  if (!position) {
    return {
      message: i18n.translate('wazuh.configuration.xml.validationError', {
        defaultMessage: 'Error validating XML',
      }),
    };
  }
  const { line } = position;
  const column =
    position.column && line === 1
      ? Math.max(position.column - WRAPPER_OPEN_TAG.length, 1)
      : position.column;
  const message = column
    ? i18n.translate('wazuh.configuration.xml.notWellFormedAtColumn', {
        defaultMessage:
          'XML is not well-formed at line {line}, column {column}',
        values: { line, column },
      })
    : i18n.translate('wazuh.configuration.xml.notWellFormedAtLine', {
        defaultMessage: 'XML is not well-formed at line {line}',
        values: { line },
      });
  return { message, line, column };
};

/**
 * Validate XML. See `readXMLError`.
 * @param {string} xml
 * @returns {string|boolean} An error message, or `false` when well-formed.
 */
export const validateXML = xml => {
  const error = readXMLError(xml);
  return error ? error.message : false;
};
