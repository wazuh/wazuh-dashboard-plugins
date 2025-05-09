/*
 * Wazuh app - XML utils tests.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { validateXML, replaceIllegalXML, replaceXML } from './xml';

// Mock DOMParser
global.DOMParser = class DOMParser {
  parseFromString(string, contentType) {
    if (contentType !== 'text/xml' && contentType !== 'text/html') {
      throw new Error('Invalid content type');
    }

    // For text/html parsing
    if (contentType === 'text/html') {
      return {
        documentElement: {
          textContent: string
        }
      };
    }

    // For XML validation
    if (string.includes('invalid-xml')) {
      return {
        getElementsByTagName: (tagName) => {
          if (tagName === 'parsererror') {
            return [{
              textContent: 'error parsing XML\nLine 1: Invalid XML'
            }];
          }
          return [];
        }
      };
    }

    // Valid XML
    return {
      getElementsByTagName: (tagName) => {
        if (tagName === 'parsererror') {
          return [];
        }
        return [];
      }
    };
  }
};

describe('XML Utils', () => {
  describe('validateXML', () => {
    it('should return false for valid XML', () => {
      const validXML = '<root><child>Test</child></root>';
      const result = validateXML(validXML);
      expect(result).toBe(false);
    });

    it('should handle XML with declaration', () => {
      const xmlWithDeclaration = '<?xml version="1.0" encoding="UTF-8"?><root><child>Test</child></root>';
      const result = validateXML(xmlWithDeclaration);
      expect(result).toBe(false);
    });

    it('should handle XML with escaped angle brackets', () => {
      const xmlWithEscapedBrackets = '<root><child>Test\\</child></root>';
      const result = validateXML(xmlWithEscapedBrackets);
      expect(result).toBe(false);
    });

  });

  describe('replaceIllegalXML', () => {
    it('should replace ampersands with &amp;', () => {
      const textWithAmpersand = 'Text with & ampersand';
      const result = replaceIllegalXML(textWithAmpersand);
      expect(result).toContain('&amp;');
    });

    it('should not replace already sanitized content', () => {
      const sanitizedText = 'Text with &amp; entity';
      const result = replaceIllegalXML(sanitizedText);
      expect(result).toBe(sanitizedText);
    });

    it('should handle multiline text correctly', () => {
      const multilineText = 'Line 1 with &\nLine 2 with &';
      const result = replaceIllegalXML(multilineText);
      expect(result).toContain('Line 1 with &amp;');
      expect(result).toContain('Line 2 with &amp;');
    });
  });

  describe('replaceXML', () => {
    it('should replace all occurrences of a string', () => {
      const original = 'test string with test pattern';
      const result = replaceXML(original, 'test', 'replaced');
      expect(result).toBe('replaced string with replaced pattern');
    });

    it('should handle special characters in replacement', () => {
      const original = 'string with & ampersand';
      const result = replaceXML(original, '&', '&amp;');
      expect(result).toBe('string with &amp; ampersand');
    });

    it('should handle empty strings', () => {
      const original = '';
      const result = replaceXML(original, 'test', 'replaced');
      expect(result).toBe('');
    });

    it('should return original string when pattern not found', () => {
      const original = 'original string';
      const result = replaceXML(original, 'not found', 'replaced');
      expect(result).toBe(original);
    });
  });
});