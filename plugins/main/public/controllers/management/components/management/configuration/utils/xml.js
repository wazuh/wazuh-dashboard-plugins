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
 * Validate XML
 * @param {string} xml
 * @returns {string|boolean}
 */
export const validateXML = xml => {
  // This handles Windows EventChannel query syntax like: \<QueryList\>\<Query Id="0"\>
  const xmlWithoutEscapedBrackets = xml
    .replace(/\\</gm, '')
    .replace(/\\>/gm, '');

  const xmlReplaced = replaceIllegalXML(xmlWithoutEscapedBrackets).replace(
    /..xml.+\?>/,
    '',
  );

  const xmlDoc = parser.parseFromString(
    `<file>${xmlReplaced}</file>`,
    'text/xml',
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
 * Check if a line number is inside a <query> tag block
 * @returns {boolean} True if the line is inside or is the closing </query> tag
 */
export const isLineInsideQueryTag = (content, lineNumber) => {
  const lines = content.split('\n');
  let insideQuery = false;

  for (let i = 0; i <= lineNumber && i < lines.length; i++) {
    const line = lines[i];
    const hasOpenTag = /<query[\s>]/i.test(line);
    const hasCloseTag = /<\/query>/i.test(line);

    if (hasOpenTag) {
      insideQuery = true;
    }

    if (hasCloseTag) {
      if (i === lineNumber) {
        return true;
      }
      insideQuery = false;
    }
  }

  return insideQuery;
};

/**
 * Check if content has escaped XML (\< or \>) inside query tags
 */
export const hasEscapedXmlInQueryTags = content => {
  const queryTagRegex = /<query[^>]*>([\s\S]*?)<\/query>/gi;
  let match;

  while ((match = queryTagRegex.exec(content)) !== null) {
    const queryContent = match[1];
    if (/\\[<>]/.test(queryContent)) {
      return true;
    }
  }
  return false;
};

/**
 * Setup editor annotation filtering for XML mode.
 * Filters out false positive errors caused by escaped XML in query tags.
 */
export const setupBackslashXmlAnnotationFilter = editor => {
  const session = editor.getSession();
  const originalSetAnnotations = session.setAnnotations.bind(session);

  session.setAnnotations = annotations => {
    const content = session.getValue();

    // If there's escaped XML in query tags, the code editor parser gets confused and reports
    // false errors. Use our own validateXML to determine if there are actual errors in this case.
    if (hasEscapedXmlInQueryTags(content) && !validateXML(content)) {
      originalSetAnnotations([]);
      return;
    }

    // Filter out annotations for lines inside query tags
    const filteredAnnotations = annotations.filter(
      annotation => !isLineInsideQueryTag(content, annotation.row),
    );
    originalSetAnnotations(filteredAnnotations);
  };
};
