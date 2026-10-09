import { isRateLimitError } from './rate-limit';

describe('isRateLimitError', () => {
  it.each([
    [true, { response: { status: 429 } }],
    [false, { response: { status: 403 } }],
    [false, new Error('socket hang up')],
    [false, null],
  ])('is %p for %p', (expected, error) => {
    expect(isRateLimitError(error)).toBe(expected);
  });
});
