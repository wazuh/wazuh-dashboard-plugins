/*
 * Wazuh app - Manager configuration XML utils.
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
 * Validate the manager configuration XML for well-formedness.
 *
 * Unlike `validateXML`, used by the agent Group configuration editor, this does
 * not rewrite the input: stray ampersands, multiple roots and legacy `<! !>`
 * comments are reported instead of repaired.
 *
 * Schema violations are out of scope. The manager owns the schema and reports
 * them through the Server API.
 *
 * @param {string} xml
 * @returns {string|boolean} An error message, or `false` when well-formed.
 */
/**
 * Where the parser stopped, read from the `parsererror` text. Every engine
 * words it differently — `error on line 9 at column 19`, `Line Number 9,
 * Column 19` and `9:19: unclosed tag` — so this reads the numbers rather than
 * the sentence, and reports nothing when it recognises neither shape.
 */
const readErrorPosition = text => {
  const named = {
    line: text.match(/line\s*(?:number)?\s*:?\s*(\d+)/i),
    column: text.match(/column\s*:?\s*(\d+)/i),
  };
  if (named.line) {
    return named.column
      ? `line ${named.line[1]}, column ${named.column[1]}`
      : `line ${named.line[1]}`;
  }

  const prefixed = text.match(/^\s*(\d+):(\d+):/);
  return prefixed ? `line ${prefixed[1]}, column ${prefixed[2]}` : undefined;
};

export const validateManagerXML = xml => {
  const xmlDoc = parser.parseFromString(xml, 'text/xml');
  const parsererror = xmlDoc.getElementsByTagName('parsererror');
  if (!parsererror.length) {
    return false;
  }
  const position = readErrorPosition(parsererror[0].textContent);
  return position
    ? `XML is not well-formed at ${position}`
    : 'Error validating XML';
};
