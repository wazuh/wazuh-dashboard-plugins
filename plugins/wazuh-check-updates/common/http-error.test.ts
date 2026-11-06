import {
  getHttpErrorBodyMessage,
  getHttpErrorMessage,
  withHttpErrorBodyMessage,
} from './http-error';

const SERVER_MESSAGE =
  'Could not update the CTI content: A content update is already in progress.';

/** Builds an error shaped like the `HttpFetchError` `core.http` rejects with. */
const httpFetchError = (body?: unknown) =>
  Object.assign(new Error('Conflict'), { body });

describe('http-error', () => {
  describe('getHttpErrorBodyMessage', () => {
    test('reads the message of the response body', () => {
      expect(
        getHttpErrorBodyMessage(
          httpFetchError({
            statusCode: 409,
            error: 'Conflict',
            message: SERVER_MESSAGE,
          }),
        ),
      ).toBe(SERVER_MESSAGE);
    });

    test.each([
      ['no body', undefined],
      ['a body that is not an object', 'Conflict'],
      ['a body without a message', { statusCode: 409 }],
      ['a blank message', { message: '  ' }],
      ['a message that is not a string', { message: { reason: 'busy' } }],
    ])('is absent for %s', (_case, body) => {
      expect(getHttpErrorBodyMessage(httpFetchError(body))).toBeUndefined();
    });

    test.each([undefined, null, 'Conflict', 409])(
      'is absent when the error is %p',
      error => {
        expect(getHttpErrorBodyMessage(error)).toBeUndefined();
      },
    );
  });

  describe('getHttpErrorMessage', () => {
    test('prefers the message of the response body', () => {
      expect(
        getHttpErrorMessage(httpFetchError({ message: SERVER_MESSAGE })),
      ).toBe(SERVER_MESSAGE);
    });

    test('falls back to the message of the error', () => {
      expect(getHttpErrorMessage(httpFetchError())).toBe('Conflict');
      expect(getHttpErrorMessage({ message: 'expired_token' })).toBe(
        'expired_token',
      );
    });

    test.each([new Error(''), {}, 'Conflict', undefined])(
      'is absent when %p carries no message',
      error => {
        expect(getHttpErrorMessage(error)).toBeUndefined();
      },
    );
  });

  describe('withHttpErrorBodyMessage', () => {
    test('reports the message of the response body', () => {
      const body = { message: SERVER_MESSAGE };
      const error = httpFetchError(body);
      error.name = 'HttpFetchError';

      const reported = withHttpErrorBodyMessage(error);

      expect(reported).toBeInstanceOf(Error);
      expect(reported.message).toBe(SERVER_MESSAGE);
      expect(reported.name).toBe('HttpFetchError');
      expect(reported.stack).toBe(error.stack);
      expect((reported as { body?: unknown }).body).toBe(body);
    });

    test('returns the error itself when its body has no message', () => {
      const error = httpFetchError({ statusCode: 500 });

      expect(withHttpErrorBodyMessage(error)).toBe(error);
    });

    test('wraps what is not an error', () => {
      const reported = withHttpErrorBodyMessage('Request failed');

      expect(reported).toBeInstanceOf(Error);
      expect(reported.message).toBe('Request failed');
    });
  });
});
