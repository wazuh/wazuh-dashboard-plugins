import { renderValueNoThenEnabled, renderValueYesThenEnabled } from './utils';

describe('renderValueNoThenEnabled', () => {
  it.each`
    value        | expected
    ${'no'}      | ${'enabled'}
    ${'yes'}     | ${'disabled'}
    ${undefined} | ${'disabled'}
  `('returns $expected for $value', ({ value, expected }) => {
    expect(renderValueNoThenEnabled(value)).toBe(expected);
  });
});

describe('renderValueYesThenEnabled', () => {
  it.each`
    value        | expected
    ${'yes'}     | ${'enabled'}
    ${1}         | ${'enabled'}
    ${'no'}      | ${'disabled'}
    ${0}         | ${'disabled'}
    ${undefined} | ${'disabled'}
  `('returns $expected for $value', ({ value, expected }) => {
    expect(renderValueYesThenEnabled(value)).toBe(expected);
  });
});
