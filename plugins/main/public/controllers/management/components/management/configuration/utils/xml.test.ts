/* eslint-disable */
import { validateXML, replaceIllegalXML, replaceXML } from './xml';
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

    it('should escape backslashes in Windows paths with drive letters', () => {
      const windowsPath =
        '<var name="test_folder">C:\\Users\\Public\\Documents\\\\</var>';
      const result = replaceIllegalXML(windowsPath);
      expect(result).toContain('&amp;#92;');
      expect(result).not.toContain('C:\\Users');
      expect(result).toContain('C:&amp;#92;');
      expect(result).toContain('Users&amp;#92;');
    });

    it('should escape backslashes in Windows paths in var tags', () => {
      const varTagWithPath =
        '<var name="path">D:\\Program Files\\Wazuh\\</var>';
      const result = replaceIllegalXML(varTagWithPath);
      expect(result).toContain('&amp;#92;');
    });

    it('should escape backslashes in Windows paths ending with backslashes', () => {
      const pathEndingWithBackslash =
        '<directory>C:\\Users\\Test\\</directory>';
      const result = replaceIllegalXML(pathEndingWithBackslash);
      expect(result).toContain('&amp;#92;');
    });

    it('should NOT escape backslashes in command tags', () => {
      const commandWithRegex =
        "<command>netstat -tulpn | sed 's/\\([[:alnum:]]\\+\\)\\ +[[:digit:]]\\+\\ +[[:digit:]]\\+\\ +\\(.*\\):\\([[:digit:]]*\\)\\ +\\([0-9\\.\\:\\*]\\+\\).\\+\\ \\([[:digit:]]*\\/[[:alnum:]\\-]*\\).*/\\1 \\2 == \\3 == \\4 \\5/' | sort -k 4 -g</command>";
      const result = replaceIllegalXML(commandWithRegex);
      expect(result).toContain('\\+');
      expect(result).toContain('\\(');
      expect(result).not.toContain('&amp;#92;');
    });

    it('should NOT escape backslashes in multiline commands', () => {
      const multilineCommand =
        "<localfile>\n    <log_format>full_command</log_format>\n    <command>netstat -tulpn | sed 's/\\([[:alnum:]]\\+\\)\\ +[[:digit:]]\\+/' | sort -k 4 -g</command>\n    <alias>netstat listening ports</alias>\n</localfile>";
      const result = replaceIllegalXML(multilineCommand);
      // Backslashes in command content should NOT be escaped
      expect(result).toContain('\\+');
      expect(result).not.toContain('&amp;#92;');
    });

    it('should NOT escape backslashes in command syntax (pipes with sed/awk/grep)', () => {
      const commandSyntax =
        "netstat -tulpn | sed 's/\\(.*\\)/\\1/' | awk '{print $1}' | grep test";
      const result = replaceIllegalXML(commandSyntax);
      // Backslashes in command syntax should NOT be escaped
      expect(result).toContain('\\(');
      expect(result).toContain('\\)');
      expect(result).not.toContain('&amp;#92;');
    });

    it('should escape Windows paths but not commands in the same XML', () => {
      const mixedContent =
        '<var name="path">C:\\Users\\Test\\</var>\n<command>sed \'s/\\(.*\\)/\\1/\'</command>';
      const result = replaceIllegalXML(mixedContent);
      // Windows path should be escaped
      expect(result).toContain('C:&amp;#92;Users');
      // Command should NOT be escaped
      expect(result).toContain('\\(');
      expect(result).toContain('\\)');
    });

    it('should NOT escape backslashes in command content on the same line as closing command tag', () => {
      // This test covers the fix for lines containing </command> with command content
      // The closing tag should not cause the line to be misclassified as non-command
      const commandWithClosingTagOnSameLine =
        "<command>sed 's/\\([[:alnum:]]\\+\\)\\ +[[:digit:]]\\+/\' | sort</command>";
      const result = replaceIllegalXML(commandWithClosingTagOnSameLine);
      // Backslashes in command content should NOT be escaped even though </command> is on the same line
      expect(result).toContain('\\+');
      expect(result).toContain('\\(');
      expect(result).not.toContain('&amp;#92;');
    });

    it('should NOT escape backslashes in multiline command where last line contains closing tag', () => {
      // This test covers the specific case mentioned in the code review
      // where the closing </command> tag is on a line with command content
      const multilineCommandWithClosingTag =
        "<localfile>\n    <command>netstat -tulpn | sed 's/\\(.*\\)/\\1/' | sort -k 4 -g</command>\n    <alias>netstat</alias>\n</localfile>";
      const result = replaceIllegalXML(multilineCommandWithClosingTag);
      // Backslashes in command should NOT be escaped
      expect(result).toContain('\\(');
      expect(result).toContain('\\)');
      expect(result).not.toContain('&amp;#92;');
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
