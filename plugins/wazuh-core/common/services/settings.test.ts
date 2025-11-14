import { formatLabelValuePair } from './settings';

describe('[settings] Methods', () => {
  describe('formatLabelValuePair: Format the label-value pairs used to display the allowed values', () => {
    it.each`
      label          | value   | expected
      ${'TestLabel'} | ${true} | ${'true (TestLabel)'}
      ${'true'}      | ${true} | ${'true'}
    `(
      `label: $label | value: $value | expected: $expected`,
      ({ label, expected, value }) => {
        expect(formatLabelValuePair(label, value)).toBe(expected);
      },
    );
  });
});
