import { isPermissionError } from './is-permission-error';

describe('isPermissionError', () => {
  it('returns true for the wrapped RBAC denial message', () => {
    const error = new Error(
      'API error: ERR_BAD_REQUEST - Permission denied: Resource type: *:*',
    );

    expect(isPermissionError(error)).toBe(true);
  });

  it('returns true for a lowercase permission denied message', () => {
    const error = new Error('permission denied for resource');

    expect(isPermissionError(error)).toBe(true);
  });

  it('returns true when the marker is in response.data.message', () => {
    const error = {
      response: { data: { message: 'Permission denied: Resource type: *:*' } },
    };

    expect(isPermissionError(error)).toBe(true);
  });

  it('returns false for a generic 500 error', () => {
    const error = new Error('Internal Server Error');

    expect(isPermissionError(error)).toBe(false);
  });

  it('returns false for a network error', () => {
    const error = new Error('Network Error');

    expect(isPermissionError(error)).toBe(false);
  });

  it('returns false for an error with a 403 status but no permission-denial message', () => {
    const error = { response: { status: 403 } };

    expect(isPermissionError(error)).toBe(false);
  });

  it('returns false for undefined, null, or non-Error input without throwing', () => {
    expect(isPermissionError(undefined)).toBe(false);
    expect(isPermissionError(null)).toBe(false);
    expect(isPermissionError('some string')).toBe(false);
    expect(isPermissionError(42)).toBe(false);
  });
});
