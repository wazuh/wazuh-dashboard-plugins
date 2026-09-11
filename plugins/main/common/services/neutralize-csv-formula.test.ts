import {
  CSV_FORMULA_TRIGGER_CHARACTERS,
  neutralizeCsvFormulaValues,
} from './neutralize-csv-formula';

describe('neutralizeCsvFormulaValues', () => {
  describe('formula-leading strings are neutralized', () => {
    it.each`
      trigger | value         | description
      ${'='}  | ${'=1+1'}     | ${'equals'}
      ${'+'}  | ${'+1+1'}     | ${'plus'}
      ${'-'}  | ${'-1+1'}     | ${'minus'}
      ${'@'}  | ${'@SUM(1)'}  | ${'at'}
      ${'\t'} | ${'\t=1+1'}   | ${'tab'}
      ${'\r'} | ${'\r=1+1'}   | ${'carriage return'}
      ${'＝'} | ${'＝1+1'}    | ${'full-width equals'}
      ${'＋'} | ${'＋1+1'}    | ${'full-width plus'}
      ${'－'} | ${'－1+1'}    | ${'full-width minus'}
      ${'＠'} | ${'＠SUM(1)'} | ${'full-width at'}
    `(
      'neutralizes a value leading with $description ($trigger)',
      ({ trigger, value }) => {
        const result = neutralizeCsvFormulaValues(value);

        expect(result.startsWith(trigger)).toBe(false);
        expect(result).toContain(value);
      },
    );

    it('exposes the exhaustive trigger set', () => {
      expect(CSV_FORMULA_TRIGGER_CHARACTERS).toEqual([
        '=',
        '+',
        '-',
        '@',
        '\t',
        '\r',
        '＝',
        '＋',
        '－',
        '＠',
      ]);
    });

    it('prefixes an apostrophe so the original text stays readable', () => {
      expect(neutralizeCsvFormulaValues('=1+1')).toBe("'=1+1");
    });
  });

  describe('values that must not change', () => {
    it('does not neutralize a leading newline', () => {
      expect(neutralizeCsvFormulaValues('\n=1+1')).toBe('\n=1+1');
    });

    it.each`
      value             | description
      ${'plain'}        | ${'a plain string'}
      ${'Ubuntu 22.04'} | ${'an ordinary os name'}
      ${'a=1+1'}        | ${'a trigger that is not leading'}
      ${''}             | ${'an empty string'}
      ${-5}             | ${'a negative number'}
      ${0}              | ${'zero'}
      ${true}           | ${'a boolean'}
      ${null}           | ${'null'}
      ${undefined}      | ${'undefined'}
    `('returns $description unchanged', ({ value }) => {
      expect(neutralizeCsvFormulaValues(value)).toBe(value);
    });

    it('returns a bigint unchanged', () => {
      expect(neutralizeCsvFormulaValues(BigInt(-5))).toBe(BigInt(-5));
    });

    it('neutralizes the string "-5" but not the number -5', () => {
      expect(neutralizeCsvFormulaValues({ a: -5, b: '-5' })).toEqual({
        a: -5,
        b: "'-5",
      });
    });
  });

  describe('recursion reaches every depth', () => {
    it('reaches a value nested in an object', () => {
      expect(
        neutralizeCsvFormulaValues({ id: '001', os: { name: '=1+1' } }),
      ).toEqual({ id: '001', os: { name: "'=1+1" } });
    });

    it('reaches a value inside an array', () => {
      expect(neutralizeCsvFormulaValues(['default', '=1+1'])).toEqual([
        'default',
        "'=1+1",
      ]);
    });

    it('reaches an array held by an object key', () => {
      expect(
        neutralizeCsvFormulaValues({ group: ['default', '=1+1'] }),
      ).toEqual({ group: ['default', "'=1+1"] });
    });

    it('reaches an object nested inside an array of rows', () => {
      expect(
        neutralizeCsvFormulaValues([{ os: { name: '＝cmd' } }, { os: {} }]),
      ).toEqual([{ os: { name: "'＝cmd" } }, { os: {} }]);
    });
  });

  describe('structure is preserved', () => {
    it('does not mutate the input', () => {
      const input = { id: '001', os: { name: '=1+1' }, group: ['=1+1'] };

      neutralizeCsvFormulaValues(input);

      expect(input).toEqual({
        id: '001',
        os: { name: '=1+1' },
        group: ['=1+1'],
      });
    });

    it('returns a copy, not the same reference', () => {
      const input = { os: { name: '=1+1' } };
      const result = neutralizeCsvFormulaValues(input);

      expect(result).not.toBe(input);
      expect(result.os).not.toBe(input.os);
    });

    it('preserves key order and never rewrites a key', () => {
      const result = neutralizeCsvFormulaValues({
        '=x': '=1+1',
        id: '001',
        '@y': 'plain',
      });

      expect(Object.keys(result)).toEqual(['=x', 'id', '@y']);
      expect(result['=x']).toBe("'=1+1");
    });

    it('returns a Date by reference so serialization is unchanged', () => {
      const date = new Date('2026-01-01T00:00:00.000Z');
      const result = neutralizeCsvFormulaValues({ dateAdd: date });

      expect(result.dateAdd).toBe(date);
    });
  });
});
