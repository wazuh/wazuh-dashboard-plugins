import { isRateLimitError, RATE_LIMIT_STATUS_CODE } from './rate-limit';

describe('isRateLimitError', () => {
  it('is true when the response of the error has the 429 status', () => {
    expect(isRateLimitError({ response: { status: 429 } })).toBe(true);
    expect(
      isRateLimitError(
        Object.assign(new Error('rate limited'), {
          response: { status: RATE_LIMIT_STATUS_CODE },
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ['another status', { response: { status: 403 } }],
    ['a response without status', { response: {} }],
    ['an error without response', new Error('socket hang up')],
    ['a string', '429'],
    ['null', null],
    ['undefined', undefined],
  ])('is false for %s', (_description, error) => {
    expect(isRateLimitError(error)).toBe(false);
  });
});
