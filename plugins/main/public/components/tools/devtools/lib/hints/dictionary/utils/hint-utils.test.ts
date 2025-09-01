import { dedupeByText, sortCaseInsensitive, limitToSingleQuestionMark } from './hint-utils';

describe('hint-utils', () => {
  describe('dedupeByText', () => {
    it('removes duplicates for string items', () => {
      const out = dedupeByText(['a', 'b', 'a', 'A']);
      // Case-sensitive de-dup (relies on exact text)
      expect(out).toEqual(['a', 'b', 'A']);
    });

    it('removes duplicates based on .text for objects', () => {
      const items = [
        { text: 'a' },
        { text: 'b' },
        { text: 'a' },
        { text: 'c', displayText: 'C' },
      ];
      const out = dedupeByText(items as any);
      expect(out).toEqual([{ text: 'a' }, { text: 'b' }, { text: 'c', displayText: 'C' }] as any);
    });
  });

  describe('sortCaseInsensitive', () => {
    it('sorts by displayText/text ignoring case', () => {
      const items = [
        { text: 'z' },
        { text: 'A' },
        { displayText: 'm' },
        'b',
      ] as any;
      const out = sortCaseInsensitive(items);
      // A, b, m, z (case-insensitive)
      expect(out.map((i: any) => i.displayText || i.text || i)).toEqual(['A', 'b', 'm', 'z']);
    });
  });

  describe('limitToSingleQuestionMark', () => {
    it('keeps only the first ? in string items', () => {
      expect(limitToSingleQuestionMark(['a??b?c'])[0]).toBe('a?bc');
    });

    it('keeps only the first ? in object.text', () => {
      const out = limitToSingleQuestionMark([{ text: 'x??y' } as any]);
      expect((out[0] as any).text).toBe('x?y');
    });
  });
});

