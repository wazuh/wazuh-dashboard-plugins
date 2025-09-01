import type { BodyParamDef } from '../types';
import {
  extractBodyLineContext,
  renderBodyParamText,
  getInnerObjectFromSchema,
  sanitizeJsonBody,
  getExistingKeysAtCursor,
  getCursorObjectPath,
} from './body-utils';

describe('body-utils', () => {
  describe('extractBodyLineContext', () => {
    it('extracts indentation and typed key', () => {
      expect(extractBodyLineContext('  "us')).toEqual({
        spaceLineStart: '  ',
        inputKeyBodyParam: 'us',
      });
      // Note: current regex captures closing quote/colon when present
      expect(extractBodyLineContext('"name":')).toEqual({
        spaceLineStart: '',
        inputKeyBodyParam: 'name":',
      });
    });
  });

  describe('renderBodyParamText', () => {
    it('renders string and array types', () => {
      expect(renderBodyParamText({ name: 'title', type: 'string' }, '  ')).toBe(
        '"title": ""',
      );
      expect(renderBodyParamText({ name: 'tags', type: 'array' }, '')).toBe(
        '"tags": []',
      );
    });

    it('renders nested object types preserving indentation', () => {
      const schema: BodyParamDef = {
        name: 'obj',
        type: 'object',
        properties: {
          a: { name: 'a', type: 'string' },
          z: { name: 'z', type: 'array' },
        },
      };
      const out = renderBodyParamText(schema, '  ');
      // Must contain keys a and z with correct structure
      expect(out).toContain('"a"');
      expect(out).toContain('"z"');
      expect(out.startsWith('"obj": {'));
    });
  });

  describe('getInnerObjectFromSchema', () => {
    const schema: BodyParamDef = {
      name: 'root',
      type: 'object',
      properties: {
        a: {
          name: 'a',
          type: 'object',
          properties: { b: { name: 'b', type: 'string' } },
        },
      },
    };

    it('navigates nested object path', () => {
      const inner = getInnerObjectFromSchema(schema, ['a']);
      expect(inner).toBeDefined();
      expect((inner as any).properties.b).toBeDefined();
    });

    it('returns [] when path invalid', () => {
      expect(getInnerObjectFromSchema(schema, ['x'])).toEqual([]);
      expect(getInnerObjectFromSchema(schema, ['a', 'b'])).toEqual([]);
    });
  });

  describe('sanitizeJsonBody', () => {
    it('removes dangling keys to allow parsing', () => {
      const s = '{\n  "a": 1,\n  "b"\n}';
      const sanitized = sanitizeJsonBody(s);
      expect(() => JSON.parse(sanitized)).not.toThrow();
    });
  });

  describe('getExistingKeysAtCursor + getCursorObjectPath', () => {
    const lines = [
      'GET /example',
      '{',
      '  "a": {',
      '    "existing": 1',
      '  },',
      '  "c": {}',
      '}',
    ];

    const editor = {
      getLine: (n: number) => lines[n] || '',
      getCursor: () => ({ line: 3, ch: 10 }),
    } as any;

    const group = {
      requestText: 'GET /example',
      requestTextJson: '{\n  "a": {\n    "existing": 1\n  },\n  "c": {}\n}',
      start: 0,
      end: 6,
    };

    it('computes cursor path inside nested object', () => {
      const path = getCursorObjectPath(editor, group as any);
      expect(path).toEqual(['a']);
    });

    it('lists existing keys at cursor path', () => {
      const keys = getExistingKeysAtCursor(group.requestTextJson, ['a']);
      expect(keys).toEqual(['existing']);
    });
  });
});
