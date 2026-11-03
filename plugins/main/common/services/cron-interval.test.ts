import { isValidCronInterval } from './cron-interval';

describe('isValidCronInterval', () => {
  it.each`
    expression          | expected
    ${'0 */5 * * * *'}  | ${true}
    ${'*/5 * * * *'}    | ${true}
    ${'custom'}         | ${false}
    ${'0 0 0  1 * *'}   | ${false}
    ${' 0 */5 * * * *'} | ${false}
    ${'0 */5 * * * * '} | ${false}
    ${'0\t*/5 * * * *'} | ${false}
  `('$expression is valid: $expected', ({ expression, expected }) => {
    expect(isValidCronInterval(expression)).toBe(expected);
  });
});
