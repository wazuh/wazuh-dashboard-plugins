import { QInterpreter } from './q-interpreter';
import { TEST_CASES_ARRAY, TEST_CASES_STRING_ARRAY } from './q-interpreter.test-cases';

describe('QInterpreter', () => {
  describe('queryObjects getter - cases defined in q-interpreter.test-cases', () => {
    it.each(TEST_CASES_ARRAY)(
      'should parse input "%s" to valid queryObjects array %j ',
      (input, expectedQueryObject) => {
        const qInterpreter = new QInterpreter(input);
        expect(qInterpreter.queryObjects).toEqual(expectedQueryObject);
        expect(qInterpreter.queryObjects).toHaveLength(expectedQueryObject.length);
      }
    );
  });

  describe('queriesToString - cases defined in q-interpreter.test-cases', () => {
    it.each(TEST_CASES_STRING_ARRAY)(
      'should parse input "%s" to valid queryObjects array %s ',
      (input, expectedQueryString) => {
        const qInterpreter = new QInterpreter(input);
        expect(qInterpreter.queriesToString()).toBe(expectedQueryString);
      }
    );
  });

  describe('translateConjuntion', () => {
    it.each([
      ['and', ';'],
      [' and', ';'],
      ['and ', ';'],
      [' and ', ';'],
      ['or', ','],
      [' or', ','],
      ['or ', ','],
      [' or ', ','],
    ])('should translate "%s" conjunto to "%s"', (conjuntion, translated) => {
      expect(QInterpreter.translateConjuntion(conjuntion)).toBe(translated);
    });
  });
});
