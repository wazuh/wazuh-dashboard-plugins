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
 * @param {string} line
 * @returns {boolean}
 */
const isWindowsPath = line => {
  const trimmedLine = line.trim();
  const windowsDrivePattern = /[A-Za-z]:\\/;
  const windowsPathEnding = /\\+$/;
  const isVarTag =
    /<var[^>]*>/i.test(trimmedLine) ||
    trimmedLine.includes('</var>') ||
    (trimmedLine.includes('<var') && trimmedLine.includes('</var>'));

  if (windowsDrivePattern.test(trimmedLine)) {
    return true;
  }
  if (isVarTag && trimmedLine.includes('\\')) {
    return true;
  }
  if (trimmedLine.includes('\\') && windowsPathEnding.test(trimmedLine)) {
    return true;
  }
  return false;
};

/**
 * Check if a line contains JSON content
 * Relies solely on XML tags (<options>), not on JSON structure detection
 * @param {string} line
 * @param {boolean} insideJsonContent
 * @returns {boolean}
 */
const isJsonContentLine = (line, insideJsonContent) => {
  if (insideJsonContent) {
    return true;
  }
  // Only detect JSON content within <options> tags
  return /<options[^>]*>/i.test(line.trim());
};

/**
 * Check if a line is inside a command tag
 * Relies solely on XML tags, not on command syntax patterns
 * @param {string} line
 * @param {boolean} insideCommandTag
 * @returns {boolean}
 */
const isCommandLine = (line, insideCommandTag) => {
  if (insideCommandTag) {
    return true;
  }
  // Check if line contains <command> tag
  return /<command[^>]*>/i.test(line.trim());
};

/**
 * Replace -- characters in XML comments (not allowed in XML)
 * @param {string} content
 * @param {string} toBeReplaced
 * @param {string} replacement
 * @returns {string}
 */
const replaceInComments = (content, toBeReplaced, replacement) => {
  const xmlCommentRegex = /<!--(.*?)-->/gs;
  let result = content;
  let match;
  while ((match = xmlCommentRegex.exec(content)) !== null) {
    const commentContent = match[1];
    const goodComment = commentContent.replace(
      new RegExp(toBeReplaced.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      replacement,
    );
    result = result.replace(commentContent, goodComment);
  }
  return result;
};

/**
 * Replace illegal XML
 * @param {string} text
 * @returns {string}
 */
export const replaceIllegalXML = text => {
  text = replaceInComments(text, '--', '..');
  text = text
    .replace(/&lt;/g, '_custom_amp_lt_')
    .replace(/&gt;/g, '_custom_amp_gt_');
  const customEntities = {
    backslash: '\\',
  };
  text = text.replace(/\\<(?!\/\w+>)/g, '_temp_backslash_lt_');
  text = text.replace(/\\>/g, '_temp_backslash_gt_');
  const lines = text.split('\n');
  let insideCommandTag = false;
  let insideJsonContent = false;
  let resultLines = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    let processedLine = line;
    const isCommand = isCommandLine(line, insideCommandTag);
    const isJsonContent = isJsonContentLine(line, insideJsonContent);
    const isWindowsPathLine = isWindowsPath(line);

    if (isWindowsPathLine && !isJsonContent) {
      processedLine = processedLine.replace(/\\/g, '&backslash;');
    } else if (!isCommand && !isJsonContent) {
      processedLine = processedLine.replace(/\\/g, '&backslash;');
    }

    resultLines.push(processedLine);

    // Update command tag state
    if (/<command[^>]*>/i.test(line)) {
      insideCommandTag = true;
    }
    if (/<\/command>/i.test(line)) {
      insideCommandTag = false;
    }

    // Update JSON content state (only for <options> tags)
    if (/<options[^>]*>/i.test(line)) {
      insideJsonContent = true;
    }
    if (/<\/options>/i.test(line)) {
      insideJsonContent = false;
    }
  }

  text = resultLines.join('\n');
  text = text.replace(/<(?!\/?\w+[^<]*>|!--)/g, '&lt;');
  text = text.replace(/_temp_backslash_lt_/g, '&backslash;&lt;');
  text = text.replace(/_temp_backslash_gt_/g, '&backslash;&gt;');
  text = text
    .replace(/_custom_amp_lt_/g, '&lt;')
    .replace(/_custom_amp_gt_/g, '&gt;');

  const defaultEntities = ['amp', 'lt', 'gt', 'apos', 'quot'];
  const allEntities = [...defaultEntities, ...Object.keys(customEntities)];
  const entityPattern = allEntities.join('|');
  const entityRegex = new RegExp(`&(?!(${entityPattern});)`, 'g');
  text = text.replace(entityRegex, '&amp;');

  return text;
};

/**
 * Validate XML
 * @param {string} xml
 * @returns {string|boolean}
 */
export const validateXML = xml => {
  try {
    let content = xml.replace(/<\?xml[^>]*\?>/g, '');
    content = replaceInComments(content, '--', '%wildcard%');
    const wrappedContent = `<root>${content.replace(/&/g, '&amp;')}</root>`;
    const xmlDoc = parser.parseFromString(wrappedContent, 'text/xml');

    const parsererror = xmlDoc.getElementsByTagName('parsererror');
    if (parsererror.length) {
      const xmlFullError = parsererror[0].textContent;
      return (
        (xmlFullError.match('error\\s.+\n') || [])[0] || 'Error validating XML'
      );
    }

    const rootElement = xmlDoc.documentElement;
    if (!rootElement || rootElement.tagName !== 'root') {
      return 'Error validating XML: root element not found';
    }

    let prettyXml = '';
    const childNodes = Array.from(rootElement.childNodes);

    for (const node of childNodes) {
      if (node.nodeType === 1) {
        if (typeof XMLSerializer !== 'undefined') {
          const serializer = new XMLSerializer();
          prettyXml += serializer.serializeToString(node) + '\n';
        } else {
          prettyXml +=
            (node.outerHTML ||
              `<${node.tagName}>${node.textContent}</${node.tagName}>`) + '\n';
        }
      } else if (node.nodeType === 3) {
        const text = node.textContent.trim();
        if (text) {
          prettyXml += text + '\n';
        }
      } else if (node.nodeType === 8) {
        prettyXml += `<!--${node.textContent}-->` + '\n';
      }
    }

    if (!prettyXml.trim() && rootElement.textContent) {
      prettyXml = rootElement.textContent;
    }

    prettyXml = prettyXml
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'");

    const indent = '  ';
    const indentRegex = new RegExp(`^${indent.replace(/ /g, ' ')}`, 'gm');
    let finalXml = prettyXml.replace(indentRegex, '');
    finalXml =
      finalXml
        .split('\n')
        .filter(line => line.trim())
        .join('\n') + '\n';

    finalXml = replaceInComments(finalXml, '%wildcard%', '--');
    finalXml = replaceIllegalXML(finalXml);
    finalXml = finalXml.replace(/<\?xml[^>]*\?>/g, '');

    const customEntities = {
      backslash: '\\',
    };
    const entities =
      '<!DOCTYPE xmlfile [\n' +
      Object.entries(customEntities)
        .map(([name, value]) => `<!ENTITY ${name} "${value}">`)
        .join('\n') +
      '\n]>\n';

    const finalXmlDoc = parser.parseFromString(
      `${entities}<root_tag>${finalXml}</root_tag>`,
      'text/xml',
    );

    const finalParsererror = finalXmlDoc.getElementsByTagName('parsererror');
    if (finalParsererror.length) {
      const xmlFullError = finalParsererror[0].textContent;
      return (
        (xmlFullError.match('error\\s.+\n') || [])[0] || 'Error validating XML'
      );
    }

    return false;
  } catch (error) {
    return `Error validating XML: ${error.message}`;
  }
};
