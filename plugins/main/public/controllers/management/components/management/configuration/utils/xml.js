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
 * Check if a line contains a Windows path pattern
 * Windows paths typically match patterns like:
 * - C:\Users\...
 * - D:\Program Files\...
 * - Paths ending with \\
 * - Paths in <var> tags (which often contain Windows paths)
 * @param {string} line
 * @returns {boolean}
 */
const isWindowsPath = line => {
  const trimmedLine = line.trim();
  // Check for Windows drive letter pattern (C:\, D:\, etc.)
  const windowsDrivePattern = /[A-Za-z]:\\/;
  // Check for Windows path ending with backslash (common pattern)
  const windowsPathEnding = /\\+$/;
  // Check if line is inside a <var> tag (often contains paths)
  const isVarTag =
    /<var[^>]*>/i.test(trimmedLine) ||
    trimmedLine.includes('</var>') ||
    (trimmedLine.includes('<var') && trimmedLine.includes('</var>'));

  // If it has a Windows drive letter, it's definitely a Windows path
  if (windowsDrivePattern.test(trimmedLine)) {
    return true;
  }

  // If it's in a <var> tag and has backslashes, likely a Windows path
  if (isVarTag && trimmedLine.includes('\\')) {
    return true;
  }

  // If it ends with backslashes, likely a Windows path
  if (trimmedLine.includes('\\') && windowsPathEnding.test(trimmedLine)) {
    return true;
  }

  return false;
};

/**
 * Check if a line contains JSON content
 * JSON content should not have backslashes escaped as they are part of the JSON syntax
 * (e.g., \n for newline, \t for tab, or Windows paths in JSON strings)
 * This is a general detection based on JSON structure, not specific tag names
 * @param {string} line
 * @param {boolean} insideJsonContent
 * @returns {boolean}
 */
const isJsonContentLine = (line, insideJsonContent) => {
  const trimmedLine = line.trim();

  // If we're already inside JSON content, this line is part of it
  if (insideJsonContent) {
    return true;
  }

  // General JSON detection: check for JSON structure patterns
  // JSON typically starts with { or [ and contains key-value pairs
  const startsWithJson =
    trimmedLine.startsWith('{') || trimmedLine.startsWith('[');

  // Check for JSON-like patterns: quotes, colons, and structure
  const hasJsonStructure =
    (trimmedLine.includes('"') && trimmedLine.includes(':')) ||
    (trimmedLine.includes('{') && trimmedLine.includes('}')) ||
    (trimmedLine.includes('[') && trimmedLine.includes(']'));

  // If it looks like JSON and contains backslashes, it's likely JSON content
  return (startsWithJson || hasJsonStructure) && trimmedLine.includes('\\');
};

/**
 * Check if a line is inside a command tag or contains command syntax
 * Commands should not have their backslashes escaped as they may contain
 * regex patterns or other shell syntax.
 * @param {string} line
 * @param {boolean} insideCommandTag
 * @returns {boolean}
 */
const isCommandLine = (line, insideCommandTag) => {
  const trimmedLine = line.trim();

  // If we're already inside a command tag, this line is part of the command
  if (insideCommandTag) {
    return true;
  }

  // Check if this line opens a command tag
  if (/<command[^>]*>/i.test(trimmedLine)) {
    return true;
  }

  // Check if this line contains command-like content (pipes, sed, awk, etc.)
  // This helps identify command content even if tags aren't clearly visible
  const hasCommandSyntax =
    trimmedLine.includes('|') &&
    (trimmedLine.includes('sed') ||
      trimmedLine.includes('awk') ||
      trimmedLine.includes('grep') ||
      trimmedLine.includes('sort') ||
      trimmedLine.includes('netstat') ||
      trimmedLine.includes('command'));

  return hasCommandSyntax;
};

/**
 * Replace illegal XML
 * @param {string} text
 * @returns {string}
 */
export const replaceIllegalXML = text => {
  const lines = text.split('\n');
  let insideCommandTag = false;
  let insideJsonContent = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Determine if this is a command line or JSON content BEFORE updating the flags
    const isCommand = isCommandLine(line, insideCommandTag);

    // Check if this line contains or continues JSON content (general detection)
    const isJsonContent = isJsonContentLine(line, insideJsonContent);

    // Extract content for sanitization (get text content, but keep original for tag detection)
    const oDOM = parser.parseFromString(trimmedLine, 'text/html');
    const textContent = oDOM.documentElement.textContent || trimmedLine;
    let sanitized = replaceXML(textContent, '&', '&amp;');

    /*
      This lines escapes the backslashes to avoid code editor
      error validation. The case is when a windows path is used inside a XML tag
      or as an attribute value. We only escape backslashes in Windows paths,
      not in command syntax (like regex patterns in sed commands) or JSON content.
    */
    if (sanitized.includes('\\') && !sanitized.includes('&amp;#92;')) {
      // Don't escape backslashes in commands or JSON content
      // Only escape in Windows paths that are NOT commands or JSON
      if (!isCommand && !isJsonContent && isWindowsPath(line)) {
        sanitized = replaceXML(sanitized, '\\', '&amp;#92;');
      }
    }

    /**
     * Do not remove this condition. We don't want to replace
     * non-sanitized lines.
     */
    if (textContent !== sanitized && line.includes(textContent)) {
      text = replaceXML(text, textContent, sanitized);
    }

    // Update flags AFTER processing the line
    if (/<command[^>]*>/i.test(line)) {
      insideCommandTag = true;
    }
    if (/<\/command>/i.test(line)) {
      insideCommandTag = false;
    }

    // Track JSON content state: if we detect JSON structure, mark as inside JSON
    // Reset when we see a closing XML tag (indicating end of content)
    if (isJsonContent) {
      insideJsonContent = true;
    } else if (
      trimmedLine.includes('</') &&
      !trimmedLine.includes('{') &&
      !trimmedLine.includes('[')
    ) {
      // Reset JSON state when we see a closing XML tag and no JSON structure continues
      insideJsonContent = false;
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
  const xmlReplaced = replaceIllegalXML(xml)
    .replace(/..xml.+\?>/, '')
    .replace(/\\</gm, '');
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
