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
  // Step 1: -- characters are not allowed in XML comments
  text = replaceInComments(text, '--', '..');

  // Step 2: Replace &lt; and &gt; currently present in the config with temporary markers
  text = text
    .replace(/&lt;/g, '_custom_amp_lt_')
    .replace(/&gt;/g, '_custom_amp_gt_');

  // Step 3: Define custom entities (backslash)
  const customEntities = {
    backslash: '\\',
  };

  // Step 4: Handle \< and \> before replacing backslashes
  // Replace \< by a temporary marker (will be converted to &backslash;&lt; later)
  text = text.replace(/\\</g, '_temp_backslash_lt_');
  // Replace \> by a temporary marker (will be converted to &backslash;&gt; later)
  text = text.replace(/\\>/g, '_temp_backslash_gt_');

  // Step 5: Replace backslashes with custom entity &backslash;
  // But preserve backslashes in commands and JSON content
  const lines = text.split('\n');
  let insideCommandTag = false;
  let insideJsonContent = false;
  let resultLines = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    let processedLine = line;

    // Determine if this is a command line or JSON content BEFORE updating the flags
    const isCommand = isCommandLine(line, insideCommandTag);
    const isJsonContent = isJsonContentLine(line, insideJsonContent);

    // Only replace backslashes if NOT in commands or JSON content
    if (!isCommand && !isJsonContent) {
      // Replace backslashes with &backslash; entity
      processedLine = processedLine.replace(/\\/g, '&backslash;');
    }

    resultLines.push(processedLine);

    // Update flags AFTER processing the line
    if (/<command[^>]*>/i.test(line)) {
      insideCommandTag = true;
    }
    if (/<\/command>/i.test(line)) {
      insideCommandTag = false;
    }

    // Track JSON content state
    if (isJsonContent) {
      insideJsonContent = true;
    } else if (
      trimmedLine.includes('</') &&
      !trimmedLine.includes('{') &&
      !trimmedLine.includes('[')
    ) {
      insideJsonContent = false;
    }
  }

  text = resultLines.join('\n');

  // Step 6: < characters should be escaped as &lt; unless < is starting a <tag> or a comment
  // This regex matches < that is NOT followed by:
  // - /? (optional slash for closing tags)
  // - \w+ (word characters for tag names)
  // - .+> (any characters followed by > for tags)
  // - !-- (for comments)
  // Use a more explicit pattern to avoid issues with lookahead
  text = text.replace(/<(?!\/?\w+.*>|!--)/g, '&lt;');

  // Step 7: Replace temporary markers for \< and \>
  // Replace _temp_backslash_lt_ by &backslash;&lt;
  text = text.replace(/_temp_backslash_lt_/g, '&backslash;&lt;');
  // Replace _temp_backslash_gt_ by &backslash;&gt;
  text = text.replace(/_temp_backslash_gt_/g, '&backslash;&gt;');

  // Step 8: Restore temporary markers for &lt; and &gt;
  text = text
    .replace(/_custom_amp_lt_/g, '&lt;')
    .replace(/_custom_amp_gt_/g, '&gt;');

  // Step 9: & characters should be escaped if they don't represent an &entity;
  // Default entities: amp, lt, gt, apos, quot
  // Custom entities: backslash
  const defaultEntities = ['amp', 'lt', 'gt', 'apos', 'quot'];
  const allEntities = [...defaultEntities, ...Object.keys(customEntities)];
  const entityPattern = allEntities.join('|');
  const entityRegex = new RegExp(`&(?!(${entityPattern});)`, 'g');
  text = text.replace(entityRegex, '&amp;');

  return text;
};

/**
 * Validate XML
 * This function follows the validation flow:
 * 1. Replace -- in comments with %wildcard%
 * 2. Wrap content in <root>...</root> and temporarily escape &
 * 3. Parse and normalize XML (beautify)
 * 4. Revert xml.dom automatic replacements
 * 5. Remove added indentation
 * 6. Restore comments (%wildcard% -> --)
 * 7. Finally validate with load_wazuh_xml equivalent logic
 * @param {string} xml
 * @returns {string|boolean}
 */
export const validateXML = xml => {
  try {
    // Step 1: -- characters are not allowed in XML comments
    // Use %wildcard% as temporary replacement
    let content = replaceInComments(xml, '--', '%wildcard%');

    // Step 2: Beautify xml file and escape '&' character as it could come in some tag values unescaped
    // Wrap content in <root>...</root> and temporarily escape & to &amp;
    const wrappedContent = `<root>${content.replace(/&/g, '&amp;')}</root>`;
    const xmlDoc = parser.parseFromString(wrappedContent, 'text/xml');

    // Check for parsing errors
    const parsererror = xmlDoc.getElementsByTagName('parsererror');
    if (parsererror.length) {
      const xmlFullError = parsererror[0].textContent;
      return (
        (xmlFullError.match('error\\s.+\n') || [])[0] || 'Error validating XML'
      );
    }

    // Step 3: Extract and normalize content between <root> and </root>
    // Extract only the child content of the root element, skipping XML declaration and root tags
    const rootElement = xmlDoc.documentElement;
    if (!rootElement || rootElement.tagName !== 'root') {
      return 'Error validating XML: root element not found';
    }

    // Extract child nodes and serialize them individually
    // This extracts content between <root> and </root> tags
    let prettyXml = '';
    const childNodes = Array.from(rootElement.childNodes);

    for (const node of childNodes) {
      if (node.nodeType === 1) {
        // ELEMENT_NODE
        // Serialize element node
        if (typeof XMLSerializer !== 'undefined') {
          const serializer = new XMLSerializer();
          prettyXml += serializer.serializeToString(node) + '\n';
        } else {
          // Fallback: use outerHTML if available, otherwise construct manually
          prettyXml +=
            (node.outerHTML ||
              `<${node.tagName}>${node.textContent}</${node.tagName}>`) + '\n';
        }
      } else if (node.nodeType === 3) {
        // TEXT_NODE
        // Preserve significant text content
        const text = node.textContent.trim();
        if (text) {
          prettyXml += text + '\n';
        }
      } else if (node.nodeType === 8) {
        // COMMENT_NODE
        // Preserve comments
        prettyXml += `<!--${node.textContent}-->` + '\n';
      }
    }

    // If no children were found, get text content as fallback
    if (!prettyXml.trim() && rootElement.textContent) {
      prettyXml = rootElement.textContent;
    }

    // Step 4: Revert xml.dom replacings
    // xml.dom/minidom automatically escapes: &amp;, &lt;, &quot;, &gt;, &apos;
    // We need to revert these back to their original characters
    prettyXml = prettyXml
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'");

    // Step 5: Remove indentation added by pretty printing (2 spaces at start of each line)
    const indent = '  '; // 2 spaces indent
    const indentRegex = new RegExp(`^${indent.replace(/ /g, ' ')}`, 'gm');
    let finalXml = prettyXml.replace(indentRegex, '');

    // Remove empty lines and ensure final newline
    finalXml =
      finalXml
        .split('\n')
        .filter(line => line.trim())
        .join('\n') + '\n';

    // Step 6: Restore comments (%wildcard% -> --)
    finalXml = replaceInComments(finalXml, '%wildcard%', '--');

    // Step 7: Final validation using load_wazuh_xml equivalent logic
    // Apply replaceIllegalXML transformations (which includes load_wazuh_xml logic)
    finalXml = replaceIllegalXML(finalXml);

    // Remove XML declaration if present
    finalXml = finalXml.replace(/<\?xml[^>]*\?>/g, '');

    // Create DOCTYPE with custom entities
    const customEntities = {
      backslash: '\\',
    };
    const entities =
      '<!DOCTYPE xmlfile [\n' +
      Object.entries(customEntities)
        .map(([name, value]) => `<!ENTITY ${name} "${value}">`)
        .join('\n') +
      '\n]>\n';

    // Final parse with DOCTYPE and custom entities
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
