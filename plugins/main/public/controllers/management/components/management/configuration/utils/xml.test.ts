/* eslint-disable */
import { validateXML, replaceIllegalXML, replaceXML } from './xml';
global.DOMParser = class DOMParser {
  parseFromString(string: string, contentType: string) {
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

    const hasError =
      string.includes('invalid-xml') ||
      (string.includes('<root><unclosed-tag></root>') &&
        !string.includes('DOCTYPE'));

    if (hasError) {
      return {
        documentElement: {
          tagName: 'parsererror',
        },
        getElementsByTagName: (tagName: string) => {
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

    const cleanedString = string.replace(/<\?xml[^>]*\?>/g, '');
    const rootMatch = cleanedString.match(/<root[^>]*>([\s\S]*)<\/root>/);
    const rootTagMatch = cleanedString.match(
      /<root_tag[^>]*>([\s\S]*)<\/root_tag>/,
    );
    const content = rootMatch?.[1] || rootTagMatch?.[1] || cleanedString;
    const tagName = rootMatch ? 'root' : rootTagMatch ? 'root_tag' : 'root';

    const mockDoc = {
      documentElement: {
        tagName: tagName,
        childNodes: [],
        textContent: content.replace(/<[^>]*>/g, ''),
        innerHTML: content,
      },
      getElementsByTagName: (tagName: string) => {
        if (tagName === 'parsererror') {
          return [];
        }
        if (tagName === 'root' || tagName === 'root_tag') {
          return [mockDoc.documentElement];
        }
        return [];
      },
    };

    return mockDoc;
  }
};

describe('XML Utils', () => {
  describe('validateXML', () => {
    beforeEach(() => {
      // Mock XMLSerializer if not available
      if (typeof XMLSerializer === 'undefined') {
        // @ts-ignore
        global.XMLSerializer = class XMLSerializer {
          serializeToString(node: any): string {
            if (node.nodeType === 1) {
              const tagName = node.tagName || node.nodeName;
              const children = Array.from(node.childNodes || [])
                .map((child: any) => this.serializeToString(child))
                .join('');
              return `<${tagName}>${children}</${tagName}>`;
            } else if (node.nodeType === 3) {
              return node.textContent || '';
            } else if (node.nodeType === 8) {
              return `<!--${node.textContent}-->`;
            }
            return '';
          }
        };
      }
    });

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

    it('should normalize XML content before validation', () => {
      const xmlWithAmpersand =
        '<root><child>Text with & ampersand</child></root>';
      const result = validateXML(xmlWithAmpersand);
      expect(result).toBe(false);
    });

    it('should handle XML with comments containing --', () => {
      const xmlWithComment =
        '<!-- Comment -- with double dash --><root><child>Test</child></root>';
      const result = validateXML(xmlWithComment);
      expect(result).toBe(false);
    });

    it('should return error message for invalid XML', () => {
      const invalidXML = '<root><unclosed-tag></root>';
      const result = validateXML(invalidXML);
      expect(result).not.toBe(false);
      expect(typeof result).toBe('string');
    });

    it('should handle XML with Windows paths', () => {
      const xmlWithPath = '<root><var>C:\\Users\\Test\\</var></root>';
      const result = validateXML(xmlWithPath);
      expect(result).toBe(false);
    });

    it('should handle XML with commands', () => {
      const xmlWithCommand =
        "<root><command>sed 's/\\(.*\\)/\\1/'</command></root>";
      const result = validateXML(xmlWithCommand);
      expect(result).toBe(false);
    });
  });

  describe('replaceIllegalXML', () => {
    it('should replace ampersands with &amp;', () => {
      const textWithAmpersand = 'Text with & ampersand';
      const result = replaceIllegalXML(textWithAmpersand);
      expect(result).toContain('&amp;');
    });

    it('should replace -- in XML comments with ..', () => {
      const xmlWithComment = '<!-- This is a comment -- with double dash -->';
      const result = replaceIllegalXML(xmlWithComment);
      expect(result).toContain(
        '<!-- This is a comment .. with double dash -->',
      );
    });

    it('should preserve existing &lt; and &gt; entities', () => {
      const xmlWithEntities = '<tag>Text with &lt; and &gt; entities</tag>';
      const result = replaceIllegalXML(xmlWithEntities);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should handle \\< and \\> by converting them to &backslash;&lt; and &backslash;&gt;', () => {
      const xmlWithEscapedBrackets =
        '<tag>Text with \\< and \\> brackets</tag>';
      const result = replaceIllegalXML(xmlWithEscapedBrackets);
      expect(result).toContain('&backslash;&lt;');
      expect(result).toContain('&backslash;&gt;');
    });

    it('should escape < characters that are not part of tags', () => {
      const xmlWithLt = '<tag>Text with < character</tag>';
      const result = replaceIllegalXML(xmlWithLt);
      expect(result).toContain('&lt;');
      expect(result).not.toContain('< character');
    });

    it('should not escape < characters that are part of tags', () => {
      const xmlWithTag = '<tag>Content</tag>';
      const result = replaceIllegalXML(xmlWithTag);
      expect(result).toContain('<tag>');
      expect(result).toContain('</tag>');
    });

    it('should not escape < characters in comments', () => {
      const xmlWithComment = '<!-- Comment with < character -->';
      const result = replaceIllegalXML(xmlWithComment);
      expect(result).toContain('<!--');
      expect(result).toContain('-->');
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
      // Verify the complete XML structure is preserved
      expect(result).toContain('<var name="test_folder">');
      expect(result).toContain('</var>');
      expect(result).toContain('&backslash;');
      expect(result).not.toContain('C:\\Users');
      expect(result).toContain('C:&backslash;');
      expect(result).toContain('Users&backslash;');
    });

    it('should escape backslashes in Windows paths in var tags', () => {
      const varTagWithPath =
        '<var name="path">D:\\Program Files\\Wazuh\\</var>';
      const result = replaceIllegalXML(varTagWithPath);
      expect(result).toContain('&backslash;');
    });

    it('should escape backslashes in Windows paths ending with backslashes', () => {
      const pathEndingWithBackslash =
        '<directory>C:\\Users\\Test\\</directory>';
      const result = replaceIllegalXML(pathEndingWithBackslash);
      expect(result).toContain('&backslash;');
    });

    it('should NOT escape backslashes in command tags', () => {
      const commandWithRegex =
        "<command>netstat -tulpn | sed 's/\\([[:alnum:]]\\+\\)\\ +[[:digit:]]\\+\\ +[[:digit:]]\\+\\ +\\(.*\\):\\([[:digit:]]*\\)\\ +\\([0-9\\.\\:\\*]\\+\\).\\+\\ \\([[:digit:]]*\\/[[:alnum:]\\-]*\\).*/\\1 \\2 == \\3 == \\4 \\5/' | sort -k 4 -g</command>";
      const result = replaceIllegalXML(commandWithRegex);
      expect(result).toContain('\\+');
      expect(result).toContain('\\(');
      expect(result).not.toContain('&backslash;');
    });

    it('should NOT escape backslashes in multiline commands', () => {
      const multilineCommand =
        "<localfile>\n    <log_format>full_command</log_format>\n    <command>netstat -tulpn | sed 's/\\([[:alnum:]]\\+\\)\\ +[[:digit:]]\\+/' | sort -k 4 -g</command>\n    <alias>netstat listening ports</alias>\n</localfile>";
      const result = replaceIllegalXML(multilineCommand);
      // Backslashes in command content should NOT be escaped
      expect(result).toContain('\\+');
      expect(result).not.toContain('&backslash;');
    });

    it('should NOT escape backslashes in command syntax (pipes with sed/awk/grep)', () => {
      const commandSyntax =
        "<command>netstat -tulpn | sed 's/\\(.*\\)/\\1/' | awk '{print $1}' | grep test</command>";
      const result = replaceIllegalXML(commandSyntax);
      // Backslashes in command content should NOT be escaped
      expect(result).toContain('\\(');
      expect(result).toContain('\\)');
      expect(result).not.toContain('&backslash;');
      // Verify XML structure is preserved
      expect(result).toContain('<command>');
      expect(result).toContain('</command>');
    });

    it('should escape Windows paths but not commands in the same XML', () => {
      const mixedContent =
        '<var name="path">C:\\Users\\Test\\</var>\n<command>sed \'s/\\(.*\\)/\\1/\'</command>';
      const result = replaceIllegalXML(mixedContent);
      // Windows path should be escaped
      expect(result).toContain('C:&backslash;Users');
      // Command should NOT be escaped
      expect(result).toContain('\\(');
      expect(result).toContain('\\)');
    });

    it('should NOT escape backslashes in command content on the same line as closing command tag', () => {
      // This test covers the fix for lines containing </command> with command content
      // The closing tag should not cause the line to be misclassified as non-command
      const commandWithClosingTagOnSameLine =
        "<command>sed 's/\\([[:alnum:]]\\+\\)\\ +[[:digit:]]\\+/' | sort</command>";
      const result = replaceIllegalXML(commandWithClosingTagOnSameLine);
      // Backslashes in command content should NOT be escaped even though </command> is on the same line
      expect(result).toContain('\\+');
      expect(result).toContain('\\(');
      expect(result).not.toContain('&backslash;');
    });

    it('should NOT escape backslashes in multiline command where last line contains closing tag', () => {
      // This test covers the specific case mentioned in the code review
      // where the closing </command> tag is on a line with command content
      const multilineCommandWithClosingTag =
        "<localfile>\n    <command>netstat -tulpn | sed 's/\\(.*\\)/\\1/' | sort -k 4 -g</command>\n    <alias>netstat</alias>\n</localfile>";
      const result = replaceIllegalXML(multilineCommandWithClosingTag);
      // Verify the complete XML structure is preserved
      expect(result).toContain('<localfile>');
      expect(result).toContain('<command>');
      expect(result).toContain('</command>');
      expect(result).toContain('</localfile>');
      // Backslashes in command should NOT be escaped
      expect(result).toContain('\\(');
      expect(result).toContain('\\)');
      expect(result).not.toContain('&backslash;');
    });

    it('should NOT escape backslashes in JSON content within options tag', () => {
      // This test covers the case where JSON content in <options> tag contains backslashes
      // (e.g., \n for newline, Windows paths in JSON strings)
      const integrationWithJsonOptions =
        '<integration>\n    <name>slack</name>\n    <hook_url>https://slack</hook_url>\n    <alert_format>json</alert_format>\n    <level>12</level>\n    <options>{"pretext":"hello_world\\n\\nanother line\\nC:\\text\\"}</options>\n</integration>';
      const result = replaceIllegalXML(integrationWithJsonOptions);
      // Verify the complete XML structure is preserved
      expect(result).toContain('<integration>');
      expect(result).toContain('<options>');
      expect(result).toContain('</options>');
      expect(result).toContain('</integration>');
      // Backslashes in JSON content should NOT be escaped
      expect(result).toContain('\\n');
      expect(result).toContain('C:\\text\\');
      expect(result).not.toContain('&backslash;');
    });

    it('should NOT escape backslashes in JSON content even if it contains Windows path pattern', () => {
      // JSON content should preserve backslashes even if they look like Windows paths
      const jsonWithWindowsPath =
        '<options>{"path":"C:\\Users\\Test\\","message":"Line 1\\nLine 2"}</options>';
      const result = replaceIllegalXML(jsonWithWindowsPath);
      // Verify the complete XML structure is preserved
      expect(result).toContain('<options>');
      expect(result).toContain('</options>');
      // Backslashes in JSON should NOT be escaped
      expect(result).toContain('C:\\Users\\Test\\');
      expect(result).toContain('\\n');
      expect(result).not.toContain('&backslash;');
    });

    it('should handle complete ossec.conf XML with commands, JSON, and Windows paths', () => {
      // Complete XML configuration file with various content types
      const completeXML = `<!--
  Wazuh - Manager - Default configuration
-->

<ossec_config>
  <localfile>
    <log_format>full_command</log_format>
    <command>netstat -tulpn | sed 's/\\([[:alnum:]]\\+\\)\\ +[[:digit:]]\\+\\ +[[:digit:]]\\+\\ +\\(.*\\):\\([[:digit:]]*\\)\\ +\\([0-9\\.\\:\\*]\\+\\).\\+\\ \\([[:digit:]]*\\/[[:alnum:]\\-]*\\).*/\\1 \\2 == \\3 == \\4 \\5/' | sort -k 4 -g | sed 's/ == \\(.*\\) ==/:\\1/' | sed 1,2d</command>
    <alias>netstat listening ports</alias>
    <frequency>360</frequency>
  </localfile>

  <integration>
    <name>slack</name>
    <hook_url>https://slack</hook_url>
    <alert_format>json</alert_format>
    <level>12</level>
    <options>{"pretext":"hello_world\\n\\nanother line\\nC:\\text\\"}</options>
  </integration>

  <var name="test_folder">C:\\Users\\Public\\Documents\\\\</var>
</ossec_config>`;

      const result = replaceIllegalXML(completeXML);

      // Commands should NOT have backslashes escaped
      expect(result).toContain("sed 's/\\([[:alnum:]]\\+\\)");
      expect(result).toContain('\\ +');
      expect(result).toContain('\\1 \\2 == \\3');

      // JSON content should NOT have backslashes escaped
      expect(result).toContain(
        '{"pretext":"hello_world\\n\\nanother line\\nC:\\text\\"}',
      );
      expect(result).toContain('\\n');
      expect(result).toContain('C:\\text\\');

      // Windows paths in var tags SHOULD be escaped
      expect(result).toContain(
        'C:&backslash;Users&backslash;Public&backslash;Documents&backslash;&backslash;',
      );
      expect(result).not.toContain('C:\\Users\\Public\\Documents\\\\');

      // Verify XML structure is preserved
      expect(result).toContain('<ossec_config>');
      expect(result).toContain('</ossec_config>');
      expect(result).toContain('<command>');
      expect(result).toContain('</command>');
      expect(result).toContain('<options>');
      expect(result).toContain('</options>');
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
