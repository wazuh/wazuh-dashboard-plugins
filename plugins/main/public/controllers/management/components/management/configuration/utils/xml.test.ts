/* eslint-disable */
import {
  validateXML,
  replaceIllegalXML,
  replaceXML,
  isLineInsideQueryTag,
  hasEscapedXmlInQueryTags,
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

    it('should handle XML with escaped angle brackets in query tags (Windows EventChannel)', () => {
      const xmlWithEscapedQuery = `<localfile>
  <location>System</location>
  <log_format>eventchannel</log_format>
   <query>
     \\<QueryList\\>
       \\<Query Id="0" Path="System"\\>
         \\<Select Path="System"\\>*[System[(Level&lt;=3)]]\\</Select\\>
          \\</Query\\>
        \\</QueryList\\>
  </query>
</localfile>`;
      const result = validateXML(xmlWithEscapedQuery);
      expect(result).toBe(false);
    });

    it('should handle simple query format without escaping', () => {
      const xmlWithSimpleQuery = `<localfile>
        <location>System</location>
        <log_format>eventchannel</log_format>
        <query>Event/System[EventID=7040]</query>
      </localfile>`;
      const result = validateXML(xmlWithSimpleQuery);
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

  describe('isLineInsideQueryTag', () => {
    const xmlContent = `<localfile>
  <location>System</location>
  <query>
    \\<QueryList\\>
  </query>
</localfile>`;

    it('should return false for lines outside query tag', () => {
      expect(isLineInsideQueryTag(xmlContent, 0)).toBe(false); // <localfile>
      expect(isLineInsideQueryTag(xmlContent, 1)).toBe(false); // <location>
      expect(isLineInsideQueryTag(xmlContent, 5)).toBe(false); // </localfile>
    });

    it('should return true for lines inside query tag', () => {
      expect(isLineInsideQueryTag(xmlContent, 3)).toBe(true); // \<QueryList\>
    });

    it('should return true for the closing query tag line', () => {
      expect(isLineInsideQueryTag(xmlContent, 4)).toBe(true); // </query>
    });
  });

  describe('hasEscapedXmlInQueryTags', () => {
    it('should return true when query tag contains escaped XML', () => {
      const xml = `<localfile>
  <query>\\<QueryList\\></query>
</localfile>`;
      expect(hasEscapedXmlInQueryTags(xml)).toBe(true);
    });

    it('should return false when query tag has no escaped XML', () => {
      const xml = `<localfile>
  <query>Event/System[EventID=7040]</query>
</localfile>`;
      expect(hasEscapedXmlInQueryTags(xml)).toBe(false);
    });

    it('should return false when there is no query tag', () => {
      const xml = '<localfile><location>System</location></localfile>';
      expect(hasEscapedXmlInQueryTags(xml)).toBe(false);
    });
  });
});
