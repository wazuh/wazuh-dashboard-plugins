/* eslint-disable */
import {
  validateXML,
  replaceIllegalXML,
  replaceXML,
  normalizeQueryEscapes,
} from './xml';
global.DOMParser = class DOMParser {
  parseFromString(string, contentType) {
    if (contentType !== 'text/xml' && contentType !== 'text/html') {
      throw new Error('Invalid content type');
    }

    if (contentType === 'text/html') {
      return {
        documentElement: {
          textContent: string,
        },
      };
    }

    if (string.includes('invalid-xml')) {
      return {
        getElementsByTagName: tagName => {
          if (tagName === 'parsererror') {
            return [
              {
                textContent: 'error parsing XML\nLine 1: Invalid XML',
              },
            ];
          }
          return [];
        },
      };
    }

    return {
      getElementsByTagName: tagName => {
        if (tagName === 'parsererror') {
          return [];
        }
        return [];
      },
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
      const xmlWithDeclaration =
        '<?xml version="1.0" encoding="UTF-8"?><root><child>Test</child></root>';
      const result = validateXML(xmlWithDeclaration);
      expect(result).toBe(false);
    });

    it('should handle XML with escaped angle brackets', () => {
      const xmlWithEscapedBrackets = '<root><child>Test\\</child></root>';
      const result = validateXML(xmlWithEscapedBrackets);
      expect(result).toBe(false);
    });

    it('should handle XML with both escaped opening and closing angle brackets', () => {
      const xmlWithEscapedBrackets =
        '<localfile><query>\\<QueryList\\>\\<Query Id="0"\\>\\</Query\\>\\</QueryList\\></query></localfile>';
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

  describe('normalizeQueryEscapes', () => {
    it('should normalize \\<...\\> to \\<...> inside <query> tags', () => {
      const input = '<query>\\<QueryList\\>\\</QueryList\\></query>';
      const result = normalizeQueryEscapes(input);
      expect(result).toBe('<query>\\<QueryList>\\</QueryList></query>');
    });

    it('should not touch \\> outside <query> tags', () => {
      const input = '<root>\\<Test\\></root><query>\\<Q\\></query>';
      const result = normalizeQueryEscapes(input);
      expect(result).toBe('<root>\\<Test\\></root><query>\\<Q></query>');
    });

    it('should not touch standalone \\> without a preceding \\<', () => {
      const input = '<query>some text \\> here</query>';
      const result = normalizeQueryEscapes(input);
      expect(result).toBe('<query>some text \\> here</query>');
    });

    it('should handle escaped tags with attributes', () => {
      const input = '<query>\\<Select Path="Security"\\>*\\</Select\\></query>';
      const result = normalizeQueryEscapes(input);
      expect(result).toBe(
        '<query>\\<Select Path="Security">*\\</Select></query>',
      );
    });

    it('should handle multiple <query> blocks', () => {
      const input = '<query>\\<A\\></query><other/><query>\\<B\\></query>';
      const result = normalizeQueryEscapes(input);
      expect(result).toBe('<query>\\<A></query><other/><query>\\<B></query>');
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
